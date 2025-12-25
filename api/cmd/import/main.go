package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode"

	"gofr.dev/pkg/gofr"
)

type RecoveredPoem struct {
	URL         string            `json:"url"`
	Title       string            `json:"title"`
	Author      string            `json:"author"`
	AuthorURL   string            `json:"author_url"`
	Date        string            `json:"date"`
	ContentText string            `json:"content_text"`
	ContentHTML string            `json:"content_html"`
	Tags        []string          `json:"tags"`
	ExtractedAt string            `json:"extracted_at"`
	Comments    []RecoveredComment `json:"comments"`
}

type RecoveredComment struct {
	Author    string `json:"author"`
	Timestamp string `json:"timestamp"`
	Text      string `json:"text"`
	IsReply   bool   `json:"is_reply"`
}

// authorAliases maps old/duplicate slugs to canonical slugs
// This ensures poems from the same author under different names get merged
var authorAliases = map[string]string{
	"nirala":                  "suryakant-tripathi-nirala",
	"admin":                   "vikash",
	"anandavalli-r-chandran":  "medhini",
	// Add more aliases as discovered
}

func main() {
	app := gofr.NewCMD()

	app.SubCommand("import", func(ctx *gofr.Context) (any, error) {
		recoveredDir := ctx.Param("dir")
		if recoveredDir == "" {
			recoveredDir = "../recovered_poems/by_author"
		}

		fmt.Printf("Importing poems from: %s\n", recoveredDir)

		// Track authors we've already inserted
		authorCache := make(map[string]int64)

		// Walk through all JSON files
		var imported, skipped, errors int

		err := filepath.Walk(recoveredDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if info.IsDir() || !strings.HasSuffix(path, ".json") {
				return nil
			}

			// Read and parse JSON
			data, err := os.ReadFile(path)
			if err != nil {
				fmt.Printf("Error reading %s: %v\n", path, err)
				errors++
				return nil
			}

			var poem RecoveredPoem
			if err := json.Unmarshal(data, &poem); err != nil {
				fmt.Printf("Error parsing %s: %v\n", path, err)
				errors++
				return nil
			}

			// Skip if no title or content
			if poem.Title == "" || poem.ContentText == "" {
				skipped++
				return nil
			}

			// Get or create author
			authorName := poem.Author
			if authorName == "" || strings.ToLower(authorName) == "unknown" {
				// Skip poems without proper author attribution
				skipped++
				return nil
			}
			// Try to extract clean slug from author URL first, fallback to name
			authorSlug := extractSlugFromURL(poem.AuthorURL)
			if authorSlug == "" || !isASCII(authorSlug) {
				authorSlug = slugify(authorName)
			}
			// If slug still has non-ASCII, use a transliterated or hash-based fallback
			if !isASCII(authorSlug) {
				// Extract from URL path if available
				if urlSlug := extractSlugFromURL(poem.AuthorURL); urlSlug != "" && isASCII(urlSlug) {
					authorSlug = urlSlug
				}
			}

			// Apply author alias mapping to merge duplicates
			if canonical, exists := authorAliases[authorSlug]; exists {
				fmt.Printf("Mapping author slug '%s' -> '%s'\n", authorSlug, canonical)
				authorSlug = canonical
			}

			authorID, exists := authorCache[authorSlug]
			if !exists {
				// Try to find existing author
				err := ctx.SQL.QueryRowContext(ctx, "SELECT id FROM authors WHERE slug = ?", authorSlug).Scan(&authorID)
				if err != nil {
					// Insert new author
					result, err := ctx.SQL.ExecContext(ctx,
						"INSERT INTO authors (slug, name, legacy_url) VALUES (?, ?, ?)",
						authorSlug, authorName, poem.AuthorURL)
					if err != nil {
						fmt.Printf("Error inserting author %s: %v\n", authorName, err)
						errors++
						return nil
					}
					authorID, _ = result.LastInsertId()
					fmt.Printf("Created author: %s (ID: %d)\n", authorName, authorID)
				}
				authorCache[authorSlug] = authorID
			}

			// Create poem slug
			poemSlug := slugify(poem.Title)

			// Detect language from tags first, then fall back to character detection
			language := detectLanguageFromTags(poem.Tags)
			if language == "" {
				language = detectLanguage(poem.ContentText)
			}

			// Parse original date
			var originalDate *string
			if poem.Date != "" {
				parsed := parseDate(poem.Date)
				if parsed != "" {
					originalDate = &parsed
				}
			}

			// Convert tags to JSON
			var tagsJSON *string
			if len(poem.Tags) > 0 {
				tagsBytes, _ := json.Marshal(poem.Tags)
				tagsStr := string(tagsBytes)
				tagsJSON = &tagsStr
			}

			// Check if poem already exists
			var existingID int64
			err = ctx.SQL.QueryRowContext(ctx,
				"SELECT id FROM poems WHERE author_id = ? AND slug = ?",
				authorID, poemSlug).Scan(&existingID)

			if err == nil {
				// Poem exists, skip
				skipped++
				return nil
			}

			// Insert poem
			result, err := ctx.SQL.ExecContext(ctx,
				`INSERT INTO poems (author_id, slug, title, content_text, content_html,
				                    language, tags, original_url, original_date)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				authorID, poemSlug, poem.Title, poem.ContentText, poem.ContentHTML,
				language, tagsJSON, poem.URL, originalDate)

			if err != nil {
				fmt.Printf("Error inserting poem '%s': %v\n", poem.Title, err)
				errors++
				return nil
			}

			poemID, _ := result.LastInsertId()

			// Insert comments if any
			if len(poem.Comments) > 0 {
				for _, comment := range poem.Comments {
					// Parse comment timestamp
					var commentDate *string
					if comment.Timestamp != "" {
						parsed := parseCommentDate(comment.Timestamp)
						if parsed != "" {
							commentDate = &parsed
						}
					}

					// Try to match comment author to existing author
					var commentAuthorID *int64
					var matchedID int64
					err = ctx.SQL.QueryRowContext(ctx,
						"SELECT id FROM authors WHERE LOWER(name) = LOWER(?)",
						comment.Author).Scan(&matchedID)
					if err == nil {
						commentAuthorID = &matchedID
					}

					_, err = ctx.SQL.ExecContext(ctx,
						`INSERT INTO comments (poem_id, author_id, author_name, content, commented_at)
						 VALUES (?, ?, ?, ?, ?)`,
						poemID, commentAuthorID, comment.Author, comment.Text, commentDate)
					if err != nil {
						// Don't fail on comment errors, just log
						fmt.Printf("  Warning: failed to insert comment: %v\n", err)
					}
				}
			}

			imported++
			if imported%100 == 0 {
				fmt.Printf("Imported %d poems...\n", imported)
			}

			return nil
		})

		if err != nil {
			return nil, err
		}

		fmt.Printf("\n=== Import Complete ===\n")
		fmt.Printf("Imported: %d\n", imported)
		fmt.Printf("Skipped: %d\n", skipped)
		fmt.Printf("Errors: %d\n", errors)
		fmt.Printf("Authors: %d\n", len(authorCache))

		return nil, nil
	})

	app.Run()
}

func slugify(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)

	// Replace spaces with hyphens
	s = strings.ReplaceAll(s, " ", "-")

	// Remove special characters but keep unicode letters
	var result strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_' {
			result.WriteRune(r)
		}
	}

	s = result.String()

	// Remove multiple consecutive hyphens
	re := regexp.MustCompile(`-+`)
	s = re.ReplaceAllString(s, "-")

	// Trim hyphens from ends
	s = strings.Trim(s, "-")

	// Limit length
	if len(s) > 100 {
		s = s[:100]
	}

	if s == "" {
		s = "untitled"
	}

	return s
}

func detectLanguageFromTags(tags []string) string {
	// Check tags for language indicators
	for _, tag := range tags {
		tagLower := strings.ToLower(tag)
		if strings.Contains(tagLower, "hindi") {
			return "hindi"
		}
		if strings.Contains(tagLower, "marathi") {
			return "marathi"
		}
		if strings.Contains(tagLower, "english") {
			return "english"
		}
		if strings.Contains(tagLower, "gujarati") {
			return "gujarati"
		}
		if strings.Contains(tagLower, "punjabi") {
			return "punjabi"
		}
		if strings.Contains(tagLower, "bengali") || strings.Contains(tagLower, "bangla") {
			return "bengali"
		}
		if strings.Contains(tagLower, "tamil") {
			return "tamil"
		}
		if strings.Contains(tagLower, "telugu") {
			return "telugu"
		}
		if strings.Contains(tagLower, "urdu") {
			return "urdu"
		}
	}
	return "" // Not found in tags
}

func detectLanguage(text string) string {
	// Count Devanagari characters
	devanagari := 0
	total := 0

	for _, r := range text {
		if unicode.IsLetter(r) {
			total++
			// Devanagari Unicode range: U+0900 to U+097F
			if r >= 0x0900 && r <= 0x097F {
				devanagari++
			}
		}
	}

	if total == 0 {
		return "other"
	}

	ratio := float64(devanagari) / float64(total)
	if ratio > 0.3 {
		return "hindi"
	}

	return "english"
}

func parseDate(dateStr string) string {
	// Try various date formats
	formats := []string{
		"January 2, 2006",
		"Jan 2, 2006",
		"2006-01-02",
		"02/01/2006",
		"2 January 2006",
		"February 3, 2008",
	}

	for _, format := range formats {
		t, err := time.Parse(format, dateStr)
		if err == nil {
			return t.Format("2006-01-02")
		}
	}

	return ""
}

func parseCommentDate(dateStr string) string {
	// Comment timestamps like "30 May, 2009 @2:07 pm" or "May 30th, 2009 at 5:48 pm"
	// Clean up the string first
	dateStr = strings.ReplaceAll(dateStr, "@", "")
	dateStr = strings.ReplaceAll(dateStr, " at ", " ")
	dateStr = strings.ReplaceAll(dateStr, "th,", ",")
	dateStr = strings.ReplaceAll(dateStr, "st,", ",")
	dateStr = strings.ReplaceAll(dateStr, "nd,", ",")
	dateStr = strings.ReplaceAll(dateStr, "rd,", ",")
	dateStr = strings.TrimSpace(dateStr)

	formats := []string{
		"2 January, 2006 3:04 pm",
		"2 Jan, 2006 3:04 pm",
		"January 2, 2006 3:04 pm",
		"Jan 2, 2006 3:04 pm",
		"2 January 2006 3:04 pm",
		"January 2, 2006",
		"2 January, 2006",
	}

	for _, format := range formats {
		t, err := time.Parse(format, dateStr)
		if err == nil {
			return t.Format("2006-01-02 15:04:05")
		}
	}

	return ""
}

// extractSlugFromURL extracts the author slug from a p4poetry author URL
// e.g., "http://p4poetry.com/author/nirala/" -> "nirala"
func extractSlugFromURL(url string) string {
	// Match patterns like /author/username/ or /author/username
	re := regexp.MustCompile(`/author/([^/]+)/?`)
	matches := re.FindStringSubmatch(url)
	if len(matches) >= 2 {
		return strings.ToLower(matches[1])
	}
	return ""
}

// isASCII checks if a string contains only ASCII characters
func isASCII(s string) bool {
	for _, r := range s {
		if r > 127 {
			return false
		}
	}
	return true
}

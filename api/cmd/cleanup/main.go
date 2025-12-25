package main

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"gofr.dev/pkg/gofr"
)

type Comment struct {
	AuthorName  string
	Content     string
	CommentedAt *time.Time
}

func main() {
	app := gofr.NewCMD()

	app.SubCommand("run", func(ctx *gofr.Context) (any, error) {
		fmt.Println("Cleaning up poem content and extracting comments...")

		// Get all poems
		rows, err := ctx.SQL.QueryContext(ctx, "SELECT id, content_text FROM poems")
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var cleaned, unchanged, commentsExtracted int

		for rows.Next() {
			var id int64
			var content string
			if err := rows.Scan(&id, &content); err != nil {
				return nil, err
			}

			// Extract comments first
			comments := extractComments(content)

			// Insert comments into database
			for _, c := range comments {
				_, err := ctx.SQL.ExecContext(ctx,
					"INSERT INTO comments (poem_id, author_name, content, commented_at) VALUES (?, ?, ?, ?)",
					id, c.AuthorName, c.Content, c.CommentedAt)
				if err != nil {
					// Might be duplicate, ignore
					continue
				}
				commentsExtracted++
			}

			// Clean the content
			cleanedContent := cleanContent(content)

			if cleanedContent != content {
				_, err := ctx.SQL.ExecContext(ctx,
					"UPDATE poems SET content_text = ? WHERE id = ?",
					cleanedContent, id)
				if err != nil {
					fmt.Printf("Error updating poem %d: %v\n", id, err)
					continue
				}
				cleaned++
				if cleaned%50 == 0 {
					fmt.Printf("Cleaned %d poems, extracted %d comments...\n", cleaned, commentsExtracted)
				}
			} else {
				unchanged++
			}
		}

		fmt.Printf("\n=== Cleanup Complete ===\n")
		fmt.Printf("Cleaned: %d\n", cleaned)
		fmt.Printf("Unchanged: %d\n", unchanged)
		fmt.Printf("Comments extracted: %d\n", commentsExtracted)

		return nil, nil
	})

	app.Run()
}

func extractComments(content string) []Comment {
	var comments []Comment

	// Find the Comments section
	commentsIdx := strings.Index(content, "\nComments\n")
	if commentsIdx == -1 {
		return comments
	}

	commentsSection := content[commentsIdx:]

	// Pattern: "Comment by\n<author>\non <date> @\n<time>\n<content>\n[\nComment on this comment\n]"
	// Updated pattern to handle the format
	commentPattern := regexp.MustCompile(`Comment by\n([^\n]+)\non ([^\n]+) @\n([^\n]+)\n([\s\S]*?)(?:\[\nComment on this comment\n\]|Leave a comment)`)

	matches := commentPattern.FindAllStringSubmatch(commentsSection, -1)

	for _, match := range matches {
		if len(match) >= 5 {
			authorName := strings.TrimSpace(match[1])
			dateStr := strings.TrimSpace(match[2])
			timeStr := strings.TrimSpace(match[3])
			commentContent := strings.TrimSpace(match[4])

			// Parse date
			var commentedAt *time.Time
			fullDateStr := dateStr + " " + timeStr
			// Try parsing: "25 July, 2008 2:36 am"
			formats := []string{
				"2 January, 2006 3:04 pm",
				"2 January, 2006 3:04 am",
				"02 January, 2006 3:04 pm",
				"02 January, 2006 3:04 am",
			}
			for _, format := range formats {
				if t, err := time.Parse(format, fullDateStr); err == nil {
					commentedAt = &t
					break
				}
			}

			if authorName != "" && commentContent != "" {
				comments = append(comments, Comment{
					AuthorName:  authorName,
					Content:     commentContent,
					CommentedAt: commentedAt,
				})
			}
		}
	}

	return comments
}

func cleanContent(content string) string {
	// Pattern 1: Remove everything after "Share it with others"
	if idx := strings.Index(content, "Share it with others"); idx != -1 {
		content = strings.TrimSpace(content[:idx])
	}

	// Pattern 2: Remove everything after social share markers
	shareMarkers := []string{
		"\nClose\nBookmark and Share",
		"\nBookmark and Share This Page",
		"\nSave to Browser Favorites",
		"\nAsk\nbackflip\nblinklist",
	}
	for _, marker := range shareMarkers {
		if idx := strings.Index(content, marker); idx != -1 {
			content = strings.TrimSpace(content[:idx])
		}
	}

	// Pattern 3: Remove everything after "Comments" section
	commentsPatterns := []string{
		"\nComments\nComment by",
		"\nNo related poems.\n",
		"\nPossibly Related poems:",
		"\nMore »\nNo related poems",
	}
	for _, pattern := range commentsPatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			content = strings.TrimSpace(content[:idx])
		}
	}

	// Pattern 4: Remove trailing form elements
	formPatterns := []string{
		"\nLeave a comment\nName",
		"\nClick to cancel comment",
		"\nNotify me of followup comments",
	}
	for _, pattern := range formPatterns {
		if idx := strings.Index(content, pattern); idx != -1 {
			content = strings.TrimSpace(content[:idx])
		}
	}

	// Pattern 5: Remove RSS feed text
	if idx := strings.Index(content, "\nIf you like this then please subscribe"); idx != -1 {
		content = strings.TrimSpace(content[:idx])
	}

	// Pattern 6: Remove Bookmarkify powered text
	if idx := strings.Index(content, "\nPowered by Bookmarkify"); idx != -1 {
		content = strings.TrimSpace(content[:idx])
	}

	// Pattern 7: Remove tag lines at end (e.g., "Crowned Poem\n,\nHindi Poetry")
	tagPattern := regexp.MustCompile(`\n(Crowned Poem|English Poetry|Hindi Poetry|Uncategorized)(\n,\n|\n)+[^\n]*$`)
	content = tagPattern.ReplaceAllString(content, "")

	// Pattern 8: Remove "More »" and anything after
	if idx := strings.Index(content, "\nMore »"); idx != -1 {
		content = strings.TrimSpace(content[:idx])
	}

	// Clean up trailing dashes and signatures that got cut off badly
	content = strings.TrimSpace(content)

	return content
}

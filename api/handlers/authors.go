package handlers

import (
	"crypto/md5"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"github.com/vikash/p4poetry/api/models"
	"gofr.dev/pkg/gofr"
)

// gravatarURL generates a Gravatar URL from an email address
func gravatarURL(email string) string {
	if email == "" {
		return ""
	}
	email = strings.ToLower(strings.TrimSpace(email))
	hash := md5.Sum([]byte(email))
	return fmt.Sprintf("https://www.gravatar.com/avatar/%x?d=mp&s=200", hash)
}

func ListAuthors(ctx *gofr.Context) (any, error) {
	page, _ := strconv.Atoi(ctx.Param("page"))
	if page < 1 {
		page = 1
	}

	perPage, _ := strconv.Atoi(ctx.Param("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	offset := (page - 1) * perPage

	// Get total count
	var total int
	err := ctx.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM authors").Scan(&total)
	if err != nil {
		return nil, err
	}

	// Get authors with poem count
	query := `
		SELECT a.id, a.slug, a.name, a.bio, a.author_type, a.claimed, a.claimed_email, a.created_at,
		       COUNT(p.id) as poem_count
		FROM authors a
		LEFT JOIN poems p ON a.id = p.author_id
		GROUP BY a.id
		ORDER BY poem_count DESC, a.name ASC
		LIMIT ? OFFSET ?
	`

	rows, err := ctx.SQL.QueryContext(ctx, query, perPage, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var authors []models.Author
	for rows.Next() {
		var a models.Author
		var bio, claimedEmail sql.NullString
		err := rows.Scan(&a.ID, &a.Slug, &a.Name, &bio, &a.AuthorType, &a.Claimed, &claimedEmail, &a.CreatedAt, &a.PoemCount)
		if err != nil {
			return nil, err
		}
		if bio.Valid {
			a.Bio = bio.String
		}
		if a.Claimed && claimedEmail.Valid {
			a.GravatarURL = gravatarURL(claimedEmail.String)
		}
		authors = append(authors, a)
	}

	totalPages := (total + perPage - 1) / perPage

	return models.AuthorListResponse{
		Authors:    authors,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

func GetAuthor(ctx *gofr.Context) (any, error) {
	slug := ctx.PathParam("slug")

	query := `
		SELECT a.id, a.slug, a.name, a.bio, a.author_type, a.legacy_url, a.claimed, a.claimed_email, a.created_at,
		       COUNT(p.id) as poem_count
		FROM authors a
		LEFT JOIN poems p ON a.id = p.author_id
		WHERE a.slug = ?
		GROUP BY a.id
	`

	var a models.Author
	var bio, legacyURL, claimedEmail sql.NullString

	err := ctx.SQL.QueryRowContext(ctx, query, slug).Scan(
		&a.ID, &a.Slug, &a.Name, &bio, &a.AuthorType, &legacyURL, &a.Claimed, &claimedEmail, &a.CreatedAt, &a.PoemCount,
	)
	if err != nil {
		return nil, err
	}

	if bio.Valid {
		a.Bio = bio.String
	}
	if legacyURL.Valid {
		a.LegacyURL = legacyURL.String
	}
	if a.Claimed && claimedEmail.Valid {
		a.GravatarURL = gravatarURL(claimedEmail.String)
	}

	return a, nil
}

func GetAuthorPoems(ctx *gofr.Context) (any, error) {
	slug := ctx.PathParam("slug")

	page, _ := strconv.Atoi(ctx.Param("page"))
	if page < 1 {
		page = 1
	}
	perPage := 20
	offset := (page - 1) * perPage

	// Get author ID first
	var authorID int64
	err := ctx.SQL.QueryRowContext(ctx, "SELECT id FROM authors WHERE slug = ?", slug).Scan(&authorID)
	if err != nil {
		return nil, err
	}

	// Get total count
	var total int
	err = ctx.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM poems WHERE author_id = ?", authorID).Scan(&total)
	if err != nil {
		return nil, err
	}

	// Get poems
	query := `
		SELECT id, slug, title, content_text, language, original_date, created_at
		FROM poems
		WHERE author_id = ?
		ORDER BY original_date DESC, created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := ctx.SQL.QueryContext(ctx, query, authorID, perPage, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var poems []models.Poem
	for rows.Next() {
		var p models.Poem
		var originalDate sql.NullString
		err := rows.Scan(&p.ID, &p.Slug, &p.Title, &p.ContentText, &p.Language, &originalDate, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		if originalDate.Valid {
			p.OriginalDate = originalDate.String
		}
		p.AuthorID = authorID
		poems = append(poems, p)
	}

	totalPages := (total + perPage - 1) / perPage

	return models.PoemListResponse{
		Poems:      poems,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
}

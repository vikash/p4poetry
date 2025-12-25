package handlers

import (
	"database/sql"
	"encoding/json"
	"strconv"

	"github.com/vikash/p4poetry/api/models"
	"gofr.dev/pkg/gofr"
)

func ListPoems(ctx *gofr.Context) (any, error) {
	page, _ := strconv.Atoi(ctx.Param("page"))
	if page < 1 {
		page = 1
	}

	perPage, _ := strconv.Atoi(ctx.Param("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	language := ctx.Param("language")
	offset := (page - 1) * perPage

	// Get total count
	var total int
	countQuery := "SELECT COUNT(*) FROM poems"
	if language != "" {
		countQuery += " WHERE language = ?"
		err := ctx.SQL.QueryRowContext(ctx, countQuery, language).Scan(&total)
		if err != nil {
			return nil, err
		}
	} else {
		err := ctx.SQL.QueryRowContext(ctx, countQuery).Scan(&total)
		if err != nil {
			return nil, err
		}
	}

	// Get poems with author info
	query := `
		SELECT p.id, p.author_id, a.name, a.slug, p.slug, p.title,
		       p.content_text, p.language, p.original_date, p.created_at
		FROM poems p
		JOIN authors a ON p.author_id = a.id
	`
	var rows *sql.Rows
	var err error

	if language != "" {
		query += " WHERE p.language = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
		rows, err = ctx.SQL.QueryContext(ctx, query, language, perPage, offset)
	} else {
		query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?"
		rows, err = ctx.SQL.QueryContext(ctx, query, perPage, offset)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var poems []models.Poem
	for rows.Next() {
		var p models.Poem
		var originalDate sql.NullString
		err := rows.Scan(&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorSlug,
			&p.Slug, &p.Title, &p.ContentText, &p.Language, &originalDate, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		if originalDate.Valid {
			p.OriginalDate = originalDate.String
		}
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

func GetPoem(ctx *gofr.Context) (any, error) {
	slug := ctx.PathParam("slug")

	query := `
		SELECT p.id, p.author_id, a.name, a.slug, p.slug, p.title,
		       p.content_text, p.content_html, p.language, p.tags,
		       p.original_url, p.original_date, p.created_at
		FROM poems p
		JOIN authors a ON p.author_id = a.id
		WHERE p.slug = ?
	`

	var p models.Poem
	var tags, contentHTML, originalURL, originalDate *string

	err := ctx.SQL.QueryRowContext(ctx, query, slug).Scan(
		&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorSlug, &p.Slug, &p.Title,
		&p.ContentText, &contentHTML, &p.Language, &tags,
		&originalURL, &originalDate, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	if contentHTML != nil {
		p.ContentHTML = *contentHTML
	}
	if tags != nil {
		json.Unmarshal([]byte(*tags), &p.Tags)
	}
	if originalURL != nil {
		p.OriginalURL = *originalURL
	}
	if originalDate != nil {
		p.OriginalDate = *originalDate
	}

	return p, nil
}

func GetFeaturedPoem(ctx *gofr.Context) (any, error) {
	query := `
		SELECT p.id, p.author_id, a.name, a.slug, p.slug, p.title,
		       p.content_text, p.language, p.created_at
		FROM poems p
		JOIN authors a ON p.author_id = a.id
		ORDER BY RAND()
		LIMIT 1
	`

	var p models.Poem
	err := ctx.SQL.QueryRowContext(ctx, query).Scan(
		&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorSlug,
		&p.Slug, &p.Title, &p.ContentText, &p.Language, &p.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return p, nil
}

func SearchPoems(ctx *gofr.Context) (any, error) {
	q := ctx.Param("q")
	if q == "" {
		return []models.Poem{}, nil
	}

	page, _ := strconv.Atoi(ctx.Param("page"))
	if page < 1 {
		page = 1
	}
	perPage := 20
	offset := (page - 1) * perPage

	query := `
		SELECT p.id, p.author_id, a.name, a.slug, p.slug, p.title,
		       p.content_text, p.language, p.created_at
		FROM poems p
		JOIN authors a ON p.author_id = a.id
		WHERE MATCH(p.title, p.content_text) AGAINST(? IN NATURAL LANGUAGE MODE)
		LIMIT ? OFFSET ?
	`

	rows, err := ctx.SQL.QueryContext(ctx, query, q, perPage, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var poems []models.Poem
	for rows.Next() {
		var p models.Poem
		err := rows.Scan(&p.ID, &p.AuthorID, &p.AuthorName, &p.AuthorSlug,
			&p.Slug, &p.Title, &p.ContentText, &p.Language, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		poems = append(poems, p)
	}

	return poems, nil
}

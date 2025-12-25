package handlers

import (
	"database/sql"
	"time"

	"gofr.dev/pkg/gofr"
)

type Comment struct {
	ID          int64      `json:"id"`
	PoemID      int64      `json:"poem_id"`
	AuthorID    *int64     `json:"author_id,omitempty"`
	AuthorSlug  string     `json:"author_slug,omitempty"`
	AuthorName  string     `json:"author_name"`
	Content     string     `json:"content"`
	CommentedAt *time.Time `json:"commented_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

func GetPoemComments(ctx *gofr.Context) (any, error) {
	slug := ctx.PathParam("slug")

	// Get poem ID from slug
	var poemID int64
	err := ctx.SQL.QueryRowContext(ctx, "SELECT id FROM poems WHERE slug = ?", slug).Scan(&poemID)
	if err != nil {
		return nil, err
	}

	// Get comments for this poem with author info if linked
	rows, err := ctx.SQL.QueryContext(ctx,
		`SELECT c.id, c.poem_id, c.author_id, a.slug, c.author_name, c.content, c.commented_at, c.created_at
		 FROM comments c
		 LEFT JOIN authors a ON c.author_id = a.id
		 WHERE c.poem_id = ?
		 ORDER BY c.created_at ASC`,
		poemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var c Comment
		var authorID sql.NullInt64
		var authorSlug sql.NullString
		err := rows.Scan(&c.ID, &c.PoemID, &authorID, &authorSlug, &c.AuthorName, &c.Content, &c.CommentedAt, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		if authorID.Valid {
			c.AuthorID = &authorID.Int64
		}
		if authorSlug.Valid {
			c.AuthorSlug = authorSlug.String
		}
		comments = append(comments, c)
	}

	return comments, nil
}

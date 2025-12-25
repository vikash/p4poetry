package handlers

import (
	"time"

	"gofr.dev/pkg/gofr"
)

type Comment struct {
	ID          int64      `json:"id"`
	PoemID      int64      `json:"poem_id"`
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

	// Get comments for this poem
	rows, err := ctx.SQL.QueryContext(ctx,
		"SELECT id, poem_id, author_name, content, commented_at, created_at FROM comments WHERE poem_id = ? ORDER BY commented_at ASC",
		poemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var c Comment
		err := rows.Scan(&c.ID, &c.PoemID, &c.AuthorName, &c.Content, &c.CommentedAt, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}

	return comments, nil
}

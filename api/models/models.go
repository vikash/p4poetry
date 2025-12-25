package models

import "time"

type Author struct {
	ID           int64     `json:"id"`
	Slug         string    `json:"slug"`
	Name         string    `json:"name"`
	Bio          string    `json:"bio,omitempty"`
	AuthorType   string    `json:"author_type"` // 'community' or 'classic'
	LegacyURL    string    `json:"legacy_url,omitempty"`
	Claimed      bool      `json:"claimed"`
	ClaimedEmail string    `json:"-"` // Don't expose email in API
	PoemCount    int       `json:"poem_count,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type Poem struct {
	ID           int64     `json:"id"`
	AuthorID     int64     `json:"author_id"`
	AuthorName   string    `json:"author_name,omitempty"`
	AuthorSlug   string    `json:"author_slug,omitempty"`
	Slug         string    `json:"slug"`
	Title        string    `json:"title"`
	ContentText  string    `json:"content_text"`
	ContentHTML  string    `json:"content_html,omitempty"`
	Language     string    `json:"language"`
	Tags         []string  `json:"tags,omitempty"`
	OriginalURL  string    `json:"original_url,omitempty"`
	OriginalDate string    `json:"original_date,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type Stats struct {
	TotalPoems   int `json:"total_poems"`
	TotalAuthors int `json:"total_authors"`
	Languages    map[string]int `json:"languages"`
}

type PoemListResponse struct {
	Poems      []Poem `json:"poems"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	PerPage    int    `json:"per_page"`
	TotalPages int    `json:"total_pages"`
}

type AuthorListResponse struct {
	Authors    []Author `json:"authors"`
	Total      int      `json:"total"`
	Page       int      `json:"page"`
	PerPage    int      `json:"per_page"`
	TotalPages int      `json:"total_pages"`
}

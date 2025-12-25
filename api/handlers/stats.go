package handlers

import (
	"encoding/json"

	"github.com/vikash/p4poetry/api/models"
	"gofr.dev/pkg/gofr"
)

func GetStats(ctx *gofr.Context) (any, error) {
	var stats models.Stats
	stats.Languages = make(map[string]int)

	// Get total poems
	err := ctx.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM poems").Scan(&stats.TotalPoems)
	if err != nil {
		return nil, err
	}

	// Get total authors
	err = ctx.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM authors").Scan(&stats.TotalAuthors)
	if err != nil {
		return nil, err
	}

	// Get language breakdown
	rows, err := ctx.SQL.QueryContext(ctx, "SELECT language, COUNT(*) FROM poems GROUP BY language")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var lang string
		var count int
		if err := rows.Scan(&lang, &count); err != nil {
			return nil, err
		}
		stats.Languages[lang] = count
	}

	return stats, nil
}

// GetTags returns a list of all unique tags with their counts
func GetTags(ctx *gofr.Context) (any, error) {
	// Query all non-null tags
	rows, err := ctx.SQL.QueryContext(ctx, "SELECT tags FROM poems WHERE tags IS NOT NULL")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tagCounts := make(map[string]int)

	for rows.Next() {
		var tagsJSON string
		if err := rows.Scan(&tagsJSON); err != nil {
			continue
		}

		var tags []string
		if err := json.Unmarshal([]byte(tagsJSON), &tags); err != nil {
			continue
		}

		for _, tag := range tags {
			if tag != "" {
				tagCounts[tag]++
			}
		}
	}

	// Convert to slice of objects for easier frontend consumption
	type TagCount struct {
		Tag   string `json:"tag"`
		Count int    `json:"count"`
	}

	result := make([]TagCount, 0, len(tagCounts))
	for tag, count := range tagCounts {
		result = append(result, TagCount{Tag: tag, Count: count})
	}

	return result, nil
}

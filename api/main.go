package main

import (
	"github.com/vikash/p4poetry/api/handlers"
	"github.com/vikash/p4poetry/api/migrations"
	"gofr.dev/pkg/gofr"
)

func main() {
	app := gofr.New()

	// Run migrations
	app.Migrate(migrations.All())

	// API routes (under /api prefix)
	app.GET("/api/poems", handlers.ListPoems)
	app.GET("/api/poems/search", handlers.SearchPoems)
	app.GET("/api/poems/{slug}", handlers.GetPoem)
	app.GET("/api/poems/{slug}/comments", handlers.GetPoemComments)

	app.GET("/api/authors", handlers.ListAuthors)
	app.GET("/api/authors/{slug}", handlers.GetAuthor)
	app.GET("/api/authors/{slug}/poems", handlers.GetAuthorPoems)

	app.GET("/api/stats", handlers.GetStats)
	app.GET("/api/tags", handlers.GetTags)

	// Serve static frontend files (SPA)
	app.AddStaticFiles("/", "./static")

	app.Run()
}

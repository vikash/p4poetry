package migrations

import "gofr.dev/pkg/gofr/migration"

const createAuthorsTable = `
CREATE TABLE IF NOT EXISTS authors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    author_type ENUM('community', 'classic') NOT NULL DEFAULT 'community',
    legacy_url VARCHAR(500),
    claimed BOOLEAN DEFAULT FALSE,
    claimed_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_authors_slug (slug),
    INDEX idx_authors_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

const createPoemsTable = `
CREATE TABLE IF NOT EXISTS poems (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_text TEXT NOT NULL,
    content_html MEDIUMTEXT,
    language ENUM('english', 'hindi', 'marathi', 'gujarati', 'punjabi', 'bengali', 'tamil', 'telugu', 'urdu', 'other') DEFAULT 'english',
    tags JSON,
    original_url VARCHAR(500),
    original_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    INDEX idx_poems_slug (slug),
    INDEX idx_poems_author (author_id),
    INDEX idx_poems_language (language),
    FULLTEXT INDEX idx_poems_search (title, content_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

const createCommentsTable = `
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    poem_id BIGINT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    commented_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poem_id) REFERENCES poems(id) ON DELETE CASCADE,
    INDEX idx_comments_poem (poem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`

func initialSchema() migration.Migrate {
	return migration.Migrate{
		UP: func(d migration.Datasource) error {
			if _, err := d.SQL.Exec(createAuthorsTable); err != nil {
				return err
			}
			if _, err := d.SQL.Exec(createPoemsTable); err != nil {
				return err
			}
			if _, err := d.SQL.Exec(createCommentsTable); err != nil {
				return err
			}
			return nil
		},
	}
}

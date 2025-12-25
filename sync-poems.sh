#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
LOCAL_DB_HOST="${LOCAL_DB_HOST:-127.0.0.1}"
LOCAL_DB_USER="${LOCAL_DB_USER:-root}"
LOCAL_DB_PASS="${LOCAL_DB_PASS:-root123}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-p4poetry}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-3306}"

# Production DB (from ~/.project-secrets/p4poetry/.env)
if [ -f ~/.project-secrets/p4poetry/.env ]; then
    source ~/.project-secrets/p4poetry/.env
fi

PROD_DB_HOST="${DB_HOST:-}"
PROD_DB_USER="${DB_USER:-}"
PROD_DB_PASS="${DB_PASSWORD:-}"
PROD_DB_NAME="${DB_NAME:-p4poetry}"
PROD_DB_PORT="${DB_PORT:-3306}"

DUMP_FILE="/tmp/p4poetry_sync.sql"
RECOVERED_DIR="${1:-./recovered_poems/by_author}"

usage() {
    echo "Usage: $0 [recovered_poems_dir]"
    echo ""
    echo "Commands:"
    echo "  $0                    - Import from ./recovered_poems/by_author and sync to production"
    echo "  $0 /path/to/poems     - Import from custom directory and sync to production"
    echo "  $0 --import-only      - Only import to local DB, don't sync to production"
    echo "  $0 --sync-only        - Only sync local DB to production (skip import)"
    echo ""
    echo "Environment variables:"
    echo "  LOCAL_DB_HOST, LOCAL_DB_USER, LOCAL_DB_PASS, LOCAL_DB_NAME, LOCAL_DB_PORT"
    echo "  Production credentials loaded from ~/.project-secrets/p4poetry/.env"
}

import_to_local() {
    echo -e "${YELLOW}=== Importing poems to local DB ===${NC}"

    cd "$(dirname "$0")/api"

    # Check if recovered poems directory exists
    if [ ! -d "$RECOVERED_DIR" ]; then
        echo -e "${RED}Error: Directory not found: $RECOVERED_DIR${NC}"
        exit 1
    fi

    # Count poems to import
    POEM_COUNT=$(find "$RECOVERED_DIR" -name "*.json" | wc -l | tr -d ' ')
    echo "Found $POEM_COUNT poem files in $RECOVERED_DIR"

    # Run import command
    DB_HOST=$LOCAL_DB_HOST DB_USER=$LOCAL_DB_USER DB_PASSWORD=$LOCAL_DB_PASS \
    DB_NAME=$LOCAL_DB_NAME DB_PORT=$LOCAL_DB_PORT \
    go run ./cmd/import import --dir="$RECOVERED_DIR"

    echo -e "${GREEN}Import complete!${NC}"
}

export_local_db() {
    echo -e "${YELLOW}=== Exporting local DB ===${NC}"

    mysqldump -h "$LOCAL_DB_HOST" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASS" \
        --single-transaction --routines --triggers \
        --ignore-table="${LOCAL_DB_NAME}.gofr_migrations" \
        "$LOCAL_DB_NAME" > "$DUMP_FILE"

    DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
    echo "Exported to $DUMP_FILE ($DUMP_SIZE)"
}

sync_to_production() {
    echo -e "${YELLOW}=== Syncing to production DB ===${NC}"

    if [ -z "$PROD_DB_HOST" ] || [ -z "$PROD_DB_USER" ] || [ -z "$PROD_DB_PASS" ]; then
        echo -e "${RED}Error: Production DB credentials not found${NC}"
        echo "Please ensure ~/.project-secrets/p4poetry/.env exists with DB_HOST, DB_USER, DB_PASSWORD"
        exit 1
    fi

    echo "Target: $PROD_DB_USER@$PROD_DB_HOST:$PROD_DB_PORT/$PROD_DB_NAME"

    # Clear existing data (except migrations) and import
    echo "Clearing production tables..."
    mysql -h "$PROD_DB_HOST" -P "$PROD_DB_PORT" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE comments;
TRUNCATE TABLE poems;
TRUNCATE TABLE authors;
SET FOREIGN_KEY_CHECKS = 1;
EOF

    echo "Importing data..."
    mysql -h "$PROD_DB_HOST" -P "$PROD_DB_PORT" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" < "$DUMP_FILE"

    # Show counts
    echo -e "${GREEN}=== Sync Complete ===${NC}"
    mysql -h "$PROD_DB_HOST" -P "$PROD_DB_PORT" -u "$PROD_DB_USER" -p"$PROD_DB_PASS" "$PROD_DB_NAME" -e \
        "SELECT 'authors' as 'table', COUNT(*) as count FROM authors UNION ALL SELECT 'poems', COUNT(*) FROM poems UNION ALL SELECT 'comments', COUNT(*) FROM comments;"
}

# Main
case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    --import-only)
        RECOVERED_DIR="${2:-./recovered_poems/by_author}"
        import_to_local
        ;;
    --sync-only)
        export_local_db
        sync_to_production
        ;;
    *)
        if [ -n "$1" ] && [ -d "$1" ]; then
            RECOVERED_DIR="$1"
        fi
        import_to_local
        export_local_db
        sync_to_production
        ;;
esac

echo -e "${GREEN}Done!${NC}"

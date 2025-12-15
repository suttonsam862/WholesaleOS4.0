#!/bin/bash
# Sync Production Database to Development
# 
# This script copies production data into the development database.
# 
# Usage: PROD_DATABASE_URL="your-production-url" ./scripts/sync-prod-to-dev.sh

set -e

if [ -z "$PROD_DATABASE_URL" ]; then
  echo "❌ Error: PROD_DATABASE_URL environment variable is required"
  echo ""
  echo "Usage:"
  echo "  PROD_DATABASE_URL=\"your-production-url\" ./scripts/sync-prod-to-dev.sh"
  echo ""
  echo "To get your production URL:"
  echo "  1. Go to the Database pane in Replit"
  echo "  2. Switch to Production"
  echo "  3. Copy the connection URL"
  exit 1
fi

echo "🔄 Step 1: Exporting production database..."
pg_dump "$PROD_DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  -f scripts/prod-data-dump.sql

echo "✅ Production data exported to: scripts/prod-data-dump.sql"

echo ""
echo "🗑️  Step 2: Clearing development database..."
psql "$DATABASE_URL" -c "
DO \$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"

echo "✅ Development database cleared"

echo ""
echo "📥 Step 3: Importing production data into development..."
psql "$DATABASE_URL" -f scripts/prod-data-dump.sql

echo ""
echo "✅ Done! Development database now mirrors production."

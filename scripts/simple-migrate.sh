#!/bin/bash
# Simple Development to Production Migration
# 
# This script dumps development data and provides instructions
# for importing to production.
#
# Usage: ./scripts/simple-migrate.sh

set -e

echo "🚀 Exporting development database..."

# Export development database to a SQL dump file
pg_dump "$DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  -f scripts/dev-data-dump.sql

echo "✅ Development data exported to: scripts/dev-data-dump.sql"
echo ""
echo "📋 Next Steps:"
echo "1. Go to the Database pane in Replit"
echo "2. Switch to Production database"
echo "3. Copy your production DATABASE_URL"
echo "4. Run: psql YOUR_PRODUCTION_URL -f scripts/dev-data-dump.sql"
echo ""
echo "⚠️  To clear production data first, run this in production:"
echo "   TRUNCATE TABLE users, organizations, orders, leads, contacts CASCADE;"

#!/bin/bash
# Script to initialize PostgreSQL database schema
# This can be run from the VPS or locally if database is accessible

set -e

echo "🚀 Starting database migration..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST="${POSTGRES_HOST:-finlit-postgres-db-g6ifwu}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-financial_literacy}"
DB_USER="${POSTGRES_USER:-finlit_user}"
DB_PASSWORD="${POSTGRES_PASSWORD:-FinLit2025SecurePassword}"

# Export for psql
export PGPASSWORD="$DB_PASSWORD"

echo "📊 Connecting to database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "❌ psql is not installed. Installing PostgreSQL client..."
  # Try to install (adjust for your OS)
  if command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y postgresql-client
  elif command -v yum &> /dev/null; then
    sudo yum install -y postgresql
  elif command -v apk &> /dev/null; then
    apk add --no-cache postgresql-client
  else
    echo "⚠️  Please install PostgreSQL client manually"
    echo "   Or use the Node.js migration script: node migration/init-database.js"
    exit 1
  fi
fi

# Run schema migration
echo ""
echo "📄 Running schema migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f migration/supabase-to-postgres.sql

if [ $? -eq 0 ]; then
  echo "✅ Schema migration completed successfully"
else
  echo "❌ Schema migration failed"
  exit 1
fi

# Run RLS policies migration
echo ""
echo "📄 Running RLS policies migration..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f migration/migrate-rls-policies.sql

if [ $? -eq 0 ]; then
  echo "✅ RLS policies migration completed successfully"
else
  echo "⚠️  RLS policies migration had warnings (this may be OK if policies already exist)"
fi

# Verify tables
echo ""
echo "🔍 Verifying database schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT COUNT(*) 
  FROM information_schema.tables 
  WHERE table_schema = 'public';
" | xargs

echo ""
echo "✨ Database migration complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If you have existing data, run: node migration/data-import.js"
echo "   2. Verify data integrity: node migration/verify-migration.js"
echo "   3. Deploy the application via Dokploy"

# Clean up
unset PGPASSWORD


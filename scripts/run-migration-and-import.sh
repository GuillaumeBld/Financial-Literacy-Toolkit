#!/bin/bash
# Run migration and import questions
# This script will prompt for DATABASE_URL if not set

set -e

echo "=== Question Import Setup ==="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set."
    echo ""
    echo "Please provide your database connection string."
    echo "Format: postgresql://user:password@host:port/database"
    echo ""
    echo "Common examples:"
    echo "  Local Docker: postgresql://finlit_user:change_me_in_production@localhost:5432/financial_literacy"
    echo "  Production: postgresql://user:password@your-db-host:5432/financial_literacy"
    echo ""
    read -p "Enter DATABASE_URL: " DATABASE_URL
    export DATABASE_URL
fi

echo "✓ Using DATABASE_URL: ${DATABASE_URL%%:*}//***@${DATABASE_URL##*@}"
echo ""

# Test connection
echo "Testing database connection..."
python3 << 'PYTHON_SCRIPT'
import os
import psycopg2
import sys

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("✗ DATABASE_URL not set")
    sys.exit(1)

try:
    conn = psycopg2.connect(db_url, connect_timeout=5)
    cur = conn.cursor()
    cur.execute("SELECT version();")
    version = cur.fetchone()[0]
    print(f"✓ Connected to database")
    print(f"  {version.split(',')[0]}")
    cur.close()
    conn.close()
except psycopg2.OperationalError as e:
    print(f"✗ Cannot connect to database: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo ""
    echo "Please check your DATABASE_URL and try again."
    exit 1
fi

echo ""
echo "Step 1: Running migration to add is_active field..."
echo ""

# Run migration
python3 << 'PYTHON_SCRIPT'
import os
import psycopg2
import sys

db_url = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    # Read migration file
    migration_file = 'infra/migration-add-is-active-to-items.sql'
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    # Execute migration
    cur.execute(migration_sql)
    conn.commit()
    
    # Verify migration
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='items' AND column_name='is_active'
    """)
    
    if cur.fetchone():
        print("✓ Migration successful - is_active column exists")
    else:
        print("⚠️  Migration may have failed - is_active column not found")
        sys.exit(1)
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Migration error: {e}")
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "Migration failed. Please check the error above."
    exit 1
fi

echo ""
echo "Step 2: Importing questions from CSV files..."
echo ""

# Run import script
python3 scripts/import_questions.py

if [ $? -eq 0 ]; then
    echo ""
    echo "=== Setup Complete ==="
    echo ""
    echo "✓ Migration applied"
    echo "✓ Questions imported"
    echo ""
    echo "Next steps:"
    echo "1. Log into the instructor portal"
    echo "2. Navigate to the Questions page"
    echo "3. Verify that:"
    echo "   - All questions are displayed"
    echo "   - Active questions show green 'Active' badge"
    echo "   - Inactive questions show gray 'Inactive' badge"
    echo "   - Only shortlisted questions from Final_Shortlist_30+8.csv are active"
else
    echo ""
    echo "✗ Import failed. Please check the error above."
    exit 1
fi


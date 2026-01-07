#!/bin/bash
# Test script to verify question import and display

set -e

echo "=== Question Import Test Script ==="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL environment variable is not set"
    echo "Please set it before running the import script:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    echo "Or if using docker-compose, you can use:"
    echo "  export DATABASE_URL='postgresql://finlit_user:change_me_in_production@localhost:5432/financial_literacy'"
    exit 1
fi

echo "✓ DATABASE_URL is set"
echo ""

# Check if migration has been run
echo "Checking if migration has been run..."
python3 << 'PYTHON_SCRIPT'
import os
import psycopg2
import sys

try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    # Check if is_active column exists
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='items' AND column_name='is_active'
    """)
    
    if cur.fetchone():
        print("✓ Migration already applied - is_active column exists")
    else:
        print("⚠️  Migration not yet applied - is_active column missing")
        print("   Run: psql \$DATABASE_URL -f infra/migration-add-is-active-to-items.sql")
        sys.exit(1)
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"✗ Error checking database: {e}")
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""
echo "Running import script..."
python3 scripts/import_questions.py

echo ""
echo "=== Test Complete ==="
echo ""
echo "Next steps:"
echo "1. Log into the instructor portal"
echo "2. Navigate to the Questions page"
echo "3. Verify that:"
echo "   - All questions are displayed"
echo "   - Active questions show 'Active' badge (green)"
echo "   - Inactive questions show 'Inactive' badge (gray)"
echo "   - Only shortlisted questions from Final_Shortlist_30+8.csv are active"


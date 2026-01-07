#!/bin/bash

# Question Bank Verification Script
# Verifies that all 30 scored questions from the independent study are in the database

echo "=== Question Bank Verification ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    echo "Please create apps/web/.env.local with database credentials"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' apps/web/.env.local | xargs)

# Database connection check
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not found in .env.local${NC}"
    exit 1
fi

echo "Connecting to database..."
echo ""

# Expected question counts by domain
EXPECTED_BORROWING=13
EXPECTED_BEHAVIORAL=10
EXPECTED_RISK_RETURN=7
EXPECTED_TOTAL=30

# Run verification queries
echo "1. Checking total question count..."
TOTAL_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM items;" | xargs)

if [ "$TOTAL_COUNT" -eq "$EXPECTED_TOTAL" ]; then
    echo -e "${GREEN}✓ Total questions: $TOTAL_COUNT (Expected: $EXPECTED_TOTAL)${NC}"
else
    echo -e "${RED}✗ Total questions: $TOTAL_COUNT (Expected: $EXPECTED_TOTAL)${NC}"
fi

echo ""
echo "2. Checking questions by domain..."
psql "$DATABASE_URL" -c "
SELECT 
    domain,
    COUNT(*) as count,
    CASE 
        WHEN domain LIKE '%Borrowing%' AND COUNT(*) = $EXPECTED_BORROWING THEN '✓'
        WHEN domain LIKE '%Behavioral%' AND COUNT(*) = $EXPECTED_BEHAVIORAL THEN '✓'
        WHEN domain LIKE '%Risk and Return%' AND COUNT(*) = $EXPECTED_RISK_RETURN THEN '✓'
        ELSE '✗'
    END as status
FROM items 
GROUP BY domain 
ORDER BY domain;
"

echo ""
echo "3. Checking for missing answer keys..."
MISSING_KEYS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM items WHERE key IS NULL OR key = '';" | xargs)

if [ "$MISSING_KEYS" -eq 0 ]; then
    echo -e "${GREEN}✓ All questions have answer keys${NC}"
else
    echo -e "${RED}✗ $MISSING_KEYS questions missing answer keys${NC}"
    echo "Questions without keys:"
    psql "$DATABASE_URL" -c "SELECT item_id, domain, subdomain, LEFT(stem, 50) as question_preview FROM items WHERE key IS NULL OR key = '';"
fi

echo ""
echo "4. Checking question types..."
psql "$DATABASE_URL" -c "
SELECT 
    type,
    COUNT(*) as count
FROM items 
GROUP BY type 
ORDER BY type;
"

echo ""
echo "5. Sample questions (first 5):"
psql "$DATABASE_URL" -c "
SELECT 
    domain,
    subdomain,
    LEFT(stem, 60) as question_preview,
    CASE WHEN key IS NOT NULL THEN 'Has key' ELSE 'No key' END as key_status
FROM items 
ORDER BY created_at 
LIMIT 5;
"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Note: Baseline questions (B1-B8) are collected in onboarding, not in items table"
echo "Expected: 30 scored questions in items table"
echo ""


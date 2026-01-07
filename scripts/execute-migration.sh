#!/bin/bash

# Execute Database Migration for Baseline Covariates
# This script executes the migration to add baseline covariates columns

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Database Migration: Baseline Covariates${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}DATABASE_URL not set. Checking for environment files...${NC}"
    
    # Try to load from .env.local
    if [ -f "apps/web/.env.local" ]; then
        export $(grep -v '^#' apps/web/.env.local | xargs)
        echo -e "${GREEN}✓ Loaded from apps/web/.env.local${NC}"
    elif [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
        echo -e "${GREEN}✓ Loaded from .env${NC}"
    else
        echo -e "${RED}Error: DATABASE_URL not found${NC}"
        echo ""
        echo "Please set DATABASE_URL:"
        echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
        echo ""
        echo "Or create apps/web/.env.local with:"
        echo "  DATABASE_URL=postgresql://user:password@host:port/database"
        exit 1
    fi
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL still not set${NC}"
    exit 1
fi

echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql not found${NC}"
    echo ""
    echo "Please install PostgreSQL client:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    echo ""
    echo "Or execute the migration manually:"
    echo "  1. Connect to your database"
    echo "  2. Copy contents of: infra/migration-add-baseline-covariates.sql"
    echo "  3. Execute in SQL editor"
    exit 1
fi

echo -e "${GREEN}✓ psql found${NC}"
echo ""

# Test database connection
echo "Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please verify DATABASE_URL is correct"
    exit 1
fi

echo ""
echo -e "${YELLOW}Executing migration...${NC}"
echo ""

# Execute migration
if psql "$DATABASE_URL" -f infra/migration-add-baseline-covariates.sql; then
    echo ""
    echo -e "${GREEN}✓ Migration executed successfully${NC}"
    echo ""
    
    # Verify migration
    echo "Verifying migration..."
    psql "$DATABASE_URL" -c "
    SELECT 
        column_name, 
        data_type,
        CASE 
            WHEN column_name IN ('age_range', 'first_language', 'first_language_other',
                                'prior_financial_products', 'self_rated_financial_knowledge',
                                'financial_stress_frequency') THEN '✓'
            ELSE ''
        END as status
    FROM information_schema.columns
    WHERE table_name = 'student_profiles'
    AND column_name IN (
        'age_range', 'first_language', 'first_language_other',
        'prior_financial_products', 'self_rated_financial_knowledge',
        'financial_stress_frequency'
    )
    ORDER BY column_name;
    "
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Migration Complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test onboarding flow: docs/implementation/TESTING_GUIDE.md"
    echo "  2. Verify question bank: ./scripts/verify-question-bank.sh"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    echo "Check the error message above"
    exit 1
fi


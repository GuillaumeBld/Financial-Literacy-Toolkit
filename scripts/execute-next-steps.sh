#!/bin/bash

# Execute Next Steps: Baseline Covariates Implementation
# This script guides through the execution of next steps

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Baseline Covariates Implementation${NC}"
echo -e "${BLUE}Next Steps Execution Guide${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps/web" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verify Migration Script${NC}"
echo "Checking migration script exists..."
if [ -f "infra/migration-add-baseline-covariates.sql" ]; then
    echo -e "${GREEN}✓ Migration script found${NC}"
    echo "  Location: infra/migration-add-baseline-covariates.sql"
    echo ""
    echo "  To execute:"
    echo "  1. Connect to your Supabase PostgreSQL database"
    echo "  2. Open SQL Editor"
    echo "  3. Copy and paste the contents of:"
    echo "     infra/migration-add-baseline-covariates.sql"
    echo "  4. Execute the script"
    echo ""
    echo "  Or use psql:"
    echo "    psql \$DATABASE_URL -f infra/migration-add-baseline-covariates.sql"
    echo ""
else
    echo -e "${RED}✗ Migration script not found${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 2: Verify Implementation Files${NC}"
echo "Checking implementation files..."

FILES_TO_CHECK=(
    "apps/web/src/app/onboarding/page.tsx"
    "apps/web/src/app/api/onboarding/submit/route.ts"
    "docs/implementation/MIGRATION_CHECKLIST.md"
    "docs/implementation/TESTING_GUIDE.md"
)

ALL_FOUND=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        ALL_FOUND=false
    fi
done

if [ "$ALL_FOUND" = true ]; then
    echo ""
    echo -e "${GREEN}✓ All implementation files present${NC}"
else
    echo ""
    echo -e "${RED}✗ Some files are missing${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Check Documentation${NC}"
echo "Verifying documentation structure..."

if [ -d "docs/research" ] && [ -d "docs/implementation" ]; then
    echo -e "${GREEN}✓ Documentation directories organized${NC}"
    echo "  - docs/research/ - Research documentation"
    echo "  - docs/implementation/ - Implementation guides"
else
    echo -e "${RED}✗ Documentation directories missing${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Verify Scripts${NC}"
if [ -f "scripts/verify-question-bank.sh" ] && [ -f "scripts/test-onboarding-api.sh" ]; then
    echo -e "${GREEN}✓ Verification scripts ready${NC}"
    chmod +x scripts/verify-question-bank.sh 2>/dev/null || true
    chmod +x scripts/test-onboarding-api.sh 2>/dev/null || true
else
    echo -e "${RED}✗ Some verification scripts missing${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Execution Checklist${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. [ ] Execute database migration"
echo "   → See: docs/implementation/MIGRATION_CHECKLIST.md"
echo "   → File: infra/migration-add-baseline-covariates.sql"
echo ""
echo "2. [ ] Test onboarding flow"
echo "   → See: docs/implementation/TESTING_GUIDE.md"
echo "   → Run: npm run dev (in apps/web/)"
echo "   → Navigate to: http://localhost:3001/start"
echo ""
echo "3. [ ] Verify question bank"
echo "   → Run: ./scripts/verify-question-bank.sh"
echo "   → Expected: 30 scored questions"
echo ""
echo "4. [ ] Test API endpoint"
echo "   → Run: ./scripts/test-onboarding-api.sh"
echo "   → Verify: API accepts all baseline fields"
echo ""
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Ready to proceed!${NC}"
echo ""
echo "Next actions:"
echo "  1. Review: docs/implementation/MIGRATION_CHECKLIST.md"
echo "  2. Execute migration in your database"
echo "  3. Follow: docs/implementation/TESTING_GUIDE.md"
echo ""
echo "For detailed instructions, see:"
echo "  - docs/implementation/NEXT_STEPS.md"
echo "  - docs/implementation/STATUS_SUMMARY.md"
echo ""


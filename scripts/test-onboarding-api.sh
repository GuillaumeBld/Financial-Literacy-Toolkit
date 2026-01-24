#!/bin/bash

# Test Onboarding API Endpoint
# Tests the baseline covariates submission

echo "=== Testing Onboarding API ==="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}Error: .env.local file not found${NC}"
    exit 1
fi

# Load environment variables to get API URL
export $(grep -v '^#' apps/web/.env.local | xargs)

# Default to localhost if not set
API_URL=${NEXT_PUBLIC_API_URL:-"http://localhost:3001"}

echo "Testing API at: $API_URL"
echo ""

# Test data
TEST_DATA='{
  "courseCode": "QUIN 102",
  "studentId": "TEST'$(date +%s)'",
  "demographic": {
    "age_range": "above-20",
    "gender": "female",
    "race_ethnicity": "Asian",
    "first_language": "english",
    "work_experience": "part-time"
  },
  "financial_background": {
    "prior_financial_products": ["credit-card", "student-loan"],
    "self_rated_financial_knowledge": "moderate",
    "financial_stress_frequency": "sometimes"
  },
  "socioeconomic": {
    "household_income": "50000-74999",
    "parental_education": "bachelors"
  }
}'

echo "Sending test request..."
echo ""

# Make API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/onboarding/submit" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

# Extract status code and body
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ API test passed${NC}"
    
    # Check response structure
    if echo "$BODY" | grep -q "success.*true"; then
        echo -e "${GREEN}✓ Response indicates success${NC}"
    else
        echo -e "${YELLOW}⚠ Response structure may be unexpected${NC}"
    fi
else
    echo -e "${RED}✗ API test failed${NC}"
    echo "Check the error message above"
    exit 1
fi

echo ""
echo "=== Test Complete ==="


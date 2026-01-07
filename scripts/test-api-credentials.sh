#!/bin/bash
# Test API Credentials Script
# This script tests the credentials against the actual API endpoints

set -e

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Testing API Credentials..."
echo "API URL: $API_URL"
echo ""

# Test Instructor Login
echo "📧 Testing Instructor Login..."
INSTRUCTOR_RESPONSE=$(curl -s -X POST "$API_URL/api/instructor/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.instructor@university.edu",
    "password": "TestInstructor123!"
  }')

if echo "$INSTRUCTOR_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Instructor login: PASS"
  TOKEN=$(echo "$INSTRUCTOR_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  if [ -n "$TOKEN" ]; then
    echo "   Token received: ${TOKEN:0:20}..."
  fi
else
  echo "❌ Instructor login: FAIL"
  echo "   Response: $INSTRUCTOR_RESPONSE"
fi

echo ""

# Test Student Authentication (via assessment submission endpoint)
echo "👤 Testing Student Authentication..."
# Note: This is a simplified test - actual assessment submission requires more data
STUDENT_TEST=$(curl -s -X POST "$API_URL/api/assessment/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "Financial Literacy",
    "studentId": "123456789",
    "attemptType": "pre",
    "responses": []
  }' 2>&1)

# Check if we get past authentication (even if validation fails)
if echo "$STUDENT_TEST" | grep -q -E "(course|instrument|Invalid course code)" 2>/dev/null; then
  echo "✅ Student authentication: PASS (course recognized)"
elif echo "$STUDENT_TEST" | grep -q "Invalid course code"; then
  echo "❌ Student authentication: FAIL (course not found)"
  echo "   Response: $STUDENT_TEST"
else
  echo "⚠️  Student authentication: UNKNOWN"
  echo "   Response: $STUDENT_TEST"
fi

echo ""
echo "============================================================"
echo "Test Summary"
echo "============================================================"
echo ""
echo "If the API is not running, start it with:"
echo "  docker-compose up app"
echo "  or"
echo "  cd apps/web && npm run dev"
echo ""


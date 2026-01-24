#!/bin/bash
# Diagnose API Errors Script
# This script tests the API endpoints and checks database connectivity

set -e

API_URL="${API_URL:-http://localhost:3000}"
DB_CONTAINER="finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8"

echo "🔍 Diagnosing API Errors..."
echo "API URL: $API_URL"
echo ""

# Test 1: Check if API is running
echo "1️⃣ Testing API availability..."
if curl -s -f "$API_URL/api/test" > /dev/null 2>&1; then
  echo "✅ API is running"
else
  echo "❌ API is not responding at $API_URL"
  echo "   Make sure the application is running"
  exit 1
fi

# Test 2: Check database connectivity from API perspective
echo ""
echo "2️⃣ Testing database connectivity..."
DB_STATUS=$(docker exec "$DB_CONTAINER" psql -U finlit_user -d financial_literacy -t -c "SELECT 'OK' as status;" 2>&1 | tr -d ' ')
if [ "$DB_STATUS" = "OK" ]; then
  echo "✅ Database is accessible"
else
  echo "❌ Database connection issue: $DB_STATUS"
fi

# Test 3: Test instructor login endpoint
echo ""
echo "3️⃣ Testing instructor login endpoint..."
INSTRUCTOR_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/instructor/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.instructor@university.edu",
    "password": "TestInstructor123!"
  }')

HTTP_CODE=$(echo "$INSTRUCTOR_RESPONSE" | tail -n 1)
BODY=$(echo "$INSTRUCTOR_RESPONSE" | head -n -1)

echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Instructor login: SUCCESS"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Instructor login: FAILED"
  echo "   Response: $BODY"
fi

# Test 4: Test course validation endpoint
echo ""
echo "4️⃣ Testing course validation endpoint..."
COURSE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/courses/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "QUIN 102"
  }')

HTTP_CODE=$(echo "$COURSE_RESPONSE" | tail -n 1)
BODY=$(echo "$COURSE_RESPONSE" | head -n -1)

echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Course validation: SUCCESS"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "❌ Course validation: FAILED"
  echo "   Response: $BODY"
fi

# Test 5: Verify credentials in database
echo ""
echo "5️⃣ Verifying credentials in database..."
INSTRUCTOR_EXISTS=$(docker exec "$DB_CONTAINER" psql -U finlit_user -d financial_literacy -t -c "SELECT COUNT(*) FROM instructors WHERE email = 'test.instructor@university.edu';" | tr -d ' ')
COURSE_EXISTS=$(docker exec "$DB_CONTAINER" psql -U finlit_user -d financial_literacy -t -c "SELECT COUNT(*) FROM courses WHERE name = 'Financial Literacy';" | tr -d ' ')

if [ "$INSTRUCTOR_EXISTS" = "1" ]; then
  echo "✅ Instructor exists in database"
else
  echo "❌ Instructor not found in database"
fi

if [ "$COURSE_EXISTS" = "1" ]; then
  echo "✅ Course exists in database"
else
  echo "❌ Course not found in database"
fi

echo ""
echo "============================================================"
echo "Diagnosis Complete"
echo "============================================================"
echo ""
echo "If API endpoints are failing, check:"
echo "1. DATABASE_URL environment variable is set correctly"
echo "2. Database is accessible from the API container"
echo "3. Network connectivity between API and database containers"
echo ""


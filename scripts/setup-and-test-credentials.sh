#!/bin/bash
# Setup and Test Credentials Script
# This script sets up test credentials and verifies they work

set -e

CONTAINER_NAME="finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8"
DB_USER="finlit_user"
DB_NAME="financial_literacy"

echo "🚀 Setting up test credentials..."
echo ""

# Run the SQL setup script
echo "📝 Running SQL setup script..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$(dirname "$0")/setup-test-credentials.sql"

echo ""
echo "✅ Credentials setup complete!"
echo ""
echo "============================================================"
echo "TEST CREDENTIALS SUMMARY"
echo "============================================================"
echo ""
echo "📧 INSTRUCTOR CREDENTIALS:"
echo "   Email: test.instructor@university.edu"
echo "   Password: TestInstructor123!"
echo ""
echo "👤 STUDENT CREDENTIALS:"
echo "   Course Code: Financial Literacy"
echo "   Student ID: 123456789"
echo ""
echo "============================================================"
echo ""
echo "🧪 Testing credentials..."

# Test instructor login
echo ""
echo "Testing instructor credentials..."
INSTRUCTOR_TEST=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 FROM instructors 
    WHERE email = 'test.instructor@university.edu' 
    AND hashed_password = '1db998c13806ae96aa2e96167babf5c6172f483fde69d523de2a4abe49e81ecf'
    AND is_active = true
  ) THEN 'PASS'
  ELSE 'FAIL'
END;
" | tr -d ' ')

if [ "$INSTRUCTOR_TEST" = "PASS" ]; then
  echo "✅ Instructor credentials: PASS"
else
  echo "❌ Instructor credentials: FAIL"
fi

# Test student setup
echo ""
echo "Testing student credentials..."
STUDENT_TEST=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT CASE 
  WHEN EXISTS (
    SELECT 1 
    FROM users u
    JOIN enrollments e ON u.user_id = e.user_id
    JOIN courses c ON e.course_id = c.course_id
    WHERE c.name = 'Financial Literacy'
    AND u.hashed_student_key = encode(digest(c.pepper::text || '123456789', 'sha256'), 'hex')
  ) THEN 'PASS'
  ELSE 'FAIL'
END;
" | tr -d ' ')

if [ "$STUDENT_TEST" = "PASS" ]; then
  echo "✅ Student credentials: PASS"
else
  echo "❌ Student credentials: FAIL"
fi

echo ""
if [ "$INSTRUCTOR_TEST" = "PASS" ] && [ "$STUDENT_TEST" = "PASS" ]; then
  echo "✅ All credential tests passed!"
  exit 0
else
  echo "❌ Some credential tests failed"
  exit 1
fi


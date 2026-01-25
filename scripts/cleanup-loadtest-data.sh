#!/bin/bash
# Load Test Data Cleanup Script
# Removes all data created by load tests (loadtest-* prefixed users)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CONTAINER="finlit-postgres-db-g6ifwu"
DB_USER="finlit_user"
DB_NAME="finlit_db"

echo -e "${YELLOW}=== Load Test Data Cleanup ===${NC}"
echo ""

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}"; then
    echo -e "${RED}Error: Container ${CONTAINER} is not running${NC}"
    exit 1
fi

# Count data to be deleted
echo -e "${YELLOW}Counting load test data...${NC}"
echo ""

USER_COUNT=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM users WHERE hashed_student_key LIKE 'loadtest-%';" | tr -d ' ')

ATTEMPT_COUNT=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM attempts a JOIN users u ON a.user_id = u.user_id WHERE u.hashed_student_key LIKE 'loadtest-%';" | tr -d ' ')

RESPONSE_COUNT=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM responses r JOIN attempts a ON r.attempt_id = a.attempt_id JOIN users u ON a.user_id = u.user_id WHERE u.hashed_student_key LIKE 'loadtest-%';" | tr -d ' ')

echo "Data to be deleted:"
echo "  - Users: $USER_COUNT"
echo "  - Attempts: $ATTEMPT_COUNT"
echo "  - Responses: $RESPONSE_COUNT"
echo ""

if [ "$USER_COUNT" = "0" ]; then
    echo -e "${GREEN}No load test data found. Nothing to clean up.${NC}"
    exit 0
fi

# Confirm deletion
echo -e "${RED}WARNING: This will permanently delete the above data.${NC}"
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${YELLOW}Deleting load test data...${NC}"

# Run cleanup SQL
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME <<'EOF'
BEGIN;

-- Delete responses first (references attempts)
DELETE FROM responses
WHERE attempt_id IN (
  SELECT a.attempt_id
  FROM attempts a
  JOIN users u ON a.user_id = u.user_id
  WHERE u.hashed_student_key LIKE 'loadtest-%'
);

-- Delete scores (references attempts)
DELETE FROM scores
WHERE attempt_id IN (
  SELECT a.attempt_id
  FROM attempts a
  JOIN users u ON a.user_id = u.user_id
  WHERE u.hashed_student_key LIKE 'loadtest-%'
);

-- Delete attempts (references users)
DELETE FROM attempts
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Delete enrollments (references users)
DELETE FROM enrollments
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Delete student profiles if they exist (references users)
DELETE FROM student_profiles
WHERE user_id IN (
  SELECT user_id FROM users WHERE hashed_student_key LIKE 'loadtest-%'
);

-- Finally delete the test users
DELETE FROM users
WHERE hashed_student_key LIKE 'loadtest-%';

COMMIT;
EOF

echo ""
echo -e "${GREEN}Cleanup complete!${NC}"

# Verify
REMAINING=$(docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM users WHERE hashed_student_key LIKE 'loadtest-%';" | tr -d ' ')

echo "Remaining load test users: $REMAINING"

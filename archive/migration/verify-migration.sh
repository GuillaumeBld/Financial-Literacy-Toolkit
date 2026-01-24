#!/bin/bash

# Migration Verification Script
# Compares data counts and validates integrity between Supabase and PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
POSTGRES_URL="${DATABASE_URL:-postgresql://finlit_user:password@localhost:5432/financial_literacy}"

# Tables to verify
TABLES=(
  "courses"
  "instruments"
  "items"
  "users"
  "enrollments"
  "attempts"
  "responses"
  "scores"
)

# Function to get row count from Supabase
get_supabase_count() {
  local table=$1
  
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "SKIP"
    return
  fi
  
  response=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Range: 0-0/*" 2>/dev/null)
  
  # Extract count from Content-Range header or count array
  count=$(echo "$response" | jq 'length' 2>/dev/null || echo "0")
  echo "$count"
}

# Function to get row count from PostgreSQL
get_postgres_count() {
  local table=$1
  
  count=$(psql "$POSTGRES_URL" -t -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null | tr -d ' ')
  echo "$count"
}

# Function to verify table structure
verify_table_structure() {
  local table=$1
  
  echo -e "${BLUE}Verifying structure of ${table}...${NC}"
  
  # Get column information from PostgreSQL
  columns=$(psql "$POSTGRES_URL" -t -c "
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = '${table}' 
    ORDER BY ordinal_position;
  " 2>/dev/null)
  
  if [ -z "$columns" ]; then
    echo -e "${RED}  ✗ Table ${table} does not exist${NC}"
    return 1
  fi
  
  column_count=$(echo "$columns" | wc -l | tr -d ' ')
  echo -e "${GREEN}  ✓ Table ${table} exists with ${column_count} columns${NC}"
  return 0
}

# Function to verify foreign key constraints
verify_foreign_keys() {
  local table=$1
  
  fk_count=$(psql "$POSTGRES_URL" -t -c "
    SELECT COUNT(*) 
    FROM information_schema.table_constraints 
    WHERE table_name = '${table}' 
    AND constraint_type = 'FOREIGN KEY';
  " 2>/dev/null | tr -d ' ')
  
  if [ "$fk_count" -gt 0 ]; then
    echo -e "${GREEN}  ✓ ${table} has ${fk_count} foreign key constraint(s)${NC}"
  fi
}

# Function to verify indexes
verify_indexes() {
  local table=$1
  
  index_count=$(psql "$POSTGRES_URL" -t -c "
    SELECT COUNT(*) 
    FROM pg_indexes 
    WHERE tablename = '${table}';
  " 2>/dev/null | tr -d ' ')
  
  if [ "$index_count" -gt 0 ]; then
    echo -e "${GREEN}  ✓ ${table} has ${index_count} index(es)${NC}"
  fi
}

# Function to verify RLS
verify_rls() {
  local table=$1
  
  rls_enabled=$(psql "$POSTGRES_URL" -t -c "
    SELECT relrowsecurity 
    FROM pg_class 
    WHERE relname = '${table}';
  " 2>/dev/null | tr -d ' ')
  
  if [ "$rls_enabled" = "t" ]; then
    policy_count=$(psql "$POSTGRES_URL" -t -c "
      SELECT COUNT(*) 
      FROM pg_policies 
      WHERE tablename = '${table}';
    " 2>/dev/null | tr -d ' ')
    
    echo -e "${GREEN}  ✓ RLS enabled on ${table} with ${policy_count} policy/policies${NC}"
  else
    echo -e "${YELLOW}  ⚠ RLS not enabled on ${table}${NC}"
  fi
}

# Main verification function
main() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}Migration Verification${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo ""
  
  # Verify database connection
  echo -e "${YELLOW}Verifying PostgreSQL connection...${NC}"
  if ! psql "$POSTGRES_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to PostgreSQL${NC}"
    echo "POSTGRES_URL: $POSTGRES_URL"
    exit 1
  fi
  echo -e "${GREEN}✓ PostgreSQL connection verified${NC}"
  echo ""
  
  # Verify Supabase connection (if credentials provided)
  if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}Verifying Supabase connection...${NC}"
    response=$(curl -s -X GET \
      "${SUPABASE_URL}/rest/v1/courses?select=*&limit=1" \
      -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" 2>/dev/null)
    
    if echo "$response" | grep -q "error"; then
      echo -e "${YELLOW}⚠ Cannot connect to Supabase, skipping comparison${NC}"
      SUPABASE_URL=""
    else
      echo -e "${GREEN}✓ Supabase connection verified${NC}"
    fi
    echo ""
  fi
  
  # Data count comparison
  echo -e "${BLUE}Data Count Comparison${NC}"
  echo -e "${BLUE}=====================${NC}"
  echo ""
  printf "%-20s %-15s %-15s %-10s\n" "Table" "Supabase" "PostgreSQL" "Status"
  echo "--------------------------------------------------------------------------------"
  
  total_matches=0
  total_tables=0
  
  for table in "${TABLES[@]}"; do
    supabase_count=$(get_supabase_count "$table")
    postgres_count=$(get_postgres_count "$table")
    
    total_tables=$((total_tables + 1))
    
    if [ "$supabase_count" = "SKIP" ]; then
      status="${YELLOW}N/A${NC}"
      printf "%-20s %-15s %-15s %-10s\n" "$table" "N/A" "$postgres_count" "$status"
    elif [ "$supabase_count" = "$postgres_count" ]; then
      status="${GREEN}MATCH${NC}"
      total_matches=$((total_matches + 1))
      printf "%-20s %-15s %-15s %-10s\n" "$table" "$supabase_count" "$postgres_count" "$status"
    else
      status="${RED}MISMATCH${NC}"
      printf "%-20s %-15s %-15s %-10s\n" "$table" "$supabase_count" "$postgres_count" "$status"
    fi
  done
  
  echo ""
  echo -e "${BLUE}Summary: ${total_matches}/${total_tables} tables match${NC}"
  echo ""
  
  # Structure verification
  echo -e "${BLUE}Structure Verification${NC}"
  echo -e "${BLUE}=====================${NC}"
  echo ""
  
  for table in "${TABLES[@]}"; do
    verify_table_structure "$table"
    verify_foreign_keys "$table"
    verify_indexes "$table"
    verify_rls "$table"
    echo ""
  done
  
  # Sample data verification
  echo -e "${BLUE}Sample Data Verification${NC}"
  echo -e "${BLUE}=======================${NC}"
  echo ""
  
  # Check for sample course
  course_count=$(get_postgres_count "courses")
  if [ "$course_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Found ${course_count} course(s)${NC}"
    
    # Get sample course name
    course_name=$(psql "$POSTGRES_URL" -t -c "SELECT name FROM courses LIMIT 1;" 2>/dev/null | tr -d ' ')
    if [ -n "$course_name" ]; then
      echo -e "${GREEN}  Sample course: ${course_name}${NC}"
    fi
  else
    echo -e "${YELLOW}⚠ No courses found${NC}"
  fi
  
  # Check for sample items
  item_count=$(get_postgres_count "items")
  if [ "$item_count" -gt 0 ]; then
    echo -e "${GREEN}✓ Found ${item_count} assessment item(s)${NC}"
  else
    echo -e "${YELLOW}⚠ No assessment items found${NC}"
  fi
  
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${GREEN}Verification completed!${NC}"
  echo -e "${BLUE}========================================${NC}"
}

# Run verification
main




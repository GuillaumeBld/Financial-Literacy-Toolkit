#!/bin/bash

# Import PostgreSQL Data Script
# This script imports exported JSON data from Supabase into PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXPORT_DIR="./migration/exports"
DATABASE_URL="${DATABASE_URL:-postgresql://finlit_user:password@localhost:5432/financial_literacy}"

# Tables to import (in dependency order)
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

# Function to find latest export directory
find_latest_export() {
  if [ ! -d "$EXPORT_DIR" ]; then
    echo -e "${RED}Error: Export directory not found: ${EXPORT_DIR}${NC}"
    echo "Please run export script first: ./migration/export-supabase-data.sh"
    exit 1
  fi
  
  latest=$(ls -td ${EXPORT_DIR}/supabase_export_* 2>/dev/null | head -1)
  
  if [ -z "$latest" ]; then
    echo -e "${RED}Error: No export directories found in ${EXPORT_DIR}${NC}"
    exit 1
  fi
  
  echo "$latest"
}

# Function to import a table from JSON
import_table() {
  local table=$1
  local export_dir=$2
  local json_file="${export_dir}/${table}.json"
  
  if [ ! -f "$json_file" ]; then
    echo -e "${YELLOW}Warning: ${json_file} not found, skipping ${table}${NC}"
    return 0
  fi
  
  echo -e "${YELLOW}Importing table: ${table}${NC}"
  
  # Count rows in JSON file
  row_count=$(jq 'length' "$json_file")
  
  if [ "$row_count" -eq 0 ]; then
    echo -e "${YELLOW}  No data to import for ${table}${NC}"
    return 0
  fi
  
  # Use psql to import JSON data
  # Convert JSON to SQL INSERT statements using jq
  psql "$DATABASE_URL" <<EOF
BEGIN;

-- Create temporary table for JSON import
CREATE TEMP TABLE temp_${table}_import (data JSONB);

-- Load JSON data
\copy temp_${table}_import(data) FROM PROGRAM 'cat ${json_file} | jq -c ".[]"' WITH (FORMAT text);

-- Insert data into actual table
INSERT INTO ${table}
SELECT * FROM jsonb_populate_recordset(NULL::${table}, (SELECT jsonb_agg(data) FROM temp_${table}_import))
ON CONFLICT DO NOTHING;

-- Get actual inserted count
SELECT COUNT(*) as inserted_count FROM ${table};

COMMIT;
EOF
  
  echo -e "${GREEN}  Imported ${row_count} rows into ${table}${NC}"
  return 0
}

# Main import function
main() {
  # Find latest export
  export_dir=$(find_latest_export)
  echo -e "${GREEN}Using export directory: ${export_dir}${NC}"
  echo ""
  
  # Check manifest
  manifest_file="${export_dir}/manifest.json"
  if [ -f "$manifest_file" ]; then
    echo -e "${GREEN}Found manifest file${NC}"
    export_date=$(jq -r '.export_date' "$manifest_file")
    echo "Export date: $export_date"
    echo ""
  fi
  
  # Verify database connection
  echo -e "${YELLOW}Verifying database connection...${NC}"
  if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "DATABASE_URL: $DATABASE_URL"
    exit 1
  fi
  echo -e "${GREEN}Database connection verified${NC}"
  echo ""
  
  # Import all tables
  echo -e "${GREEN}Starting data import...${NC}"
  echo ""
  
  for table in "${TABLES[@]}"; do
    if ! import_table "$table" "$export_dir"; then
      echo -e "${RED}Failed to import ${table}. Continuing with other tables...${NC}"
    fi
  done
  
  echo ""
  echo -e "${GREEN}Import completed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Run verification script: ./migration/verify-migration.sh"
  echo "2. Test application with new database"
}

# Run main function
main




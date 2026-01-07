#!/bin/bash

# Export Supabase Data Script
# This script exports all data from Supabase to JSON files for migration to PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EXPORT_DIR="./migration/exports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_SUBDIR="${EXPORT_DIR}/supabase_export_${TIMESTAMP}"

# Tables to export (in dependency order)
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

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set${NC}"
  echo "Usage: export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ./export-supabase-data.sh"
  exit 1
fi

# Create export directory
mkdir -p "$EXPORT_SUBDIR"
echo -e "${GREEN}Created export directory: ${EXPORT_SUBDIR}${NC}"

# Function to export a table
export_table() {
  local table=$1
  local output_file="${EXPORT_SUBDIR}/${table}.json"
  
  echo -e "${YELLOW}Exporting table: ${table}${NC}"
  
  # Use Supabase REST API to export data
  response=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${table}?select=*" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json")
  
  # Check if request was successful
  if echo "$response" | grep -q "error"; then
    echo -e "${RED}Error exporting ${table}: ${response}${NC}"
    return 1
  fi
  
  # Save to file
  echo "$response" | jq '.' > "$output_file"
  
  # Count rows
  row_count=$(jq 'length' "$output_file")
  echo -e "${GREEN}  Exported ${row_count} rows from ${table}${NC}"
  
  return 0
}

# Export all tables
echo -e "${GREEN}Starting Supabase data export...${NC}"
echo ""

for table in "${TABLES[@]}"; do
  if ! export_table "$table"; then
    echo -e "${RED}Failed to export ${table}. Continuing with other tables...${NC}"
  fi
done

# Create manifest file
manifest_file="${EXPORT_SUBDIR}/manifest.json"
cat > "$manifest_file" << EOF
{
  "export_timestamp": "${TIMESTAMP}",
  "export_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "supabase_url": "${SUPABASE_URL}",
  "tables_exported": $(printf '%s\n' "${TABLES[@]}" | jq -R . | jq -s .),
  "export_directory": "${EXPORT_SUBDIR}"
}
EOF

echo ""
echo -e "${GREEN}Export completed successfully!${NC}"
echo -e "Export directory: ${EXPORT_SUBDIR}"
echo -e "Manifest file: ${manifest_file}"
echo ""
echo "Next steps:"
echo "1. Review exported data files"
echo "2. Run import script: ./migration/import-postgres-data.sh"
echo "3. Run verification script: ./migration/verify-migration.sh"




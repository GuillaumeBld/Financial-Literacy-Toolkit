# Question Import Setup Guide

This guide explains how to run the migration and import all questions with proper activation status.

## Prerequisites

1. **Database Access**: You need the correct `DATABASE_URL` for your production database
2. **Python Dependencies**: `psycopg2-binary` must be installed
3. **CSV Files**: Ensure `questions/All_Questions.csv` and `questions/Final_Shortlist_30+8.csv` are in place

## Step 1: Get Your Database URL

The `DATABASE_URL` should be in one of these locations:
- Production environment variables (set in Dokploy or your hosting platform)
- `.env.local` file in `apps/web/` directory
- Your hosting platform's environment configuration

Format: `postgresql://user:password@host:port/database`

## Step 2: Run the Migration

The migration adds the `is_active` field to the `items` table:

```bash
# Option 1: Using psql directly
export DATABASE_URL="your_database_url_here"
psql $DATABASE_URL -f infra/migration-add-is-active-to-items.sql

# Option 2: Using the automated script
export DATABASE_URL="your_database_url_here"
./scripts/run-migration-and-import.sh
```

## Step 3: Import Questions

The import script will:
- Read all questions from `questions/All_Questions.csv`
- Read shortlisted questions from `questions/Final_Shortlist_30+8.csv`
- Import all questions to the database
- Set `is_active=true` for shortlisted questions only
- Set `is_active=false` for all other questions

```bash
export DATABASE_URL="your_database_url_here"
python3 scripts/import_questions.py
```

## Step 4: Verify in Instructor Portal

1. Log into the instructor portal
2. Navigate to **Questions** page
3. You should see:
   - ✅ All questions displayed in the question bank
   - ✅ **Active** questions show a green "Active" badge
   - ✅ **Inactive** questions show a gray "Inactive" badge
   - ✅ Only questions from `Final_Shortlist_30+8.csv` are marked as active

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify your `DATABASE_URL` is correct
2. Check that the database is accessible from your current location
3. Verify database credentials are correct
4. Check firewall/network settings if connecting remotely

### Migration Already Applied

If the migration has already been run, you'll see:
```
ERROR: column "is_active" of relation "items" already exists
```

This is safe to ignore - the column already exists.

### Import Script Issues

If the import script finds 0 questions:
1. Verify `questions/All_Questions.csv` exists and is readable
2. Check the CSV file format matches expected structure
3. Ensure the file has proper encoding (UTF-8)

### Questions Not Showing Active Status

If questions don't show active/inactive badges:
1. Verify the API was updated (check `apps/web/src/app/api/instructor/questions/route.ts`)
2. Check browser cache - try hard refresh (Ctrl+F5 or Cmd+Shift+R)
3. Verify the frontend code includes `is_active` field display

## Quick Reference

```bash
# Full setup in one command (if DATABASE_URL is set)
export DATABASE_URL="your_database_url_here"
./scripts/run-migration-and-import.sh

# Or step by step:
export DATABASE_URL="your_database_url_here"
psql $DATABASE_URL -f infra/migration-add-is-active-to-items.sql
python3 scripts/import_questions.py
```

## Files Created

- `infra/migration-add-is-active-to-items.sql` - Database migration
- `scripts/import_questions.py` - Import script
- `scripts/run-migration-and-import.sh` - Automated setup script
- `scripts/test-question-import.sh` - Verification script

## Next Steps After Import

Once questions are imported:
1. Review questions in instructor portal
2. Verify active/inactive status is correct
3. Test that only active questions appear in assessments (if filtering is implemented)
4. Adjust `is_active` status as needed through the instructor interface


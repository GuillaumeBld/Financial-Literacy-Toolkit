# Question Import Script

This script imports all questions from `All_Questions.csv` into the database and activates only the shortlisted questions from `Final_Shortlist_30+8.csv`.

## Prerequisites

1. **Database Migration**: Run the migration to add the `is_active` field to the items table:
   ```bash
   psql $DATABASE_URL -f infra/migration-add-is-active-to-items.sql
   ```

2. **Python Dependencies**: Install required Python packages:
   ```bash
   pip install psycopg2-binary
   ```

3. **Environment Variables**: Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://user:password@host:port/database"
   ```

## Usage

```bash
python scripts/import_questions.py
```

Or if the script is executable:

```bash
./scripts/import_questions.py
```

## What It Does

1. **Reads All Questions**: Imports all questions from `questions/All_Questions.csv`
2. **Reads Shortlist**: Identifies which questions should be activated from `questions/Final_Shortlist_30+8.csv`
3. **Imports to Database**: 
   - Inserts new questions or updates existing ones
   - Sets `is_active=true` for shortlisted questions
   - Sets `is_active=false` for all other questions
4. **Uses Shortlist Metadata**: When available, uses Category and Subcategory from the shortlist for better domain/subdomain mapping

## Output

The script will display:
- Number of questions inserted
- Number of questions updated
- Number of questions activated
- Number of questions deactivated

## Notes

- Questions are matched by Bank and question number
- Baseline questions (not scored) in the shortlist are skipped
- The script uses transactions to ensure data consistency
- Existing questions are updated rather than duplicated


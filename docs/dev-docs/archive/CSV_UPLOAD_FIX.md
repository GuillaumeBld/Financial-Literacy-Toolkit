# CSV Upload Format Fix

## Issues Fixed

### 1. CSV Parser - Quoted Fields Handling
**Problem**: The original CSV parser used simple `split(',')` which broke when fields contained commas or quotes.

**Example Issue**:
```csv
"Borrowing, Interest Rates, and Financial Numeracy Knowledge"
```
This would be split incorrectly into multiple fields.

**Solution**: Implemented proper CSV parsing that:
- Handles quoted fields correctly
- Supports escaped quotes (double quotes `""`)
- Only splits on commas outside of quoted fields
- Removes surrounding quotes from field values

### 2. Type Field Normalization
**Problem**: CSV uses `multiple_choice` (underscore) but code expects `multiple-choice` (hyphen).

**Solution**: Added type normalization that converts:
- `multiple_choice` → `multiple-choice`
- `short_answer` → `short-answer`
- Defaults to `multiple-choice` if type is unrecognized

## CSV Format Requirements

The CSV file must have the following columns (in order):

1. **question_text** - The question text (can contain commas, will be quoted)
2. **type** - Question type: `multiple_choice` or `multiple-choice` (both accepted)
3. **domain** - Domain name (can contain commas, will be quoted)
4. **subdomain** - Subdomain name
5. **difficulty** - Numeric difficulty (1-5)
6. **options** - Pipe-separated options: `Option 1|Option 2|Option 3`
7. **key** - Answer key (single letter/number, can be empty for behavioral questions)
8. **explanation** - Explanation text (can contain commas, will be quoted)

### Example CSV Format:
```csv
question_text,type,domain,subdomain,difficulty,options,key,explanation
"Question text here?",multiple_choice,"Domain Name, with commas","Subdomain",1,"Option 1|Option 2|Option 3",a,"Explanation here"
```

## Behavioral Questions

For behavioral questions (no correct answer), the `key` field can be empty:
```csv
"Behavioral question?",multiple_choice,"Behavioral Domain","Subdomain",1,"Option 1|Option 2","","Behavioral (no objective key)"
```

## Testing

After the fix, the CSV upload should:
1. ✅ Parse quoted fields correctly
2. ✅ Handle commas within field values
3. ✅ Normalize question types
4. ✅ Accept empty key fields for behavioral questions
5. ✅ Parse pipe-separated options correctly

## File Location

The fixed parser is in:
- `apps/web/src/app/instructor/questions/page.tsx`
- Function: `parseCsvLine()` and `parseCsvQuestions()`

## Next Steps

1. Try uploading the CSV file again
2. Verify all 31 questions are imported correctly
3. Check that behavioral questions (rows 19-24) are imported with empty keys
4. Confirm all domains and subdomains are parsed correctly


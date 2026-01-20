# Supabase Migration Status Report

**Generated:** 2026-01-10  
**Project:** fzjirysmzvhsetmcmfqg  
**URL:** https://fzjirysmzvhsetmcmfqg.supabase.co

---

## ✅ Base Schema Status: **APPLIED**

All core tables from `infra/schema.sql` are present:

| Table | Status | Records |
|-------|--------|---------|
| `users` | ✅ Exists | 27 |
| `courses` | ✅ Exists | 3 |
| `enrollments` | ✅ Exists | 7 |
| `instruments` | ✅ Exists | 2 |
| `items` | ✅ Exists | 3 |
| `attempts` | ✅ Exists | 6 |
| `responses` | ✅ Exists | 15 |
| `scores` | ✅ Exists | 5 |

**Total Records:** 68 records across 8 core tables

---

## 🔄 Feature Migrations Status

### ✅ Applied Migrations

1. **migration-add-student-profiles.sql**
   - Status: ✅ **APPLIED**
   - Table: `student_profiles` exists
   - Records: 0 (empty table)

2. **migration-add-password-reset.sql**
   - Status: ✅ **APPLIED**
   - Table: `password_reset_tokens` exists
   - Records: 0 (empty table)

### ❌ Missing Migrations

3. **migration-add-is-active-to-items.sql**
   - Status: ❌ **NOT APPLIED**
   - Missing: `is_active` column in `items` table
   - Impact: Cannot enable/disable questions individually
   - **Action Required:** Run migration to add `is_active` column

4. **migration-add-baseline-covariates.sql**
   - Status: ❌ **NOT APPLIED** (Partial)
   - Table: `student_profiles` exists
   - Missing columns:
     - `age_range` (Baseline B3)
     - `first_language` (Baseline B4)
     - `prior_financial_products` (Baseline B6)
     - `self_rated_financial_knowledge` (Baseline B7)
     - `financial_stress_frequency` (Baseline B8)
   - Impact: Cannot collect baseline survey data (B1-B8)
   - **Action Required:** Run migration to add baseline covariates

### ⚠️ Unknown Status

5. **migration-add-student-password.sql**
   - Status: ⚠️ **UNKNOWN** (needs verification)
   - May add password storage fields to `student_profiles`
   - **Action Required:** Verify if password fields exist

---

## 📊 Current Schema Details

### Items Table Columns (Current)
```
item_id, domain, subdomain, difficulty, type, stem, options, key, rubric, is_anchor, created_at
```

**Missing:**
- `is_active` (boolean) - Should be added by migration-add-is-active-to-items.sql

### Student Profiles Table
- ✅ Table exists
- ⚠️ Cannot read columns (may be empty or have permission issues)
- **Needs:** Column verification query via Supabase SQL Editor

### Password Reset Tokens Table
- ✅ Table exists
- Structure: Unknown (table appears empty)

---

## 🎯 Recommended Next Steps

### Priority 1: Apply Missing Migrations

1. **Add `is_active` column to items table**
   ```sql
   -- Run: infra/migration-add-is-active-to-items.sql
   ALTER TABLE items ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;
   CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active) WHERE is_active = true;
   ```

2. **Add baseline covariates to student_profiles**
   ```sql
   -- Run: infra/migration-add-baseline-covariates.sql
   ALTER TABLE student_profiles
     ADD COLUMN IF NOT EXISTS age_range TEXT CHECK (age_range IN ('20-or-under', 'above-20')),
     ADD COLUMN IF NOT EXISTS first_language TEXT CHECK (first_language IN ('english', 'spanish', 'chinese', 'french', 'russian', 'dutch', 'other')),
     ADD COLUMN IF NOT EXISTS first_language_other TEXT,
     ADD COLUMN IF NOT EXISTS prior_financial_products JSONB,
     ADD COLUMN IF NOT EXISTS self_rated_financial_knowledge TEXT CHECK (self_rated_financial_knowledge IN ('very-low', 'low', 'moderate', 'high', 'very-high')),
     ADD COLUMN IF NOT EXISTS financial_stress_frequency TEXT CHECK (financial_stress_frequency IN ('never', 'rarely', 'sometimes', 'often', 'always'));
   ```

### Priority 2: Verify Existing Tables

3. **Verify student_profiles structure**
   - Connect to Supabase SQL Editor
   - Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_profiles' ORDER BY ordinal_position;`

4. **Verify password_reset_tokens structure**
   - Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'password_reset_tokens' ORDER BY ordinal_position;`

5. **Check for password storage migration**
   - Verify if `migration-add-student-password.sql` was applied
   - Check for password-related columns in `student_profiles`

---

## 📝 Migration Execution Instructions

### For Supabase (Production)

1. **Go to Supabase SQL Editor:**
   https://supabase.com/dashboard/project/fzjirysmzvhsetmcmfqg/sql/new

2. **Run migrations in order:**
   ```bash
   # 1. Add is_active column (Priority 1)
   infra/migration-add-is-active-to-items.sql
   
   # 2. Add baseline covariates (Priority 1)
   infra/migration-add-baseline-covariates.sql
   
   # 3. Verify student password migration (Priority 2)
   # Check if migration-add-student-password.sql needs to be applied
   ```

3. **Verify after each migration:**
   ```sql
   -- Check items.is_active
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'items' AND column_name = 'is_active';
   
   -- Check student_profiles baseline columns
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'student_profiles' 
   AND column_name IN ('age_range', 'first_language', 'prior_financial_products', 
                       'self_rated_financial_knowledge', 'financial_stress_frequency');
   ```

---

## 📈 Data Summary

### Current Production Data

- **27 Users** (hashed student keys)
- **3 Courses** (including "Financial Literacy")
- **7 Enrollments**
- **2 Instruments** (Pre/Post assessments)
- **3 Items** (assessment questions)
- **6 Attempts** (assessment submissions)
- **15 Responses** (student answers)
- **5 Scores** (calculated results)

**Total:** 68 records actively in use

### Empty Tables (Feature migrations applied but not used yet)

- `student_profiles` - 0 records (table ready, awaiting data)
- `password_reset_tokens` - 0 records (table ready, awaiting use)

---

## ✅ Migration Checklist

- [x] Base schema (schema.sql) - **APPLIED**
- [x] RLS policies (rls-policies.sql) - **ASSUMED APPLIED** (needs verification)
- [x] Student profiles table - **APPLIED**
- [ ] Baseline covariates - **MISSING**
- [ ] is_active column on items - **MISSING**
- [x] Password reset tokens table - **APPLIED**
- [ ] Student password fields - **UNKNOWN** (needs verification)
- [ ] Seed data - **ASSUMED NOT APPLIED** (production has real data)

---

## 🔍 Verification Commands

### Check Table Exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'student_profiles'
);
```

### Check Column Exists
```sql
SELECT EXISTS (
  SELECT FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'items' 
  AND column_name = 'is_active'
);
```

### List All Columns for Table
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'student_profiles'
ORDER BY ordinal_position;
```

---

## 📞 Next Steps

1. **Apply missing migrations** (Priority 1)
   - `migration-add-is-active-to-items.sql`
   - `migration-add-baseline-covariates.sql`

2. **Verify student_profiles structure** (Priority 2)
   - Check existing columns
   - Confirm password storage fields if needed

3. **Re-run verification script** after migrations
   ```bash
   node scripts/verify-supabase-schema-simple.js
   ```

---

**Report Generated By:** Schema Verification Script  
**Last Verified:** 2026-01-10

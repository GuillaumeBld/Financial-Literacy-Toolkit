# Question Features Implementation Status

**Date:** January 2025  
**Status:** Comprehensive overview of implemented question management features

## 📊 Database Schema

### Items Table Structure
```sql
CREATE TABLE items (
  item_id UUID PRIMARY KEY,
  type TEXT NOT NULL,                    -- 'multiple-choice' or 'short-answer'
  domain TEXT NOT NULL,                  -- e.g., 'Credit Management', 'Numeracy'
  subdomain TEXT NOT NULL,               -- e.g., 'Credit Cards', 'Interest'
  difficulty NUMERIC(3,2) NOT NULL,      -- 0.00 to 1.00
  stem TEXT NOT NULL,                    -- Question text
  options JSONB,                         -- Array of options for multiple-choice
  key TEXT,                              -- Correct answer key (e.g., 'A', 'B', or answer text)
  rubric JSONB,                          -- Explanation/rubric (can contain structured data)
  is_anchor BOOLEAN DEFAULT false,       -- Anchor item flag
  is_active BOOLEAN DEFAULT false,       -- Active/inactive status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- Primary key on `item_id`
- Index on `domain` for filtering
- Partial index on `is_anchor` for anchor items
- Partial index on `is_active` for active items only

**Constraints:**
- Difficulty must be between 0.00 and 1.00
- Foreign key from `responses.item_id` with CASCADE delete

---

## ✅ Instructor Features (Fully Implemented)

### 1. Question List/View (GET `/api/instructor/questions`)
**Status:** ✅ Fully Implemented

**Features:**
- Lists all questions in the item bank
- Returns complete question data including:
  - `item_id`, `type`, `domain`, `subdomain`, `difficulty`
  - `question_text` (stem), `options`, `key`, `explanation` (rubric)
  - `is_active` status, `created_at`, `updated_at`
- Ordered by creation date (newest first)
- Requires instructor authentication (Bearer token)

**Response Format:**
```json
{
  "success": true,
  "questions": [
    {
      "item_id": "uuid",
      "type": "multiple-choice" | "short-answer",
      "domain": "Credit Management",
      "subdomain": "Credit Cards",
      "difficulty": 0.40,
      "question_text": "Question text here...",
      "options": ["Option A", "Option B", ...] | null,
      "key": "A" | "answer text",
      "explanation": { "explanation": "..." } | null,
      "is_active": true | false,
      "created_at": "2025-01-10T...",
      "updated_at": "2025-01-10T..."
    }
  ]
}
```

### 2. Create Question (POST `/api/instructor/questions`)
**Status:** ✅ Fully Implemented (Recently Fixed - JSONB Handling)

**Features:**
- Create new questions (multiple-choice or short-answer)
- Validates required fields: `type`, `domain`, `question_text`
- Automatically sets `is_active = false` for new questions (safe default)
- Handles JSONB fields (`options`, `explanation`) properly:
  - Accepts JavaScript objects/arrays directly
  - Parses string JSON if provided
  - PostgreSQL driver automatically serializes to JSONB
- Supports optional fields: `subdomain`, `difficulty`, `options`, `key`, `explanation`

**Request Body:**
```json
{
  "type": "multiple-choice",
  "domain": "Credit Management",
  "subdomain": "Credit Cards",
  "difficulty": 0.40,
  "question_text": "Explain the difference between...",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "key": "A",
  "explanation": "Explanation text here..."
}
```

**Response:**
- Returns created question with all fields
- Includes `is_active: false` by default

### 3. Get Single Question (GET `/api/instructor/questions/[id]`)
**Status:** ✅ Fully Implemented

**Features:**
- Retrieve specific question by `item_id`
- Returns complete question data
- Requires instructor authentication

### 4. Update Question (PUT `/api/instructor/questions/[id]`)
**Status:** ✅ Fully Implemented (Recently Fixed - Partial Updates & JSONB)

**Features:**
- **Partial updates** - Only updates provided fields
- Supports updating all fields including:
  - `type`, `domain`, `subdomain`, `difficulty`
  - `question_text` (stem)
  - `options` (JSONB array)
  - `key` (answer key)
  - `explanation` (rubric JSONB)
  - **`is_active`** (active/inactive toggle) ✅
- Proper JSONB handling:
  - Stringifies JavaScript objects/arrays for `::jsonb` cast
  - Supports `null` values
- Returns updated question with all fields

**Request Body (Partial):**
```json
{
  "is_active": true,
  "difficulty": 0.50,
  "explanation": "Updated explanation..."
}
```

### 5. Delete Question (DELETE `/api/instructor/questions/[id]`)
**Status:** ✅ Fully Implemented

**Features:**
- Delete question by `item_id`
- CASCADE delete removes all associated `responses`
- Requires instructor authentication
- Returns success confirmation

### 6. Bulk Upload Questions (POST `/api/instructor/questions/upload`)
**Status:** ✅ Fully Implemented

**Features:**
- Upload multiple questions in a single request
- Accepts array of question objects
- Transaction-based insertion (all or nothing)
- Sanitization and validation:
  - Trims whitespace from all fields
  - Validates required fields (`question_text`, `domain`)
  - Handles missing/optional fields gracefully
  - Filters out invalid rows (logs warnings)
- Defaults:
  - `type`: 'multiple_choice' if not provided
  - `difficulty`: 1 if not provided or invalid
  - `subdomain`: empty string if not provided
- JSONB handling:
  - Options array converted to JSONB
  - Explanation wrapped in `{ explanation: "..." }` object for JSONB

**Request Body:**
```json
{
  "questions": [
    {
      "type": "multiple-choice",
      "domain": "Credit Management",
      "subdomain": "Credit Cards",
      "difficulty": 0.40,
      "question_text": "Question text...",
      "options": ["A", "B", "C", "D"],
      "key": "A",
      "explanation": "Explanation..."
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "insertedCount": 5,
  "questions": [...]
}
```

---

## 🎨 Instructor UI Features

### Question Management Page (`/instructor/questions`)
**Status:** ✅ Fully Implemented

**Features:**

1. **Question List Display**
   - Table view of all questions
   - Shows: Question text (truncated), Type, Domain, Subdomain, Difficulty, Status (Active/Inactive)
   - Sortable columns
   - Pagination support

2. **Search & Filtering**
   - Search by question text
   - Filter by:
     - Domain (dropdown with autocomplete)
     - Type (multiple-choice / short-answer)
     - Difficulty (range or specific value)
   - Combined search + filter functionality

3. **Create Question Modal**
   - Form fields:
     - Question text (required, textarea)
     - Type selector (multiple-choice / short-answer)
     - Domain (text input with datalist autocomplete)
     - Subdomain (optional text input)
     - Difficulty (number input, 0-1)
     - Options (for multiple-choice):
       - Dynamic add/remove options (minimum 2)
       - Option validation
     - Correct answer key (for multiple-choice):
       - Dropdown or letter input (A, B, C, D...)
       - Validates against available options
     - Explanation (optional, textarea)
   - Validation:
     - Required fields checked
     - Option count validation (min 2 for multiple-choice)
     - Answer key validation (must match option index)

4. **Edit Question Modal**
   - Pre-populated with existing question data
   - Same form fields as Create
   - Updates question via PUT request

5. **Delete Question**
   - Delete button with confirmation
   - Removes question from database

6. **Bulk CSV Upload**
   - CSV file upload functionality
   - Parses CSV with headers:
     - `question_text` or `question`
     - `type` (normalized: 'multiple_choice' → 'multiple-choice')
     - `domain` (required)
     - `subdomain` (optional)
     - `difficulty` (defaults to 1)
     - `options` (comma-separated or array format)
     - `key` or `answer`
     - `explanation` (optional)
   - Validates and sanitizes data
   - Shows upload progress and results
   - Error handling for invalid rows

7. **Active/Inactive Toggle**
   - Visual indicator for question status
   - Can toggle `is_active` status via Edit modal
   - Filtering by active status (future enhancement)

8. **Domain & Subdomain Management**
   - Autocomplete suggestions from existing questions
   - Datalist for domain selection
   - Pre-populated list of common domains

---

## 📝 Student Features (Assessment)

### Question Retrieval (GET `/api/items`)
**Status:** ✅ Implemented (Needs Verification)

**Features:**
- Retrieves questions for student assessments
- Should filter by `is_active = true` (needs verification)
- Returns formatted questions for assessment UI
- Used by `/assessment` page

**Expected Response:**
```json
{
  "success": true,
  "items": [
    {
      "item_id": "uuid",
      "type": "multiple-choice",
      "stem": "Question text...",
      "options": ["A", "B", "C", "D"],
      "domain": "Credit Management",
      "key": "A"
    }
  ]
}
```

**Assessment Page (`/assessment`):**
- Fetches questions from `/api/items`
- Displays questions to students
- Supports multiple-choice and short-answer formats
- Handles question shuffling
- Fallback to mock questions if API fails

---

## 🔧 Technical Implementation Details

### JSONB Field Handling
**Status:** ✅ Fixed (Recent Changes)

**Issue:** "invalid input syntax for type json" errors  
**Solution:**
- **POST (Create)**: Parse strings to JavaScript objects, pass directly to `pg` driver
  ```typescript
  const optionsValue = options ? (typeof options === 'string' ? JSON.parse(options) : options) : null;
  // pg driver automatically serializes to JSONB
  ```
- **PUT (Update)**: Stringify JavaScript objects before passing to SQL with `::jsonb` cast
  ```typescript
  updateFields.push(`options = $${paramIndex++}::jsonb`);
  updateValues.push(options ? JSON.stringify(options) : null);
  ```

### Question Status Management
**Status:** ✅ Implemented

- New questions default to `is_active = false` (safe default)
- Instructors can toggle status via Edit modal
- Status returned in all API responses
- Partial index on `is_active = true` for efficient queries

### Authentication & Authorization
**Status:** ✅ Implemented

- All instructor endpoints require Bearer token authentication
- Token verified via `verifyInstructorToken()` middleware
- Returns 401 if token missing or invalid
- Student endpoints may have different auth requirements

### Data Validation
**Status:** ✅ Implemented

**Server-side:**
- Required fields validated (`type`, `domain`, `question_text`)
- Difficulty range: 0.00 to 1.00 (database constraint)
- Option validation for multiple-choice (min 2 options)
- Answer key validation (must match option index)

**Client-side:**
- Form validation in EditQuestionModal
- Real-time validation feedback
- Error messages displayed to user

---

## 📈 Current Database State

**Question Count:** 1 question (1 active, 0 inactive)

**Sample Question:**
- **ID:** `550e8400-e29b-41d4-a716-446655440012`
- **Type:** `short_answer`
- **Domain:** `Credit Management`
- **Subdomain:** `Credit Cards`
- **Difficulty:** `0.40`
- **Stem:** "Explain the difference between a debit card and a..."
- **Status:** `is_active = true`
- **Created:** `2025-10-25 07:13:55`

---

## 🔄 Migration & Data Import

### Schema Migration
**Status:** ✅ Complete

- Base schema in `infra/schema.sql`
- `is_active` field added via `infra/migration-add-is-active-to-items.sql`
- Complete schema in `infra/vps-postgres-complete-schema.sql`
- All migrations applied to VPS PostgreSQL

### Data Migration
**Status:** ✅ Complete

- Questions migrated from Supabase to VPS PostgreSQL
- JSONB fields handled correctly during migration
- `is_active` defaulted appropriately during migration

---

## 🚧 Known Issues & Pending Work

### 1. Assessment Submission JSONB Error
**Status:** ⚠️ Pending Fix

**Issue:** `/api/assessment/submit` endpoint still experiencing "invalid input syntax for type json" errors when handling `raw_answer` field in responses array.

**Location:** `apps/web/src/app/api/assessment/submit/route.ts`

**Action Required:**
- Review how `raw_answer` is handled in responses
- Ensure proper JSONB serialization similar to question create/update fixes

### 2. Question Upload Endpoint Not Setting `is_active`
**Status:** ⚠️ Minor Issue

**Location:** `apps/web/src/app/api/instructor/questions/upload/route.ts`

**Issue:** Bulk upload doesn't explicitly set `is_active = false` (relies on database default, which should be fine, but not explicit).

**Action:** Add `is_active` to INSERT statement for consistency:
```sql
INSERT INTO items (..., is_active) VALUES (..., false)
```

### 3. Student Question Retrieval Filtering
**Status:** ⚠️ Needs Verification

**Location:** `apps/web/src/app/api/items/route.ts`

**Issue:** Need to verify that `/api/items` filters by `is_active = true` for student assessments.

**Action:** Check if query includes `WHERE is_active = true` filter.

### 4. Missing Features (Future Enhancements)

- **Question Versioning:** No version history/audit trail
- **Question Duplication:** No "duplicate question" feature
- **Question Import from External Sources:** Only CSV upload, no other formats
- **Question Categories/Tags:** Only domain/subdomain, no additional categorization
- **Question Preview:** No preview mode before saving
- **Question Export:** No export to CSV/JSON functionality
- **Question Analytics:** No usage statistics (how many times used, average scores, etc.)
- **Question Bank Search:** Advanced search (full-text search on stem, options, explanation)
- **Question Dependencies:** No linking between related questions
- **Question Review Workflow:** No approval workflow for new questions

---

## ✅ Summary: What's Working

1. **Database Schema:** ✅ Complete with all necessary fields
2. **Question CRUD Operations:** ✅ All working (Create, Read, Update, Delete)
3. **Bulk Upload:** ✅ CSV upload working
4. **Question Status Management:** ✅ `is_active` toggle implemented
5. **Instructor UI:** ✅ Full-featured question management page
6. **Authentication:** ✅ Instructor authentication working
7. **JSONB Handling:** ✅ Fixed in Create/Update endpoints
8. **Data Validation:** ✅ Server and client-side validation working
9. **Question Types:** ✅ Multiple-choice and short-answer supported

---

## ⚠️ What Needs Attention

1. **Assessment Submission:** JSONB error in `raw_answer` handling (pending)
2. **Question Upload:** Explicitly set `is_active` in bulk upload (minor)
3. **Student Question Filtering:** Verify `is_active` filter in `/api/items` (verification needed)

---

## 📚 Related Files

- **API Routes:**
  - `apps/web/src/app/api/instructor/questions/route.ts` - List & Create
  - `apps/web/src/app/api/instructor/questions/[id]/route.ts` - Get, Update, Delete
  - `apps/web/src/app/api/instructor/questions/upload/route.ts` - Bulk Upload
  - `apps/web/src/app/api/items/route.ts` - Student Question Retrieval

- **UI Components:**
  - `apps/web/src/app/instructor/questions/page.tsx` - Instructor Question Management Page

- **Database Schema:**
  - `infra/schema.sql` - Base schema
  - `infra/migration-add-is-active-to-items.sql` - is_active field migration
  - `infra/vps-postgres-complete-schema.sql` - Complete consolidated schema

- **Documentation:**
  - This file: `docs/QUESTION_FEATURES_IMPLEMENTATION.md`

---

**Last Updated:** January 2025  
**Status:** ✅ Core Features Complete, Minor Issues Pending

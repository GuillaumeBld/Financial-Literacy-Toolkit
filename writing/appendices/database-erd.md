# Appendix B: Database Entity-Relationship Diagram

## Overview

The Financial Literacy Assessment Platform uses PostgreSQL 15 with 14 tables organized into four functional groups. This appendix provides the complete entity-relationship diagram and table specifications.

---

## Mermaid Diagram

See `/diagrams/database-erd.mmd` for the complete Mermaid source.

To render the diagram:
1. Use a Mermaid-compatible viewer (VS Code extension, Mermaid Live Editor)
2. Or convert to image: `mmdc -i database-erd.mmd -o database-erd.png`

---

## Table Specifications

### Core Assessment Tables

#### `users`
Stores hashed student identifiers only (FERPA compliant).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| hashed_student_key | TEXT | NOT NULL, UNIQUE | SHA256(course_pepper + student_id) |
| sso_provider | TEXT | | SSO provider if used |
| hashed_password | TEXT | | Bcrypt hash for password auth |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### `courses`
Course metadata including per-course pepper (salt).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| course_id | UUID | PK | Primary key |
| name | TEXT | NOT NULL | Course name |
| term | TEXT | NOT NULL | Term (e.g., "Spring 2026") |
| pepper | TEXT | NOT NULL, UNIQUE | Random salt for hashing |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### `enrollments`
User-course associations with role assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PK, FK → users | User reference |
| course_id | UUID | PK, FK → courses | Course reference |
| role | TEXT | NOT NULL, DEFAULT 'student' | student/instructor/admin |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Enrollment time |

#### `instruments`
Assessment forms/versions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| instrument_id | UUID | PK | Primary key |
| name | TEXT | NOT NULL | Instrument name |
| version | TEXT | NOT NULL | Version identifier |
| status | TEXT | NOT NULL, DEFAULT 'active' | active/deprecated/archived |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### `items`
Question bank with domain, difficulty, and scoring information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| item_id | UUID | PK | Primary key |
| external_item_id | TEXT | | Original question ID (e.g., "1", "2") |
| domain | TEXT | NOT NULL | Domain category |
| subdomain | TEXT | NOT NULL | Subdomain/subcategory |
| difficulty | DECIMAL(3,2) | CHECK 0-1 | Item difficulty |
| type | TEXT | NOT NULL | multiple_choice/short_answer/numeric |
| stem | TEXT | NOT NULL | Question text |
| options | JSONB | | Answer options array |
| key | TEXT | | Correct answer |
| rubric | JSONB | | Scoring rubric |
| is_anchor | BOOLEAN | DEFAULT false | Anchor item flag |
| is_active | BOOLEAN | DEFAULT false | Active item flag |
| is_scored | BOOLEAN | DEFAULT true | Contributes to score |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### `attempts`
Assessment attempt records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| attempt_id | UUID | PK | Primary key |
| user_id | UUID | NOT NULL, FK → users | User reference |
| course_id | UUID | NOT NULL, FK → courses | Course reference |
| instrument_id | UUID | NOT NULL, FK → instruments | Instrument reference |
| attempt_type | TEXT | NOT NULL | pre/post |
| started_at | TIMESTAMPTZ | DEFAULT NOW() | Start time |
| submitted_at | TIMESTAMPTZ | | Submission time (NULL if in-progress) |
| duration_s | INTEGER | | Total time in seconds |
| metadata | JSONB | DEFAULT '{}' | Anti-cheating metadata |
| session_token | UUID | | Multi-tab prevention token |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |

#### `responses`
Individual item responses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| response_id | UUID | PK | Primary key |
| attempt_id | UUID | NOT NULL, FK → attempts | Attempt reference |
| item_id | UUID | NOT NULL, FK → items | Item reference |
| raw_answer | JSONB | NOT NULL | Student's answer |
| score | DECIMAL(5,2) | | Calculated score (0-100) |
| confidence | INTEGER | CHECK 1-3 | Confidence rating |
| ai_confidence | DECIMAL(3,2) | | AI scoring confidence |
| ai_flags | JSONB | | AI analysis flags |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Response time |

**Constraint**: UNIQUE(attempt_id, item_id)

#### `scores`
Calculated domain and overall scores.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| attempt_id | UUID | PK, FK → attempts | Attempt reference |
| overall | DECIMAL(5,2) | NOT NULL | Overall score (0-100) |
| by_domain | JSONB | NOT NULL | Domain scores |
| se_overall | DECIMAL(5,2) | NOT NULL | Standard error |
| overconfidence_index | DECIMAL(5,2) | | Confidence calibration |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Scoring time |

### Baseline Covariates

#### `student_profiles`
Demographic and socioeconomic data (B1-B13).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| profile_id | UUID | PK | Primary key |
| user_id | UUID | NOT NULL, FK → users | User reference |
| course_id | UUID | NOT NULL, FK → courses | Course reference |
| email | TEXT | | Contact email |
| gender | TEXT | CHECK IN (...) | B1: Gender |
| race_ethnicity | TEXT | | B2: Race/ethnicity |
| age_range | TEXT | CHECK IN (...) | B3: Age range |
| first_language | TEXT | CHECK IN (...) | B4: First language |
| first_language_other | TEXT | | B4: Other specification |
| work_experience | TEXT | CHECK IN (...) | B5: Work experience |
| prior_financial_products | JSONB | | B6: Prior products array |
| self_rated_financial_knowledge | TEXT | CHECK IN (...) | B7: Self-rated knowledge |
| financial_stress_frequency | TEXT | CHECK IN (...) | B8: Stress frequency |
| parental_education | TEXT | CHECK IN (...) | B9: Parental education |
| first_generation_college | TEXT | CHECK IN (...) | B10: First-gen status |
| has_student_loan_debt | TEXT | CHECK IN (...) | B11: Debt status |
| student_loan_interest_rate | TEXT | CHECK IN (...) | B12: Interest rate |
| student_loan_maturity | TEXT | CHECK IN (...) | B13: Loan maturity |
| completed_at | TIMESTAMPTZ | DEFAULT NOW() | Completion time |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Record creation time |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update time |

**Constraint**: UNIQUE(user_id, course_id)

### Instructor Management

#### `instructors`
| Column | Type | Description |
|--------|------|-------------|
| instructor_id | UUID | Primary key |
| email | TEXT | Unique email |
| hashed_password | TEXT | PBKDF2-SHA512 hash |
| full_name | TEXT | Display name |
| department | TEXT | Department |
| is_active | BOOLEAN | Active status |
| last_login_at | TIMESTAMPTZ | Last login |

#### `instructor_courses`
| Column | Type | Description |
|--------|------|-------------|
| instructor_id | UUID | FK → instructors |
| course_id | UUID | FK → courses |
| access_level | TEXT | view/edit/admin |
| created_at | TIMESTAMPTZ | Assignment time |

#### `instructor_sessions`
| Column | Type | Description |
|--------|------|-------------|
| session_id | UUID | Primary key |
| instructor_id | UUID | FK → instructors |
| token | TEXT | Session token |
| expires_at | TIMESTAMPTZ | Expiration time |
| created_at | TIMESTAMPTZ | Creation time |

---

## Indexes

Performance optimization indexes:

```sql
-- Core lookups
CREATE INDEX idx_users_hashed_student_key ON users(hashed_student_key);
CREATE INDEX idx_attempts_user_course ON attempts(user_id, course_id);
CREATE INDEX idx_attempts_session_token ON attempts(session_token);
CREATE INDEX idx_responses_attempt ON responses(attempt_id);
CREATE INDEX idx_responses_item ON responses(item_id);
CREATE INDEX idx_items_domain ON items(domain);
CREATE INDEX idx_items_external_item_id ON items(external_item_id);

-- Filtered indexes
CREATE INDEX idx_items_anchor ON items(is_anchor) WHERE is_anchor = true;
CREATE INDEX idx_items_is_active ON items(is_active) WHERE is_active = true;
CREATE INDEX idx_attempts_course_submitted ON attempts(course_id, submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- Instructor indexes
CREATE INDEX idx_instructor_sessions_token ON instructor_sessions(token);
CREATE INDEX idx_instructor_sessions_expires ON instructor_sessions(expires_at);
```

---

## Row-Level Security

RLS is enabled on all tables:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_sessions ENABLE ROW LEVEL SECURITY;
```

Access control is enforced at the application layer using connection-level authentication.

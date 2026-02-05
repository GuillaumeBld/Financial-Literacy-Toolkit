# Data Model

## Core Tables

### users
```sql
users(
  user_id UUID PRIMARY KEY,
  hashed_student_key TEXT UNIQUE,  -- SHA256(course_pepper + student_id)
  sso_provider TEXT,
  created_at TIMESTAMP
)
```

### courses
```sql
courses(
  course_id UUID PRIMARY KEY,
  name TEXT,
  term TEXT,
  pepper TEXT  -- Course-specific pepper for hashing
)
```

### enrollments
```sql
enrollments(
  user_id UUID REFERENCES users,
  course_id UUID REFERENCES courses,
  role TEXT  -- 'student' or 'instructor'
)
```

### instruments
```sql
instruments(
  instrument_id UUID PRIMARY KEY,
  name TEXT,
  version TEXT,
  status TEXT  -- 'draft', 'active', 'archived'
)
```

### items
```sql
items(
  item_id UUID PRIMARY KEY,
  anchor_id TEXT,           -- e.g., 'Q1', 'Q15', 'B1'
  domain TEXT,              -- 'Borrowing & Credit', 'Risk Management', 'Investment & Risk'
  subdomain TEXT,           -- e.g., 'Compound Interest', 'Insurance'
  difficulty DECIMAL,
  item_type TEXT,           -- 'mcq', 'tf', 'open_ended', 'baseline'
  stem TEXT,                -- Question text
  options JSONB,            -- Answer options
  correct_answer TEXT,      -- Correct answer key
  rubric JSONB,             -- For open-ended: {accept, partial, reject}
  is_anchor BOOLEAN,        -- TRUE for Q1-Q40, FALSE for SDM variants
  is_scored BOOLEAN,        -- TRUE for knowledge items, FALSE for preference/baseline
  variant_type TEXT,        -- NULL for anchors; 'Lower_TF', 'Lower_MCQ', 'Same_MCQ', 'Higher_MCQ', 'Open_Confirm', 'Open_Diagnose' for variants
  parent_anchor_id TEXT,    -- For variants: references parent anchor (e.g., 'Q1')
  is_active BOOLEAN DEFAULT TRUE
)
```

### student_profiles
```sql
student_profiles(
  user_id UUID REFERENCES users,
  course_id UUID REFERENCES courses,
  -- Demographic (B1-B5)
  gender TEXT,
  race_ethnicity TEXT,
  age_range TEXT,
  first_language TEXT,
  first_language_other TEXT,
  work_experience TEXT,
  -- Financial Background (B6-B10)
  prior_financial_products JSONB,
  self_rated_financial_knowledge TEXT,
  financial_stress_frequency TEXT,
  parental_education TEXT,
  first_generation_college TEXT,
  -- Student Loan (B11-B13)
  has_student_loan_debt TEXT,
  student_loan_interest_rate TEXT,
  student_loan_maturity TEXT,
  created_at TIMESTAMP
)
```

### attempts
```sql
attempts(
  attempt_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users,
  course_id UUID REFERENCES courses,
  instrument_id UUID REFERENCES instruments,
  attempt_type TEXT,        -- 'pre' or 'post'
  started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  duration_s INTEGER
)
```

### responses
```sql
responses(
  response_id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES attempts,
  item_id UUID REFERENCES items,
  raw_answer TEXT,          -- Student's selected answer
  score INTEGER,            -- 0 or 1 for scored items
  confidence INTEGER,       -- 1, 2, or 3 (Low, Mid, High)
  need_score INTEGER,       -- Calculated Need score (0-5) for SDM selection
  ai_score INTEGER,         -- For open-ended: 0, 1, or 2
  ai_confidence DECIMAL,    -- AI model confidence (0-1)
  ai_flags JSONB,           -- Misconception tags
  responded_at TIMESTAMP
)
```

### scores
```sql
scores(
  attempt_id UUID PRIMARY KEY REFERENCES attempts,
  overall DECIMAL,                    -- Overall percent correct (26 items)
  by_domain JSONB,                    -- {borrowing: X, risk_mgmt: Y, investment: Z}
  se_overall DECIMAL,                 -- Standard error
  overconfidence_index DECIMAL,       -- z(confidence) - z(score)
  sdm_summary JSONB                   -- {items_selected: [...], misconceptions: [...]}
)
```

## Key Relationships

```
users ─┬─ enrollments ─── courses
       │
       └─ student_profiles
       │
       └─ attempts ─┬─ responses ─── items
                    │
                    └─ scores
```

## Item Classification

| anchor_id Range | is_anchor | is_scored | Description |
|-----------------|-----------|-----------|-------------|
| B1-B13 | FALSE | FALSE | Baseline covariates |
| Q1-Q14 | TRUE | TRUE | Knowledge items (Borrowing, Risk Mgmt) |
| Q15-Q28 | TRUE | FALSE | Preference items (covariates) |
| Q29-Q40 | TRUE | TRUE | Knowledge items (Investment) |
| *_Lower_TF | FALSE | - | SDM variant |
| *_Lower_MCQ | FALSE | - | SDM variant |
| *_Same_MCQ | FALSE | - | SDM variant |
| *_Higher_MCQ | FALSE | - | SDM variant |
| *_Open_Confirm | FALSE | - | SDM variant |
| *_Open_Diagnose | FALSE | - | SDM variant |

## See Also

- `infra/schema.sql` - Full schema with constraints
- `infra/seed.sql` - Sample data
- `infra/rls-policies.sql` - Row Level Security policies

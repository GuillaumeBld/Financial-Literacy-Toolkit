# Database Entity-Relationship Diagram

This diagram shows the complete data model for the Financial Literacy Assessment Platform.

## Overview

The database consists of **14 tables** organized into four functional groups:
- Core Assessment Tables (8)
- Baseline Covariates (1)
- Instructor Management (3)
- System Tables (2)

## ER Diagram

```mermaid
erDiagram
    USERS {
        uuid user_id PK
        text hashed_student_key UK
        text sso_provider
        text hashed_password
        timestamp created_at
    }

    COURSES {
        uuid course_id PK
        text name
        text term
        text pepper UK
        timestamp created_at
    }

    ENROLLMENTS {
        uuid user_id PK,FK
        uuid course_id PK,FK
        text role
        timestamp created_at
    }

    ATTEMPTS {
        uuid attempt_id PK
        uuid user_id FK
        uuid course_id FK
        uuid instrument_id FK
        text attempt_type
        timestamp started_at
        timestamp submitted_at
        integer duration_s
        jsonb metadata
        uuid session_token
    }

    RESPONSES {
        uuid response_id PK
        uuid attempt_id FK
        uuid item_id FK
        jsonb raw_answer
        decimal score
        integer confidence
    }

    SCORES {
        uuid attempt_id PK,FK
        decimal overall
        jsonb by_domain
        decimal se_overall
        decimal overconfidence_index
    }

    STUDENT_PROFILES {
        uuid profile_id PK
        uuid user_id FK
        uuid course_id FK
        text gender
        text race_ethnicity
        text age_range
        text first_language
        text work_experience
        jsonb prior_financial_products
        text self_rated_financial_knowledge
        text financial_stress_frequency
    }

    USERS ||--o{ ENROLLMENTS : "enrolled in"
    COURSES ||--o{ ENROLLMENTS : "has"
    USERS ||--o{ ATTEMPTS : "takes"
    COURSES ||--o{ ATTEMPTS : "contains"
    ATTEMPTS ||--o{ RESPONSES : "contains"
    ATTEMPTS ||--o| SCORES : "produces"
    USERS ||--o| STUDENT_PROFILES : "has"
```

## Table Groups

### Core Assessment Tables

| Table | Purpose |
|-------|---------|
| `users` | Hashed student identifiers (FERPA compliant) |
| `courses` | Course metadata with per-course pepper |
| `enrollments` | User-course associations |
| `instruments` | Assessment forms/versions |
| `items` | Question bank |
| `attempts` | Assessment attempt records |
| `responses` | Individual item responses |
| `scores` | Calculated domain/overall scores |

### Baseline Covariates

| Table | Purpose |
|-------|---------|
| `student_profiles` | Demographic and socioeconomic data (B1-B13) |

### Instructor Management

| Table | Purpose |
|-------|---------|
| `instructors` | Instructor accounts |
| `instructor_courses` | Course assignments |
| `instructor_sessions` | Token-based sessions |

## Key Relationships

- Each **user** can have multiple **attempts** across courses
- Each **attempt** contains multiple **responses** (one per item)
- Each **attempt** produces one **score** record
- Each **user** has one **student_profile** per course
- **Instructors** are linked to **courses** via assignments

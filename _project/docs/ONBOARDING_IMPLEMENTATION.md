# Onboarding Implementation

## Overview

The onboarding page collects baseline demographic and financial background data as specified in the research methodology (Baseline Covariates B1-B13). This data is used for heterogeneity analysis to understand which factors predict learning gains across students.

## Baseline Questions Collected

### Step 1: Student Identification
- Student ID (hashed for FERPA compliance)
- Course Code (pre-filled from URL parameter)

### Step 2: Demographic Characteristics (B1-B5)

**B1: Gender**
- Female
- Male
- Prefer not to say

**B2: Race/Ethnicity**
- White or Caucasian
- Asian
- Black or African American
- Hispanic or Latino
- Native Hawaiian or Pacific Islander
- Native American or Alaska Native
- Two or more racial or ethnic backgrounds
- Other
- Prefer not to say

**B3: Age Range**
- 20 or under
- Above 20

**B4: First Language**
- English
- Spanish
- Chinese (any dialect)
- French
- Russian
- Dutch
- Other (with text specification)

**B5: Work Experience**
- No work experience
- Part-time employment
- Full-time employment

### Step 3: Financial Background & Context (B6-B10)

**B6: Prior Financial Products** (Multi-select)
- Credit card
- Student loan
- Auto loan
- Investment account (stocks, ETFs, mutual funds)
- Insurance policy in your own name
- None of the above

**B7: Self-Rated Financial Knowledge**
- Very low
- Low
- Moderate
- High
- Very high

**B8: Financial Stress Frequency**
- Never
- Rarely
- Sometimes
- Often
- Always

**B9: Highest Level of Parental Education**
- Less than high school
- High school diploma or GED
- Some college, no degree
- Associate degree (AA/AS)
- Bachelor's degree (BA/BS)
- Graduate or professional degree (MA/MS/MBA/PhD/MD/JD, etc.)
- Don't know
- Prefer not to answer

**B10: First-Generation College Student**
- Yes
- No
- Prefer not to say

### Step 4: Student Loan Debt Status (B11-B13)

**B11: Do you currently have any student loan debt?**
- Yes
- No
- Prefer not to say

**B12: Interest rate on student loan debt (if B11=Yes)**
- Less than 5%
- Between 5% and 10%
- Above 10%
- I do not know
- Prefer not to say

**B13: Maturity of student loan (if B11=Yes)**
- Less than 5 years
- 5 to 10 years
- More than 10 years
- Do not know
- Prefer not to say

## Database Schema

The `student_profiles` table stores all onboarding data:

```sql
-- Baseline Demographic Characteristics (B1-B5)
gender TEXT -- B1
race_ethnicity TEXT -- B2
age_range TEXT -- B3: '20-or-under' or 'above-20'
first_language TEXT -- B4
first_language_other TEXT -- B4: Other specification
work_experience TEXT -- B5

-- Baseline Financial Background & Context (B6-B10)
prior_financial_products JSONB -- B6: Array of selected products
self_rated_financial_knowledge TEXT -- B7
financial_stress_frequency TEXT -- B8
parental_education TEXT -- B9
first_generation_college TEXT -- B10

-- Student Loan Debt Status (B11-B13)
has_student_loan_debt TEXT -- B11: 'yes', 'no', 'prefer-not-to-say'
student_loan_interest_rate TEXT -- B12: Conditional on B11=yes
student_loan_maturity TEXT -- B13: Conditional on B11=yes
```

## User Flow

1. User enters course code on `/start` page
2. Course code is validated
3. User is redirected to `/onboarding?courseCode=XXX`
4. User completes 4-step onboarding form:
   - Step 1: Student ID entry
   - Step 2: Demographic information (B1-B5)
   - Step 3: Financial background (B6-B10)
   - Step 4: Student loan debt status (B11-B13, with B12-B13 conditional on B11=Yes)
5. Data is saved to `student_profiles` table
6. User is redirected to `/assessment` to begin the assessment

## FERPA Compliance

- Student IDs are hashed using SHA256 with course-specific peppers
- No raw student IDs are stored in the database
- All data is linked to hashed `user_id` only
- Row Level Security (RLS) is enabled on the `student_profiles` table

## API Endpoint

**POST** `/api/onboarding/submit`

**Request Body:**
```json
{
  "courseCode": "FINC 000",
  "studentId": "123456789",
  "demographic": {
    "age_range": "20-or-under",
    "gender": "female",
    "race_ethnicity": "White or Caucasian",
    "first_language": "english",
    "first_language_other": null,
    "work_experience": "part-time"
  },
  "financial_background": {
    "prior_financial_products": ["credit-card", "student-loan"],
    "self_rated_financial_knowledge": "moderate",
    "financial_stress_frequency": "sometimes"
  },
  "socioeconomic": {
    "household_income": "50000-74999",
    "parental_education": "bachelors",
    "first_generation_college": false,
    "financial_aid_recipient": true,
    "living_situation": "on-campus",
    "work_study": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "data": {
    "userId": "uuid",
    "courseId": "uuid"
  }
}
```

## Migration

To apply the database schema, run:

```sql
\i infra/migration-add-student-profiles.sql
```

Or execute the SQL file directly in your PostgreSQL database.

## Notes

- The `prior_financial_products` field is stored as JSONB array in PostgreSQL
- The node-postgres driver automatically converts JavaScript arrays to JSONB
- All baseline questions (B1-B8) are required fields
- Additional socio-economic questions are optional
- The form includes proper validation and error handling
- Progress indicator shows completion percentage across all steps


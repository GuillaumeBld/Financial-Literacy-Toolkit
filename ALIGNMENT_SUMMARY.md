# Alignment Summary: Independent Study and Platform Implementation

This document summarizes the alignment between the independent study objectives (as defined in `independant_study.md`) and the current platform implementation.

## Source of Truth

The authoritative specification comes from `Archive.zip` containing:
- `Introduction_final_draft.md` - Full study design
- `Questions.csv` - 40 anchor assessment questions
- `SDM10_Item_Bank.csv` - Supplemental Diagnostic Module variants

## Assessment Structure (Source of Truth)

| Component | Count | Details |
|-----------|-------|---------|
| **Baseline Covariates** | 12 items (B1-B12) | Demographics, financial background, debt status - NOT scored |
| **Core Assessment** | 40 items (Q1-Q40) | Fixed anchor items, identical pre/post |
| **Knowledge Items (Scored)** | 26 items | Q1-Q14, Q29-Q40 |
| **Preference Items (Unscored)** | 14 items | Q15-Q28 - used as covariates for RQ2 |
| **SDM-10** | 10 items | Selected from item bank based on correctness + confidence |
| **Total Questions** | 62 items | 12 baseline + 40 core + 10 SDM |

### Confidence Rating Scale
- **1-3 scale** (Low, Mid, High)
- NOT 1-5 as previously documented

### Three Domains
1. **Borrowing, Interest Rates, and Financial Numeracy Knowledge** (Q1-Q10, 10 items)
2. **Behavioral and Risk Management Knowledge** (Q11-Q28, 18 items)
   - Knowledge items: Q11-Q14 (scored)
   - Preference items: Q15-Q28 (unscored covariates)
3. **Risk and Return Knowledge** (Q29-Q40, 12 items)

## Aligned Components

### 1. Research Questions (RQ1 & RQ2)
- **Status**: Platform supports both research questions
- **RQ1 (Learning gains)**:
  - Platform tracks pre/post assessment scores
  - Calculates domain-specific scores
  - Supports within-subject analysis
- **RQ2 (Heterogeneity)**:
  - Platform collects baseline demographic and socioeconomic data
  - Stores confidence ratings for analysis
  - Tracks behavioral indicators (financial stress, prior experience)

### 2. Baseline Covariates Collection
- **B1**: Gender (Female, Male, Prefer not to say)
- **B2**: Race/Ethnicity (9 options)
- **B3**: Age range (20 or under, Above 20)
- **B4**: First language (English, Spanish, Chinese, French, Russian, Dutch, Other)
- **B5**: Work experience (No work experience, Part-time, Full-time)
- **B6**: Prior financial products used (multi-select)
- **B7**: Self-rated financial knowledge (Very low to Very high)
- **B8**: Financial stress frequency (Never to Always)
- **B9**: Highest level of parental education
- **B10**: First-generation college student
- **B11**: Student loan debt status
- **B12**: Student loan interest rate (if applicable)

### 3. Platform Infrastructure
- Web-based administration
- FERPA-compliant data storage
- Hashed student identifiers
- Time-stamped submissions
- Analysis-ready data exports

### 4. SDM-10 Selection Logic

| Confidence | If Correct | If Incorrect |
|------------|------------|--------------|
| 1 (Low) | Open-ended to confirm understanding | Lower level T/F or simplified MCQ |
| 2 (Mid) | Same level MCQ | Lower level MCQ or T/F |
| 3 (High) | Optional higher level MCQ | Open-ended to diagnose misconception |

**SDM-10 Controls:**
- Fixed 10 items after 40 anchor questions
- Ranked by Need at subcategory level
- At least 2 items per domain
- Max 2 SDM items per subcategory
- Max 3 open-ended items in SDM-10

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Research Questions | 100% | Platform fully supports RQ1 and RQ2 |
| Assessment Structure | 100% | 40 anchor + 10 SDM + 12 baseline |
| Baseline Covariates | 100% | All 12 items (B1-B12) implemented |
| Platform Infrastructure | 100% | Fully aligned |
| Confidence Scale | Needs Update | Change from 1-5 to 1-3 |
| SDM-10 Adaptive Logic | In Progress | Selection algorithm per source of truth |
| Psychometric Validation | Planned | EFA, Cronbach's alpha |

## References

- Independent Study Document: [`independant_study.md`](./independant_study.md)
- Source of Truth Archive: `Archive.zip`
- Platform README: [`README.md`](./README.md)
- Database Schema: [`infra/schema.sql`](./infra/schema.sql)

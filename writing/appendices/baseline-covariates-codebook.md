# Appendix E: Baseline Covariates Codebook

## Overview

This codebook documents the 13 baseline covariate items (B1-B13) collected during the onboarding phase. These items are stored in the `student_profiles` table and used for heterogeneity analysis (RQ2).

---

## Variable Summary

| Variable | Label | Type | Values |
|----------|-------|------|--------|
| gender | B1: Gender | Categorical | female, male, prefer-not-to-say |
| race_ethnicity | B2: Race/Ethnicity | Categorical | See below |
| age_range | B3: Age Range | Categorical | 20-or-under, above-20 |
| first_language | B4: First Language | Categorical | See below |
| work_experience | B5: Work Experience | Categorical | no-work-experience, part-time, full-time |
| prior_financial_products | B6: Prior Financial Products | Array | See below |
| self_rated_financial_knowledge | B7: Self-Rated Knowledge | Ordinal | very-low to very-high |
| financial_stress_frequency | B8: Financial Stress | Ordinal | never to always |
| parental_education | B9: Parental Education | Ordinal | See below |
| first_generation_college | B10: First-Gen Status | Categorical | yes, no, prefer-not-to-say |
| has_student_loan_debt | B11: Student Loan Debt | Categorical | yes, no, prefer-not-to-say |
| student_loan_interest_rate | B12: Interest Rate | Ordinal | See below |
| student_loan_maturity | B13: Loan Maturity | Ordinal | See below |

---

## Detailed Variable Descriptions

### B1: Gender (`gender`)

**Question**: What is your gender?

| Code | Label |
|------|-------|
| female | Female |
| male | Male |
| prefer-not-to-say | Prefer not to say |

---

### B2: Race/Ethnicity (`race_ethnicity`)

**Question**: Which category best describes your racial or ethnic background?

| Code | Label |
|------|-------|
| white-or-caucasian | White or Caucasian |
| asian | Asian |
| black-or-african-american | Black or African American |
| hispanic-or-latino | Hispanic or Latino |
| native-hawaiian-or-pacific-islander | Native Hawaiian or Pacific Islander |
| native-american-or-alaska-native | Native American or Alaska Native |
| two-or-more | Two or more racial or ethnic backgrounds |
| other | Other |
| prefer-not-to-say | Prefer not to say |

---

### B3: Age Range (`age_range`)

**Question**: What is your age range?

| Code | Label |
|------|-------|
| 20-or-under | 20 or under |
| above-20 | Above 20 |
| prefer-not-to-answer | Prefer not to answer |

---

### B4: First Language (`first_language`, `first_language_other`)

**Question**: What is your first language?

| Code | Label |
|------|-------|
| english | English |
| spanish | Spanish |
| chinese | Chinese (any dialect) |
| french | French |
| russian | Russian |
| dutch | Dutch |
| other | Other (please specify) |
| prefer-not-to-answer | Prefer not to answer |

**Note**: If `first_language = 'other'`, the `first_language_other` field contains the specification.

---

### B5: Work Experience (`work_experience`)

**Question**: Do you have work experience?

| Code | Label |
|------|-------|
| no-work-experience | No work experience |
| part-time | Part-time employment |
| full-time | Full-time employment |
| prefer-not-to-answer | Prefer not to answer |

---

### B6: Prior Financial Products (`prior_financial_products`)

**Question**: Prior to enrolling in this course, had you personally used any of the following financial products? (Select all that apply)

**Type**: JSONB array of selected values

| Code | Label |
|------|-------|
| credit-card | Credit card |
| student-loan | Student loan |
| auto-loan | Auto loan |
| investment-account | Investment account (stocks, ETFs, mutual funds) |
| insurance | Insurance policy in your own name |
| none | None of the above |

**Example**: `["credit-card", "student-loan"]`

**Derived Variables**:
- `prior_products_count`: Count of products selected (0-5, excluding "none")
- `has_investment_experience`: Binary indicator for investment-account

---

### B7: Self-Rated Financial Knowledge (`self_rated_financial_knowledge`)

**Question**: Before enrolling in this course, how would you rate your overall financial knowledge?

| Code | Label | Numeric |
|------|-------|---------|
| very-low | Very low | 1 |
| low | Low | 2 |
| moderate | Moderate | 3 |
| high | High | 4 |
| very-high | Very high | 5 |
| prefer-not-to-answer | Prefer not to answer | . (missing) |

---

### B8: Financial Stress Frequency (`financial_stress_frequency`)

**Question**: How often do you feel financially stressed?

| Code | Label | Numeric |
|------|-------|---------|
| never | Never | 1 |
| rarely | Rarely | 2 |
| sometimes | Sometimes | 3 |
| often | Often | 4 |
| always | Always | 5 |
| prefer-not-to-answer | Prefer not to answer | . (missing) |

---

### B9: Parental Education (`parental_education`)

**Question**: Highest level of parental education

| Code | Label | Numeric |
|------|-------|---------|
| less-than-high-school | Less than high school | 1 |
| high-school-diploma-or-ged | High school diploma or GED | 2 |
| some-college-no-degree | Some college, no degree | 3 |
| associate-degree | Associate degree (AA/AS) | 4 |
| bachelors-degree | Bachelor's degree (BA/BS) | 5 |
| graduate-or-professional-degree | Graduate or professional degree | 6 |
| dont-know | Don't know | . (missing) |
| prefer-not-to-answer | Prefer not to answer | . (missing) |

---

### B10: First-Generation College Student (`first_generation_college`)

**Question**: Are you a first-generation college student?

| Code | Label |
|------|-------|
| yes | Yes |
| no | No |
| prefer-not-to-say | Prefer not to say |

**Definition**: A first-generation college student is one whose parents did not complete a four-year college degree.

---

### B11: Student Loan Debt (`has_student_loan_debt`)

**Question**: Do you currently have any student loan debt?

| Code | Label |
|------|-------|
| yes | Yes |
| no | No |
| prefer-not-to-say | Prefer not to say |

**Note**: B12 and B13 are conditional on B11 = 'yes'

---

### B12: Student Loan Interest Rate (`student_loan_interest_rate`)

**Question**: If yes, what is the interest rate on your student loan debt (best estimate)?

**Condition**: Only asked if `has_student_loan_debt = 'yes'`

| Code | Label |
|------|-------|
| less-than-5 | Less than 5% |
| between-5-and-10 | Between 5% and 10% |
| above-10 | Above 10% |
| do-not-know | I do not know |
| prefer-not-to-say | Prefer not to say |

---

### B13: Student Loan Maturity (`student_loan_maturity`)

**Question**: If yes, what is the maturity of your student loan (time until fully repaid)?

**Condition**: Only asked if `has_student_loan_debt = 'yes'`

| Code | Label |
|------|-------|
| less-or-equal-3-years | Less than or equal to 3 years |
| between-3-to-5-years | Between 3 to 5 years |
| above-5-years | More than 5 years |
| do-not-know | I do not know |
| prefer-not-to-say | Prefer not to say |

---

## Missing Value Codes

- `NULL`: Item was skipped or not applicable
- `prefer-not-to-say` / `prefer-not-to-answer`: Respondent declined to answer
- `dont-know` / `do-not-know`: Respondent does not know the answer

For statistical analysis:
- Treat `prefer-not-to-*` as system missing
- `dont-know` may be treated as a valid category or as missing depending on analysis

---

## Derived Variables for Analysis

### Binary Indicators

| Variable | Derivation |
|----------|------------|
| is_female | gender = 'female' |
| is_first_gen | first_generation_college = 'yes' |
| is_underrepresented_minority | race_ethnicity IN ('black-or-african-american', 'hispanic-or-latino', 'native-american-or-alaska-native', 'native-hawaiian-or-pacific-islander') |
| has_work_experience | work_experience IN ('part-time', 'full-time') |
| has_debt | has_student_loan_debt = 'yes' |
| high_stress | financial_stress_frequency IN ('often', 'always') |

### Ordinal to Numeric

| Variable | Coding |
|----------|--------|
| knowledge_numeric | very-low=1, low=2, moderate=3, high=4, very-high=5 |
| stress_numeric | never=1, rarely=2, sometimes=3, often=4, always=5 |
| parental_ed_numeric | less-than-high-school=1 ... graduate=6 |

### Counts

| Variable | Derivation |
|----------|------------|
| prior_products_count | Length of prior_financial_products array, excluding 'none' |

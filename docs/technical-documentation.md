# Financial Literacy Assessment Platform: Technical Documentation

**Version**: 1.0
**Last Updated**: February 5, 2026
**Assessment Window**: February 2-8, 2026

---

## 1. Executive Summary

### 1.1 Purpose and Scope

This document provides comprehensive technical documentation for the Financial Literacy Assessment Platform, a web-based measurement system developed to support research evaluating learning outcomes in Quinn 102 (Financial Literacy) during the 2026 offering. The platform administers a structured questionnaire in both pre-course and post-course windows, enabling measurement of student learning gains and analysis of heterogeneity in outcomes across student characteristics.

The platform serves two primary functions: (1) standardized assessment delivery with privacy-preserving data collection, and (2) instructor analytics for real-time monitoring of student progress and preliminary analysis of learning outcomes. This documentation is intended to complement the research paper by providing implementation details, data collection procedures, and statistical methodology specifications.

### 1.2 Research Questions Overview

The platform is designed to support two research questions:

**RQ1 (Learning Gains)**: What is the magnitude of student learning in Quinn 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre to post changes in knowledge?

**RQ2 (Heterogeneity)**: Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

### 1.3 Platform Capabilities Summary

The platform provides the following capabilities:

- **FERPA-Compliant Authentication**: Student identifiers are transformed into one-way SHA-256 hashes prior to storage, ensuring no raw personally identifiable information is retained in the research dataset.
- **Structured Assessment Delivery**: A 40-item anchor assessment administered identically in pre- and post-course windows, followed by a 10-item Supplemental Diagnostic Module (SDM-10) selected adaptively based on response patterns.
- **Baseline Covariate Collection**: A 13-item demographic and socioeconomic questionnaire (B1-B13) administered during onboarding.
- **Real-Time Analytics**: Instructor dashboard with completion rates, score distributions, and preliminary statistical analyses.
- **Multi-Tab Prevention**: Session-based controls preventing concurrent assessment access from multiple browser tabs.

---

## 2. System Architecture

### 2.1 Technology Stack

The platform is built on a modern web application stack optimized for reliability, security, and scalability:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | Server-side rendering, React components |
| Backend | Next.js API Routes | RESTful endpoints, authentication |
| Database | PostgreSQL 15 | Primary data storage |
| Connection Pooling | PgBouncer | Transaction-mode pooling (600 client / 100 server) |
| Caching | Redis + In-Memory LRU | Two-tier cache for question bank and analytics |
| Deployment | Docker + Dokploy | Container orchestration, rolling deployments |
| Reverse Proxy | Traefik | SSL termination, load balancing |

### 2.2 Infrastructure Overview

The production infrastructure is deployed on a virtual private server with the following topology:

```
Internet → Traefik (SSL/Proxy) → Next.js Standalone (Port 3000)
                                      ↓
                               PgBouncer (Port 6432)
                                      ↓
                               PostgreSQL 15 (Port 5432)
                                      ↓
                               Redis (Port 6379, optional L2 cache)
```

The platform runs as 2 replicas with 2GB RAM and 0.8 CPU each, designed to handle approximately 500 concurrent users. Rolling deployments ensure zero-downtime updates during the assessment window.

### 2.3 Security and FERPA Compliance Design

The platform implements a privacy-by-design approach consistent with FERPA requirements:

1. **No Raw Student IDs Stored**: Student identifiers are transformed using SHA-256 hashing: `hash = SHA256(course_pepper + student_id)`. The course pepper is a random salt unique to each course, stored separately from hashed keys.

2. **Separation of Identifiable Information**: Any identifiable information needed for course administration (e.g., verified email) is stored in a separate administrative table with restricted access, isolated from the research dataset.

3. **Research Dataset De-identification**: The dataset used for analysis contains only coded identifiers, assessment responses, baseline onboarding responses, and limited metadata necessary for analysis.

4. **Row-Level Security**: PostgreSQL row-level security (RLS) is enabled on all tables, with access control enforced at the application layer.

5. **Session-Based Authentication**: Students authenticate using course code and student ID. The platform does not collect or store passwords for student authentication.

### 2.4 Database Schema

The database consists of 14 tables organized into four functional groups:

**Core Assessment Tables**:
- `users` - Hashed student identifiers (SHA-256 keys)
- `courses` - Course metadata with per-course pepper (salt)
- `enrollments` - User-course associations with roles
- `instruments` - Assessment forms/versions (pre, post)
- `items` - Question bank with domain, difficulty, and scoring information
- `attempts` - Assessment attempt records with timestamps and metadata
- `responses` - Individual item responses with confidence ratings
- `scores` - Calculated domain and overall scores

**Baseline Covariates**:
- `student_profiles` - Demographic and socioeconomic data (B1-B13)

**Instructor Management**:
- `instructors` - Instructor accounts with PBKDF2-SHA512 password hashing
- `instructor_courses` - Instructor-course assignments
- `instructor_sessions` - Token-based session management

**System Tables**:
- `password_reset_tokens` - Secure token-based password recovery
- `plan_b_settings` - Fallback configuration (Google Forms)

### 2.5 Entity-Relationship Diagram

See `diagrams/database-erd.mmd` for the complete Mermaid diagram.

---

## 3. Assessment Instrument Design

### 3.1 Three Knowledge Domains

The 40-item anchor assessment measures financial literacy across three instructional domains. Twenty-six items are scored as correct/incorrect and used to compute learning gains.

#### 3.1.1 Borrowing and Credit (Q1-Q10, 10 items)

This domain assesses understanding of compound interest, borrowing mechanics, inflation, saving behavior, and credit fundamentals.

| Q# | Subcategory | Description |
|----|-------------|-------------|
| Q1 | Compound Interest | Savings account growth over 5 years |
| Q2 | Borrowing/Mortgages | 15-year vs. 30-year mortgage tradeoffs |
| Q3 | Inflation | Definition of high inflation |
| Q4 | Borrowing/Interest | Zero-interest short-term loan |
| Q5 | Saving | Emergency savings recommendations |
| Q6 | Inflation | Effects of successful inflation reduction |
| Q7 | Inflation | Groups most affected by high inflation |
| Q8 | Borrowing | Auto loan negotiation |
| Q9 | Earning | Primary advantage of budgeting |
| Q10 | Borrowing/Credit | Credit report accuracy |

#### 3.1.2 Risk Management (Q11-Q14, 4 items)

This domain assesses knowledge of diversification principles and insurance fundamentals.

| Q# | Subcategory | Description |
|----|-------------|-------------|
| Q11 | Risk Diversification | Single stock vs. mutual fund safety |
| Q12 | Insurance | Primary function of health insurance |
| Q13 | Insurance | Home insurance deductible definition |
| Q14 | Risk Diversification | Effect of asset spreading on risk |

#### 3.1.3 Investment and Risk (Q29-Q40, 12 items)

This domain assesses investing knowledge, probability reasoning, risk-return relationships, and crisis awareness.

| Q# | Subcategory | Description |
|----|-------------|-------------|
| Q29 | Investing | Interest rate and bond price relationship |
| Q30 | Investing | Risk-return correlation |
| Q31 | Investing | Stock market function |
| Q32 | Investing | Long-term asset returns |
| Q33 | Basic Probability | Percentage to frequency conversion |
| Q34 | Investment Risk | Diversification effect |
| Q35 | Investment Risk | Risk-return relationship |
| Q36 | Risk Management | Diversification principle |
| Q37 | Risk Management | Liability insurance |
| Q38 | Investment Risk | Inflation risk protection |
| Q39 | Investment Risk | Stock vs. bond risk |
| Q40 | Crisis/Systemic Risk | 2007-2008 financial crisis factors |

### 3.2 Preference Items (Q15-Q28)

Fourteen items assess financial attitudes, risk tolerance, and behavioral tendencies. These items are not scored as correct/incorrect and do not trigger SDM-10 follow-up. They serve as baseline covariates for heterogeneity analysis (RQ2).

Categories include: Allocation Preference (Q15), Loss Aversion (Q16), Risk Perception (Q17), Social Influence and Herding (Q18), Retirement Risk Planning (Q19), Emotional Response to Loss (Q20), Decision Process (Q21), Risk Confidence (Q22), Risk Attitude (Q23), Reaction to Underperformance (Q24), Definition of Success (Q25), Downside Awareness (Q26), Risk Preference in Income (Q27), and Scam Skepticism (Q28).

### 3.3 SDM-10 Adaptive Testing Module (Q41-Q50)

The Supplemental Diagnostic Module (SDM-10) is a fixed-length adaptive follow-up consisting of 10 items selected from a pre-written item bank based on students' anchor responses. The module serves a secondary diagnostic function, identifying specific misconceptions and verifying uncertain correct responses.

**Selection Algorithm**:
The SDM-10 uses an information deficit model that prioritizes follow-up items based on residual uncertainty after observing the anchor outcome. A Need score quantifies this deficit:

| Response Pattern | Need Score | Diagnostic Goal |
|------------------|------------|-----------------|
| Incorrect + High Confidence | 5 | Identify confident misconception |
| Correct + Low Confidence | 5 | Verify reasoning (possible guess) |
| Do Not Know | 4 | Test foundational knowledge |
| Incorrect + Mid Confidence | 3 | Clarify uncertain error |
| Incorrect + Low Confidence | 2 | Assess depth of knowledge gap |
| Correct + Mid Confidence (MCQ) | 1 | Parallel difficulty check |
| Correct + Mid Confidence (T/F) | 2 | Higher guess probability |
| Correct + High Confidence | 0 | Demonstrated mastery |

**Constraints**:
- Fixed 10 items after the 40 anchor questions
- At least 2 items per domain (domain balance)
- Maximum 2 items per subcategory
- Maximum 3 open-ended items
- Pre-written item bank only (no generated questions)

**Variant Types**:
Each anchor item has six pre-written variants:
- `Lower_TF`: True/False foundational check
- `Lower_MCQ`: Multiple-choice foundational check
- `Same_MCQ`: Parallel difficulty check
- `Higher_MCQ`: Transfer/application check
- `Open_Confirm`: Verification of uncertain correct response
- `Open_Diagnose`: Identification of confident misconception

### 3.4 Baseline Covariates (B1-B13)

Thirteen baseline items are collected during onboarding to support heterogeneity analysis:

**Demographic Characteristics (B1-B5)**:
- B1: Gender
- B2: Racial/ethnic background
- B3: Age range (20 or under, Above 20)
- B4: First language
- B5: Work experience

**Financial Background and Context (B6-B10)**:
- B6: Prior financial products used
- B7: Self-rated financial knowledge
- B8: Financial stress frequency
- B9: Highest parental education
- B10: First-generation college student status

**Student Loan Debt Status (B11-B13)**:
- B11: Current student loan debt
- B12: Student loan interest rate (conditional)
- B13: Student loan maturity (conditional)

---

## 4. Student Experience and Data Collection

### 4.1 Five-Step Onboarding Flow

Students access the assessment through a structured onboarding flow:

1. **Welcome Screen**: IRB-approved information and consent disclosure
2. **Course Entry**: Student enters course code and student ID
3. **Verification**: Platform generates hashed identifier and creates user record
4. **Baseline Questionnaire**: 13-item demographic and socioeconomic survey (B1-B13)
5. **Assessment Launch**: Student proceeds to anchor assessment

The onboarding flow is administered once during the pre-course assessment. Baseline items are not re-administered at post-course except where students may update selected variables (e.g., work status).

### 4.2 Assessment Execution Pipeline

The assessment follows a linear execution pipeline:

```
Onboarding (B1-B13) → Anchor Items (Q1-Q40) → SDM-10 Selection → SDM Items (Q41-Q50) → Submission → Scoring
```

**Item Presentation**:
- Items are presented one at a time with a confidence rating (1-3 scale)
- For "Do Not Know" responses, no confidence prompt is presented
- Progress indicator shows current item and total count

**Response Capture**:
- Selected answer option stored as JSONB
- Confidence rating stored as integer (1-3)
- Timestamp recorded for each response

### 4.3 Auto-Save and Session Management

The platform implements auto-save functionality to prevent data loss:

- **Incremental Save**: Each response is persisted to the database immediately upon submission
- **Resume Capability**: Students who leave the assessment can resume from their last saved position
- **Session Tokens**: UUID-based session tokens link browser sessions to database attempts

### 4.4 Multi-Tab Prevention System

To ensure assessment integrity, the platform prevents concurrent access from multiple browser tabs:

1. **Session Token Generation**: A unique UUID is assigned to each assessment attempt
2. **Token Validation**: Each API request validates the session token against the database record
3. **Conflict Detection**: If a second tab attempts to access the same attempt, it receives an error message
4. **Grace Period**: A brief grace period prevents false positives from network latency

### 4.5 Data Collection Summary (February 2-8, 2026)

The pre-course assessment window opened on February 2, 2026. The following table summarizes daily enrollment and completion statistics:

| Date | New Enrollments | Completed Assessments | Cumulative Enrollments | Cumulative Completed |
|------|-----------------|----------------------|------------------------|---------------------|
| Feb 2 | 98 | 87 | 98 | 87 |
| Feb 3 | 51 | 43 | 149 | 130 |
| Feb 4 | 47 | 40 | 196 | 170 |
| Feb 5 | 1 | 1 | 197 | 171 |

**Summary Statistics** (as of February 5, 2026):
- Total enrolled users: 197
- Total attempts: 186
- Submitted assessments: 171
- In-progress assessments: 15
- Completion rate: 92.0% (of attempts started)
- Average overall score: 65.73%

**Submission Patterns**:
Peak submission hours occur between 20:00-23:00 UTC (evening local time), with 54% of submissions occurring during this four-hour window. See `data/submission-timeline.csv` for hourly distribution.

---

## 5. Instructor Analytics Dashboard

The instructor analytics dashboard provides real-time visibility into student progress and preliminary analysis. Access is restricted to authenticated instructors with course-level permissions.

### 5.1 Performance Tab

The Performance tab displays aggregate completion and score statistics:

- **Completion Metrics**: Total enrolled, started, completed, and in-progress counts
- **Score Distribution**: Histogram of overall scores in 10-point bins
- **Time Analysis**: Average duration and distribution of completion times
- **Student Progress Table**: Individual student status with question counts

### 5.2 Baseline Covariates Tab

The Baseline Covariates tab summarizes demographic and socioeconomic distributions:

- **Demographic Breakdown**: Gender, race/ethnicity, age range distributions
- **Financial Background**: Prior product usage, self-rated knowledge, stress frequency
- **Socioeconomic Indicators**: Parental education, first-generation status, debt status

### 5.3 Risk Profiles Tab

The Risk Profiles tab analyzes responses to preference items (Q15-Q28):

- **Risk Attitude Distribution**: Categorization by risk tolerance levels
- **Loss Aversion Patterns**: Response distributions for loss scenarios
- **Decision Process Analysis**: Analytical vs. intuitive decision-making tendencies

### 5.4 Learning Gains Tab (RQ1)

The Learning Gains tab displays pre-post comparison metrics when post-course data is available:

- **Overall Gain**: Mean pre-post difference with 95% confidence interval
- **Effect Size**: Cohen's d with interpretation (negligible/small/medium/large)
- **Domain Gains**: Separate analysis for each knowledge domain
- **Paired t-Test**: Statistical significance of learning gains

### 5.5 Psychometrics Tab

The Psychometrics tab provides measurement quality indicators:

- **Cronbach's Alpha**: Internal consistency coefficient for each domain
- **Factor Loadings**: Exploratory Factor Analysis results with Varimax rotation
- **Cross-Loading Flags**: Items loading significantly on multiple factors
- **Variance Explained**: Cumulative variance captured by extracted factors

### 5.6 Heterogeneity Tab (RQ2)

The Heterogeneity tab displays Seemingly Unrelated Regressions (SUR) results:

- **Coefficient Table**: Regression coefficients for each covariate by domain
- **Significance Indicators**: Star notation for p < 0.05, p < 0.01, p < 0.001
- **R-Squared**: Variance explained per domain equation
- **Residual Correlations**: Cross-equation error correlations

---

## 6. Statistical Methodology

### 6.1 RQ1: Learning Gains Analysis

#### 6.1.1 Paired Pre/Post Design

Learning gains are computed at the student level as the difference between post-course and pre-course anchor scores. The design uses within-student comparisons to control for individual differences in baseline knowledge.

For each student i:
```
Gain_i = Post_i - Pre_i
```

The study reports mean gains, standard deviations, and 95% confidence intervals. Domain-level gains are computed identically using domain-specific percent-correct scores.

#### 6.1.2 Cohen's d Effect Size Calculation

The platform implements Cohen's d for paired samples:

```
d = M_diff / SD_diff

where:
  M_diff = mean of (Post - Pre) differences
  SD_diff = standard deviation of differences
```

**Interpretation thresholds**:
- |d| < 0.2: Negligible
- 0.2 ≤ |d| < 0.5: Small
- 0.5 ≤ |d| < 0.8: Medium
- |d| ≥ 0.8: Large

#### 6.1.3 95% Confidence Intervals

Confidence intervals for the mean difference are computed as:

```
CI = M_diff ± t_crit × SE

where:
  SE = SD_diff / √n
  t_crit = t-distribution critical value at α = 0.025 (two-tailed)
```

For sample sizes below 30, the platform uses t-distribution critical values. For larger samples, the normal approximation (1.96) is applied.

#### 6.1.4 Domain-Level Disaggregation

Learning gains are disaggregated by domain to identify where gains are concentrated or limited:

- Borrowing and Credit: 10 items (Q1-Q10)
- Risk Management: 4 items (Q11-Q14)
- Investment and Risk: 12 items (Q29-Q40)

Domain scores are computed as percent correct within each domain. The same effect size and confidence interval calculations are applied at the domain level.

### 6.2 Psychometric Validation

#### 6.2.1 Cronbach's Alpha Formula and Interpretation

Cronbach's alpha measures internal consistency within each domain:

```
α = (k / (k-1)) × (1 - Σσ_i² / σ_t²)

where:
  k = number of items in domain
  σ_i² = variance of item i
  σ_t² = variance of total domain score
```

**Interpretation thresholds**:
- α ≥ 0.9: Excellent
- 0.8 ≤ α < 0.9: Good
- 0.7 ≤ α < 0.8: Acceptable
- 0.6 ≤ α < 0.7: Questionable
- α < 0.6: Poor

#### 6.2.2 Exploratory Factor Analysis (EFA)

EFA is performed to verify that items load on intended latent factors. The platform implements:

1. **Correlation Matrix Computation**: Pearson correlations between all 26 knowledge items
2. **Factor Extraction**: Power iteration method to extract eigenvalues and eigenvectors
3. **Varimax Rotation**: Orthogonal rotation maximizing factor loading variance
4. **Loading Calculation**: `loading_ij = eigenvector_j[i] × √eigenvalue_j`

**Sample Size Recommendation**: EFA requires a minimum of 5-10 observations per item. For 26 items, the recommended minimum is 130-260 observations.

#### 6.2.3 Factor Loading Interpretation

Factor loadings indicate the correlation between each item and the underlying factor:

- Loadings ≥ 0.4: Item loads meaningfully on the factor
- Cross-loadings ≥ 0.4 on multiple factors: Item may measure multiple constructs
- Loadings < 0.3: Weak relationship with the factor

Items are flagged for review if they exhibit cross-loadings or fail to load on their intended domain factor.

#### 6.2.4 Overconfidence Index Measurement

##### Theoretical Background

Recent research demonstrates that overconfidence in financial literacy—a discrepancy between perceived and actual financial knowledge—can lead to suboptimal financial decisions. Overconfident individuals tend to engage in excessive risk-taking, overtrading, and panic selling during market downturns (Bawalle, 2025; de N. Porto, 2016). This phenomenon is particularly consequential because individuals who overestimate their financial competence may bypass financial advice, make impulsive borrowing decisions, or underestimate investment risks (Funcas, 2025).

A growing body of empirical evidence establishes the negative consequences of financial literacy overconfidence:

- **Panic Selling**: Bawalle (2025) found that overconfidence in financial literacy drives overreaction to negative market news, increasing divestment behavior even among knowledgeable investors. The combination of high perceived literacy and actual moderate literacy amplified panic selling during market downturns.

- **Risky Behavior in Vulnerable Populations**: Research on vulnerable populations identifies a "confidence gap" where individuals with high self-assessed ability but low objective literacy exhibit greater risk tolerance and poor borrowing choices (Funcas, 2025).

- **Reduced Decision Accuracy**: Multiple studies confirm that overconfidence reduces financial decision accuracy, with effects including underestimation of investment mistakes and excessive portfolio turnover (IJEBMR, 2025).

- **Advice Avoidance**: de N. Porto (2016) demonstrated that overconfident individuals are less likely to seek professional financial advice, potentially foregoing beneficial guidance.

These findings underscore the importance of measuring not only objective financial knowledge but also the calibration between confidence and competence.

##### Calculation Method

The platform computes an **overconfidence index** for each assessment attempt by comparing self-reported confidence ratings to actual correctness across all knowledge items:

```
Overconfidence_Index = (Mean_Confidence - Accuracy_Rate) × 100

where:
  Mean_Confidence = Average of confidence ratings (1-3, normalized to 0-1)
  Accuracy_Rate = Proportion of knowledge items answered correctly (0-1)
```

**Normalization**: Confidence ratings (1 = Low, 2 = Medium, 3 = High) are normalized to a 0-1 scale: `normalized = (rating - 1) / 2`

**Interpretation**:
- **Positive values**: Overconfidence (confidence exceeds performance)
- **Zero**: Well-calibrated (confidence matches performance)
- **Negative values**: Underconfidence (performance exceeds confidence)

The overconfidence index is stored in the `scores.overconfidence_index` column and is available for both descriptive analysis and as a covariate in heterogeneity models.

##### Analytic Applications

The overconfidence index supports several analytic objectives:

1. **Descriptive Statistics**: Distribution of overconfidence across the student population, identifying prevalence of miscalibration.

2. **SDM-10 Targeting**: High confidence combined with incorrect responses (Need Score = 5) triggers diagnostic follow-up items designed to identify confident misconceptions.

3. **Heterogeneity Predictor**: Overconfidence may be included as a covariate in RQ2 models to test whether miscalibration predicts differential learning gains.

4. **Pre-Post Comparison**: Changes in calibration from pre-course to post-course assessment indicate whether instruction improves not only knowledge but also metacognitive accuracy.

### 6.3 RQ2: Heterogeneity Analysis

#### 6.3.1 SUR Model Specification

Seemingly Unrelated Regressions (SUR) models learning gains as a function of baseline covariates, allowing correlated errors across domain equations:

```
Gain_BorrowingCredit = β₀₁ + β₁₁×Female + β₂₁×FirstGen + β₃₁×HighStress + ... + ε₁
Gain_RiskMgmt        = β₀₂ + β₁₂×Female + β₂₂×FirstGen + β₃₂×HighStress + ... + ε₂
Gain_InvestRisk      = β₀₃ + β₁₃×Female + β₂₃×FirstGen + β₃₃×HighStress + ... + ε₃

where Cov(ε_i, ε_j) ≠ 0
```

The platform implements feasible generalized least squares (FGLS) estimation:
1. OLS estimation for each equation
2. Residual covariance matrix estimation
3. GLS re-estimation using the inverse covariance matrix

#### 6.3.2 Covariate Effects Interpretation

Coefficients represent the expected change in learning gain (percentage points) associated with a one-unit change in the covariate, holding other covariates constant.

**Primary Covariates** (pre-specified):
- Gender (Female = 1)
- First-generation college student (Yes = 1)
- Financial stress frequency (ordinal, 1-5)
- Prior financial products (count, 0-5)
- Self-rated financial knowledge (ordinal, 1-5)

**Exploratory Covariates**:
- Age range
- Work experience
- Parental education
- Student loan debt status

#### 6.3.3 Cross-Equation Residual Correlations

The residual correlation matrix indicates whether unobserved factors affecting one domain also affect other domains. High correlations (> 0.5) suggest common omitted variables or shared measurement error.

```
Residual_Correlation[i,j] = Σ(ε_i × ε_j) / √(Σε_i² × Σε_j²)
```

---

## 7. Data Export and Research Integration

### 7.1 Export Formats

The platform supports data export in two formats:

- **CSV**: Flat file format for statistical software (R, Stata, SPSS)
- **JSON**: Structured format preserving nested data (JSONB columns)

Export includes: coded identifier, assessment responses, baseline covariates, calculated scores, and metadata.

### 7.2 Variable Codebook

See Appendix E (`appendices/baseline-covariates-codebook.md`) for the complete variable codebook including:

- Variable names and labels
- Data types and value ranges
- Missing value codes
- Derived variable calculations

### 7.3 Merging with External Datasets

The research dataset uses coded identifiers that can be linked to external administrative data through a secure crosswalk maintained separately from the research dataset. This crosswalk is accessible only to authorized instructional personnel for course-related purposes.

---

## 8. References

### Financial Literacy Measurement

- Lusardi, A., & Mitchell, O. S. (2014). The economic importance of financial literacy: Theory and evidence. *Journal of Economic Literature*, 52(1), 5-44.
- OECD/INFE. (2022). *OECD/INFE Toolkit for Measuring Financial Literacy and Financial Inclusion*.
- FINRA Investor Education Foundation. (2021). *National Financial Capability Study*.
- Cokely, E. T., et al. (2012). Measuring risk literacy: The Berlin Numeracy Test. *Judgment and Decision Making*, 7(1), 25-47.

### Overconfidence in Financial Literacy

- Bawalle, A. S. (2025). Overconfidence, financial literacy, and panic selling: Evidence from survey data. *PLOS ONE*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11927890/
- de N. Porto, N., & Xiao, J. J. (2016). Financial literacy overconfidence and financial advice usage. *Journal of Financial Service Professionals*, 70(4), 78-88. https://digitalcommons.uri.edu/hdf_facpubs/232/
- Funcas (2025). Too sure to be safe: Financial overconfidence and risky behavior in vulnerable populations. *Funcas Working Papers*. https://www.funcas.es/documentos_trabajo/too-sure-to-be-safe-financial-overconfidence-and-risky-behaviorin-vulnerable-populations/
- IJEBMR (2025). The effect of financial literacy, overconfidence, and fear on investment decision making. *International Journal of Economics and Business Management Research*. https://ijebmr.com/uploads/pdf/archivepdf/2025/IJEBMR_1522.pdf
- Allgood, S., & Walstad, W. B. (2016). The effects of perceived and actual financial literacy on financial behaviors. *Economic Inquiry*, 54(1), 675-697.
- Kramer, M. M. (2016). Financial literacy, confidence and financial advice seeking. *Journal of Economic Behavior & Organization*, 131, 198-217.

### Statistical Methods

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.). Lawrence Erlbaum Associates.
- Comrey, A. L., & Lee, H. B. (1992). *A First Course in Factor Analysis* (2nd ed.). Psychology Press.

---

*Document generated by Financial Literacy Assessment Platform*
*Last updated: February 5, 2026*

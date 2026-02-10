# Scoring and Analytics

## Overview

The Financial Literacy Assessment uses a pre-post design to measure learning gains. Primary outcomes are computed from 26 knowledge items; preference items serve as covariates for heterogeneity analysis.

## Item Classification

### Knowledge Items (26 items) - Scored
- **Q1-Q14**: Borrowing, Interest Rates, Numeracy + Risk Management Knowledge (14 items)
- **Q29-Q40**: Risk and Return Knowledge (12 items)

These items are scored as correct/incorrect and used to compute:
- Overall percent-correct score
- Domain-level percent-correct scores

### Preference Items (14 items) - Not Scored
- **Q15-Q28**: Financial attitudes, risk tolerance, behavioral tendencies

These items assess attitudes and serve as baseline covariates for heterogeneity analysis (RQ2). They do NOT contribute to learning gain calculations.

## Scoring Methodology

### MCQ and True/False Items
- Scored against answer key (0 = incorrect, 1 = correct)
- "Do Not Know" responses scored as incorrect

### Domain-Level Scores

| Domain | Items | Count |
|--------|-------|-------|
| Borrowing & Credit | Q1-Q10 | 10 |
| Risk Management | Q11-Q14 | 4 |
| Investment & Risk | Q29-Q40 | 12 |
| **Total Knowledge** | | **26** |

## Learning Gain Calculation (RQ1)

For each student:
```
Learning Gain = Post-course Score - Pre-course Score
```

Reported metrics:
- Mean gains with standard deviations
- 95% confidence intervals
- Paired t-tests (or nonparametric equivalent)
- Within-student Cohen's d effect size

## Heterogeneity Analysis (RQ2)

Models learning gains as a function of baseline covariates:
- Demographic indicators (B1-B5)
- Financial background (B6-B10)
- Student loan status (B11-B13)
- Preference items (Q15-Q28)

## Confidence Calibration

### Overconfidence Index
```
Overconfidence = z(confidence) - z(score) per domain
```

### Calibration Analysis
- Compare confidence ratings (1-3) to correctness
- Identify underconfidence/overconfidence patterns
- Generate calibration curves

## SDM-10 Diagnostic Scoring

The SDM-10 is **secondary diagnostic output** and does NOT contribute to primary learning gains.

### Open-ended Rubric Scoring
- **Full Credit (2)**: Demonstrates understanding of underlying mechanism
- **Partial Credit (1)**: Directionally correct but lacks specificity
- **No Credit (0)**: No explanation or incorrect reasoning

### Misconception Tagging
- Automated classification of common error patterns
- Low-confidence classifications flagged for human review
- Aggregated for prevalence analysis by domain

## Psychometric Analysis

### Exploratory Factor Analysis (EFA)
- Verify items load on intended latent factors
- Assess dimensionality within and across domains

### Internal Consistency
- Cronbach's alpha (α) within domains
- Cronbach's alpha for overall anchor assessment

### Item-Level Analysis
- Difficulty indices
- Missingness rates
- Response distributions
- Flag items for refinement in future administrations

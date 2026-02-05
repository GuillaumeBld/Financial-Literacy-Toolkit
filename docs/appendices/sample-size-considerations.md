# Appendix D: Sample Size Considerations

## Overview

This appendix documents sample size requirements and statistical power considerations for the analyses planned in RQ1 and RQ2.

---

## Current Sample Status

As of February 5, 2026 (pre-course assessment):

| Metric | Count |
|--------|-------|
| Total enrolled users | 197 |
| Completed pre-course assessments | 171 |
| Completion rate | 86.8% |

**Projected Post-Course Sample**: Assuming similar completion rates, approximately 145-165 students expected to complete both pre- and post-course assessments.

---

## RQ1: Learning Gains Analysis

### Paired t-Test Power

For detecting learning gains with a paired t-test:

| Effect Size (d) | Required n (α=0.05, power=0.80) | Required n (power=0.90) |
|-----------------|--------------------------------|-------------------------|
| 0.20 (small) | 199 | 265 |
| 0.30 | 90 | 120 |
| 0.40 | 51 | 68 |
| 0.50 (medium) | 34 | 44 |
| 0.80 (large) | 15 | 19 |

**Assessment**: With n ≈ 150-170 paired observations, the study is adequately powered to detect small-to-medium effects (d ≥ 0.25) at 80% power.

### Domain-Level Analysis

For domain-specific analyses, smaller item counts affect reliability:

| Domain | Items | Expected α | Minimum n for d=0.3 |
|--------|-------|-----------|---------------------|
| Borrowing & Credit | 10 | 0.70-0.80 | 90 |
| Risk Management | 4 | 0.60-0.70 | 120* |
| Investment & Risk | 12 | 0.75-0.85 | 90 |

*Lower reliability requires larger sample to detect equivalent true effects.

---

## RQ2: Heterogeneity Analysis

### Multiple Regression Power

For SUR/regression models with baseline covariates:

**Assumptions**:
- k = 8-10 predictors per equation
- R² = 0.10-0.20 for model
- α = 0.05, power = 0.80

| R² | Predictors | Required n |
|----|------------|-----------|
| 0.10 | 8 | 134 |
| 0.10 | 10 | 147 |
| 0.15 | 8 | 89 |
| 0.15 | 10 | 98 |
| 0.20 | 8 | 66 |
| 0.20 | 10 | 73 |

**Assessment**: With n ≈ 150-170, the study can detect medium effect sizes (f² ≥ 0.10) for the full model.

### Individual Coefficient Power

For testing individual predictors in a model with 10 predictors:

| Δ R² for single predictor | Required n |
|---------------------------|-----------|
| 0.02 (small) | 395 |
| 0.05 | 158 |
| 0.07 (medium) | 113 |
| 0.10 | 79 |

**Assessment**: The study is adequately powered to detect predictors explaining ≥ 5% unique variance.

---

## Psychometric Analysis

### Cronbach's Alpha Precision

Confidence interval width for Cronbach's alpha depends on n and number of items:

| n | Items | 95% CI Width (approx.) |
|---|-------|----------------------|
| 50 | 10 | ± 0.12 |
| 100 | 10 | ± 0.08 |
| 150 | 10 | ± 0.06 |
| 200 | 10 | ± 0.05 |

**Assessment**: With n ≈ 170, alpha estimates will have acceptable precision (± 0.06).

### Exploratory Factor Analysis

**Minimum Sample Size Guidelines**:

| Guideline | Minimum n |
|-----------|-----------|
| Absolute minimum | 100 |
| 3:1 observations per item | 78 (26 items) |
| 5:1 observations per item | 130 (26 items) |
| 10:1 observations per item | 260 (26 items) |
| Comrey & Lee (1992) "good" | 200 |

**Assessment**: With n ≈ 170, EFA meets the 5:1 criterion but falls short of the more conservative 10:1. Results should be interpreted with caution and validated in future cohorts.

### Factor Loading Precision

Standard error of factor loadings with n = 170:

| True Loading | SE (approx.) | 95% CI |
|--------------|--------------|--------|
| 0.40 | 0.07 | [0.26, 0.54] |
| 0.60 | 0.06 | [0.48, 0.72] |
| 0.80 | 0.05 | [0.70, 0.90] |

---

## Warnings Displayed in Analytics Dashboard

The platform displays sample size warnings based on the following thresholds:

### General Warnings

```
n < 10:  "Caution: Very small sample (n < 10). Results are highly unstable."
n < 30:  "Note: Sample size below 30. Confidence intervals may be wide."
```

### EFA-Specific Warning

```
n < 5 × items:  "EFA Warning: Recommended minimum is [5 × items]. Current: n"
```

For 26 items: n < 130 triggers the warning.

### Regression Warnings

```
n < 10 × predictors:  "Regression Warning: n/k ratio is [ratio]. Recommended minimum: 10."
```

---

## Recommendations

### For RQ1 (Learning Gains)

1. **Overall gains**: Adequately powered for small-to-medium effects
2. **Domain gains**: Report with appropriate caveats for Risk Management (4 items)
3. **Effect sizes**: Report Cohen's d with confidence intervals

### For RQ2 (Heterogeneity)

1. **Pre-specify primary predictors**: Limit to 5-6 key variables to preserve power
2. **Treat additional predictors as exploratory**: Report without multiple comparison adjustment
3. **Consider aggregating rare categories**: Combine low-frequency demographic groups
4. **Report partial eta-squared**: Quantify unique variance explained by each predictor

### For Psychometrics

1. **EFA**: Present as exploratory/preliminary validation
2. **Cronbach's alpha**: Report with confidence intervals
3. **Item-level statistics**: Flag items with extreme difficulty or low discrimination

---

## Multiple Comparisons

### RQ1 Domain Comparisons

Three domains tested:
- Apply Bonferroni adjustment: α = 0.05/3 = 0.017
- Or report unadjusted p-values with transparency

### RQ2 Predictor Tests

8-10 predictors across 3 domains:
- Pre-specify 2-3 primary hypotheses (e.g., first-generation, financial stress)
- Report remaining as exploratory
- Consider False Discovery Rate (FDR) correction for exploratory analyses

---

## References

- Cohen, J. (1988). *Statistical Power Analysis for the Behavioral Sciences* (2nd ed.).
- Comrey, A. L., & Lee, H. B. (1992). *A First Course in Factor Analysis* (2nd ed.).
- Faul, F., et al. (2007). G*Power 3: A flexible statistical power analysis program.

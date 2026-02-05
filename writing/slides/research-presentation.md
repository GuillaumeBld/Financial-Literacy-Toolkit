---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  h1 {
    color: #8B0015;
  }
  h2 {
    color: #8B0015;
  }
  .maroon {
    color: #8B0015;
  }
  .gold {
    color: #F1BE48;
  }
---

# Financial Literacy Assessment Platform
## Technical Documentation for Quinn 102

**Spring 2026**
Financial Literacy Toolkit Research Team

---

# Research Questions

## RQ1: Learning Gains
What is the magnitude of student learning in Quinn 102, overall and within the domains of:
- Borrowing and credit
- Investment
- Risk management

## RQ2: Heterogeneity
Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students?

---

# Platform Architecture

```
Internet → Traefik (SSL) → Next.js 14 (2 replicas)
                                ↓
                          PgBouncer (600/100)
                                ↓
                          PostgreSQL 15
```

**Key Features:**
- FERPA-compliant (SHA-256 hashed identifiers)
- Zero-downtime deployments
- Two-tier caching (L1 in-memory, L2 Redis)

---

# Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router) |
| Backend | Next.js API Routes |
| Database | PostgreSQL 15 |
| Caching | Redis + In-Memory LRU |
| Deployment | Docker + Dokploy |

---

# Assessment Instrument

## 40-Item Anchor Assessment

| Domain | Items | Scored |
|--------|-------|--------|
| Borrowing & Credit | Q1-Q10 | 10 |
| Risk Management | Q11-Q14 | 4 |
| Preference Items | Q15-Q28 | 0 |
| Investment & Risk | Q29-Q40 | 12 |
| **Total** | **40** | **26** |

Plus: 10-item SDM Adaptive Follow-up

---

# Assessment Flow

```
Onboarding (B1-B13)
       ↓
Anchor Items (Q1-Q40)
       ↓
SDM-10 Selection Algorithm
       ↓
Diagnostic Items (Q41-Q50)
       ↓
Scoring & Results
```

---

# Data Collection (Feb 2-5, 2026)

| Date | New Enrollments | Completed |
|------|-----------------|-----------|
| Feb 2 | 98 | 87 |
| Feb 3 | 51 | 43 |
| Feb 4 | 47 | 40 |
| Feb 5 | 1 | 1 |

**Totals:**
- 197 enrolled users
- 171 completed assessments
- 92% completion rate
- 65.73% average score

---

# Score Distribution

```
 20-29: ██ (1.75%)
 30-39: ██ (2.34%)
 40-49: ██ (2.34%)
 50-59: ████████ (15.20%)
 60-69: ████████████ (24.56%)
 70-79: ██████████████ (28.07%)
 80-89: ████████ (16.96%)
 90-99: ███ (7.02%)
   100: █ (1.75%)
```

Mean: 65.73% | Median: 68%

---

# Statistical Methodology: RQ1

## Learning Gains

**Cohen's d for Paired Samples:**
```
d = M_diff / SD_diff
```

**Interpretation:**
- d < 0.2: Negligible
- 0.2-0.5: Small
- 0.5-0.8: Medium
- d > 0.8: Large

95% CIs using t-distribution

---

# Statistical Methodology: RQ2

## Heterogeneity Analysis (SUR)

```
Gain_BC = β₀ + β₁×Female + β₂×FirstGen + ...
Gain_RM = β₀ + β₁×Female + β₂×FirstGen + ...
Gain_IR = β₀ + β₁×Female + β₂×FirstGen + ...
```

**Correlated errors across equations**

Primary Covariates:
- Gender, First-Generation Status
- Financial Stress, Prior Products
- Self-Rated Knowledge

---

# Psychometric Validation

## Cronbach's Alpha

```
α = (k/(k-1)) × (1 - Σσᵢ²/σₜ²)
```

**Interpretation:**
- α ≥ 0.9: Excellent
- 0.8-0.9: Good
- 0.7-0.8: Acceptable
- < 0.7: Questionable

## EFA with Varimax Rotation
- Verify 3-factor structure
- Flag cross-loading items

---

# Sample Size Considerations

| Analysis | Required n | Current n |
|----------|------------|-----------|
| Paired t-test (d=0.3) | 90 | 171 ✓ |
| EFA (5:1 ratio) | 130 | 171 ✓ |
| Regression (R²=0.10) | 134 | 171 ✓ |

**Power Assessment:** Adequately powered for small-to-medium effects

---

# Key Deliverables

1. **Technical Documentation** (~30 pages)
   - System architecture
   - Assessment design
   - Statistical methodology

2. **Data Files** (CSV)
   - Collection summary
   - Score distributions

3. **Diagrams** (Mermaid)
   - System architecture
   - Database ERD
   - Assessment flow

---

# Next Steps

- [ ] Post-course assessment (end of term)
- [ ] Learning gains calculation
- [ ] Heterogeneity analysis
- [ ] Factor structure validation
- [ ] Final research report

---

# Thank You

## Financial Literacy Assessment Platform

**Repository:** github.com/GuillaumeBld/Financial-Literacy-Toolkit

**Production:** financial-literacy.qualiaai.fr

---

<!-- Backup slide: References -->

# References

- Lusardi & Mitchell (2014). Economic importance of financial literacy
- OECD/INFE (2022). Financial Literacy Toolkit
- FINRA (2021). National Financial Capability Study
- Cohen (1988). Statistical Power Analysis

# Assessment Flow

This diagram shows the complete student journey through the Financial Literacy Assessment.

## Overview

Students progress through five phases:
1. **Onboarding** - Consent, authentication, baseline demographics
2. **Assessment** - 40 anchor items with confidence ratings
3. **SDM Selection** - Adaptive algorithm selects follow-up items
4. **Diagnostic** - 10 supplemental items based on response patterns
5. **Scoring** - Domain and overall score calculation

## Flow Diagram

```mermaid
flowchart TD
    subgraph Onboarding["Onboarding Phase"]
        A1["Welcome & Consent"] --> A2["Enter Course Code"]
        A2 --> A3["Enter Student ID"]
        A3 --> A4["Create Hashed Identifier"]
        A4 --> A5["Baseline Questionnaire<br/>(B1-B13)"]
    end

    subgraph Assessment["Assessment Phase"]
        B1["Anchor Items<br/>Q1-Q40"]
        B2["Confidence Rating<br/>(1-3 scale)"]
        B3["Auto-Save Response"]
    end

    subgraph SDM["SDM-10 Selection"]
        C1["Calculate Need Scores"]
        C2["Apply Constraints<br/>• Domain Balance (2/domain)<br/>• Subcategory Cap (2 max)<br/>• Open-Ended Cap (3 max)"]
        C3["Select Top 10 Items"]
    end

    subgraph Diagnostic["Diagnostic Phase"]
        D1["SDM Items<br/>Q41-Q50"]
        D2["Variant Types<br/>• Lower_TF/MCQ<br/>• Same_MCQ<br/>• Higher_MCQ<br/>• Open_Confirm<br/>• Open_Diagnose"]
    end

    subgraph Scoring["Scoring Phase"]
        E1["Submit Assessment"]
        E2["Calculate Domain Scores"]
        E3["Calculate Overall Score"]
        E4["Display Results"]
    end

    A5 --> B1
    B1 --> B2
    B2 --> B3
    B3 -->|"After Q40"| C1
    C1 --> C2
    C2 --> C3
    C3 --> D1
    D1 --> D2
    D2 --> E1
    E1 --> E2
    E2 --> E3
    E3 --> E4
```

## Phase Details

### 1. Onboarding Phase
- IRB-approved consent disclosure
- Course code + student ID authentication
- SHA-256 hashing of student identifier (FERPA compliant)
- 13-item baseline questionnaire (B1-B13)

### 2. Assessment Phase
- 40 anchor items presented one at a time
- Each item includes confidence rating (1-3 scale)
- Auto-save after each response
- Progress indicator shows current position

### 3. SDM-10 Selection
- Information deficit model calculates Need scores
- Domain balance constraint (minimum 2 per domain)
- Subcategory cap (maximum 2 per subcategory)
- Open-ended cap (maximum 3 items)

### 4. Diagnostic Phase
- 10 items selected from pre-written item bank
- Six variant types available per anchor item
- Targets uncertain correct answers and confident errors

### 5. Scoring Phase
- Domain scores calculated (Borrowing & Credit, Risk Management, Investment & Risk)
- Overall score aggregated from 26 knowledge items
- Overconfidence index computed from confidence vs. correctness

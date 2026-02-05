# SDM-10 Selection Algorithm

This diagram shows the Supplemental Diagnostic Module (SDM-10) item selection algorithm.

## Overview

The SDM-10 is a fixed-length adaptive follow-up consisting of 10 items selected based on students' anchor responses. The algorithm uses an **information deficit model** that prioritizes items where additional measurement would be most valuable.

## Selection Algorithm

```mermaid
flowchart TD
    Start["Start: After Q40 Submitted"] --> Compute["Compute Need Scores<br/>for All 26 Knowledge Items"]

    subgraph NeedScoring["Need Score Calculation"]
        N1["Incorrect + High Conf → Need 5"]
        N2["Correct + Low Conf → Need 5"]
        N3["Do Not Know → Need 4"]
        N4["Incorrect + Mid Conf → Need 3"]
        N5["Incorrect + Low Conf → Need 2"]
        N6["Correct + Mid Conf (T/F) → Need 2"]
        N7["Correct + Mid Conf (MCQ) → Need 1"]
        N8["Correct + High Conf → Need 0"]
    end

    Compute --> Sort["Sort Items by Need Score<br/>(descending)"]

    subgraph Phase1["Phase 1: Domain Minimum"]
        D1["Select 2 highest-Need items<br/>from Borrowing & Credit"]
        D2["Select 2 highest-Need items<br/>from Risk Management"]
        D3["Select 2 highest-Need items<br/>from Investment & Risk"]
    end

    Sort --> D1
    D1 --> D2
    D2 --> D3

    subgraph Phase2["Phase 2: Fill Remaining Slots"]
        F1["Iterate remaining items<br/>by Need score"]
        F2{"Subcategory<br/>cap (2) met?"}
        F3{"Open-ended<br/>cap (3) met?"}
        F4["Select item"]
        F5["Skip item"]
    end

    D3 --> F1
    F1 --> F2
    F2 -->|"Yes"| F5
    F2 -->|"No"| F3
    F3 -->|"Yes"| F5
    F3 -->|"No"| F4
    F4 --> Check{"10 items<br/>selected?"}
    F5 --> F1
    Check -->|"No"| F1
    Check -->|"Yes"| Done["Assign Variant Types"]
```

## Need Score Rules

| Response Pattern | Need Score | Diagnostic Goal |
|------------------|------------|-----------------|
| Incorrect + High Confidence | 5 | Identify confident misconception |
| Correct + Low Confidence | 5 | Verify reasoning (possible guess) |
| Do Not Know | 4 | Test foundational knowledge |
| Incorrect + Mid Confidence | 3 | Clarify uncertain error |
| Incorrect + Low Confidence | 2 | Assess depth of knowledge gap |
| Correct + Mid Confidence (T/F) | 2 | Higher guess probability |
| Correct + Mid Confidence (MCQ) | 1 | Parallel difficulty check |
| Correct + High Confidence | 0 | Demonstrated mastery |

## Constraints

| Constraint | Rule |
|------------|------|
| SDM Size | Fixed 10 items |
| Domain Balance | At least 2 items per domain |
| Subcategory Cap | Maximum 2 items per subcategory |
| Open-Ended Cap | Maximum 3 open-ended items |
| Item Source | Pre-written item bank only |

## Variant Types

| Variant | Format | Level | Use Case |
|---------|--------|-------|----------|
| `Lower_TF` | True/False | Foundational | Basic recognition |
| `Lower_MCQ` | Multiple Choice | Foundational | Simplified reasoning |
| `Same_MCQ` | Multiple Choice | Comparable | Parallel difficulty |
| `Higher_MCQ` | Multiple Choice | Applied | Transfer/multi-step |
| `Open_Confirm` | Short Answer | Same | Verify uncertain correct |
| `Open_Diagnose` | Short Answer | Same | Identify misconception |

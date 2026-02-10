# SDM-10 Selection Algorithm: Implementation Guide

This document provides code examples for each concept in the SDM-10 selection algorithm. Each section is self-contained and can be implemented independently, then integrated into the full system.

---

## Table of Contents

1. [Data Structures](#1-data-structures)
2. [Need Score Calculation](#2-need-score-calculation)
3. [Variant Type Assignment](#3-variant-type-assignment)
4. [Format Fallback Mechanism](#4-format-fallback-mechanism)
5. [Tiebreaker Hierarchy](#5-tiebreaker-hierarchy)
6. [Real-Time Pre-Calculation](#6-real-time-pre-calculation)
7. [Phase 1: Domain Minimum Enforcement](#7-phase-1-domain-minimum-enforcement)
8. [Phase 2: Need-Based Slot Filling](#8-phase-2-need-based-slot-filling)
9. [Phase 3: Fallback for Underfilled Slots](#9-phase-3-fallback-for-underfilled-slots)
10. [Presentation Order](#10-presentation-order)
11. [Validation](#11-validation)
12. [Loading Item Bank from CSV](#12-loading-item-bank-from-csv)
13. [Complete Integration Example](#13-complete-integration-example)

---

## 1. Data Structures

### 1.1 Configuration Constants

```python
# === CONFIGURATION ===

SDM_SIZE = 10           # Total items in SDM-10
DOMAIN_MINIMUM = 2      # Minimum items per domain
SUBCATEGORY_CAP = 2     # Maximum items per subcategory
OPEN_ENDED_CAP = 3      # Maximum open-ended items
RANDOM_SEED = 42        # For reproducible tiebreaking
```

### 1.2 Enumerations

```python
from enum import Enum

class AnchorFormat(Enum):
    """Anchor question format."""
    MCQ = "MCQ"     # Multiple choice (4 options)
    TF = "T/F"      # True/False (2 options)

class ResponseType(Enum):
    """Student response types."""
    CORRECT = "correct"
    INCORRECT = "incorrect"
    DO_NOT_KNOW = "do_not_know"

class ConfidenceLevel(Enum):
    """Confidence scale (1-3)."""
    LOW = 1
    MID = 2
    HIGH = 3

class VariantType(Enum):
    """SDM-10 variant types."""
    LOWER_TF = "Lower_TF"
    LOWER_MCQ = "Lower_MCQ"
    SAME_MCQ = "Same_MCQ"
    HIGHER_MCQ = "Higher_MCQ"
    OPEN_CONFIRM = "Open_Confirm"
    OPEN_DIAGNOSE = "Open_Diagnose"

class Domain(Enum):
    """Content domains."""
    BORROWING_CREDIT = "Borrowing & Credit"
    RISK_MANAGEMENT = "Risk Management"
    INVESTMENT_RISK = "Investment & Risk"
```

### 1.3 Anchor Metadata

```python
# T/F anchors (7 items with 50% guess rate)
TF_ANCHORS = {"Q2", "Q3", "Q11", "Q30", "Q35", "Q36", "Q39"}

def get_anchor_format(anchor_id: str) -> AnchorFormat:
    """Determine format based on anchor ID."""
    return AnchorFormat.TF if anchor_id in TF_ANCHORS else AnchorFormat.MCQ
```

---

## 2. Need Score Calculation

### 2.1 The Core Concept

The Need score quantifies **information deficit**: how much we DON'T know about the student's understanding based on their anchor response.

### 2.2 Format-Aware Need Score Table

| Response | Confidence | MCQ Need | T/F Need | Rationale |
|----------|------------|----------|----------|-----------|
| Incorrect | High (3) | 5 | 5 | Confident misconception |
| Correct | Low (1) | 5 | 5 | Possible guess |
| Do Not Know | N/A | 4 | 4 | No information |
| Incorrect | Mid (2) | 3 | 3 | Uncertain error |
| Correct | Mid (2) | **1** | **2** | T/F elevated (50% guess rate) |
| Incorrect | Low (1) | 2 | 2 | Acknowledged gap |
| Correct | High (3) | 0 | 0 | Demonstrated mastery |

### 2.3 Implementation

```python
def calculate_need_score(
    response_type: ResponseType,
    confidence: ConfidenceLevel | None,
    anchor_format: AnchorFormat
) -> int:
    """
    Calculate Need score based on response pattern and anchor format.
    
    KEY RULE: T/F Correct + Mid is elevated to Need=2 (not 1)
    because 50% guess rate makes mid-confidence less reliable.
    
    Args:
        response_type: CORRECT, INCORRECT, or DO_NOT_KNOW
        confidence: LOW, MID, HIGH, or None (for DO_NOT_KNOW)
        anchor_format: MCQ or TF
    
    Returns:
        Need score (0-5)
    """
    
    # DO NOT KNOW: Signal absent, no reasoning to elicit
    if response_type == ResponseType.DO_NOT_KNOW:
        return 4
    
    # INCORRECT responses
    if response_type == ResponseType.INCORRECT:
        if confidence == ConfidenceLevel.HIGH:
            return 5  # Confident misconception (signal conflict)
        elif confidence == ConfidenceLevel.MID:
            return 3  # Uncertain error (partial)
        else:  # LOW
            return 2  # Acknowledged gap (aligned)
    
    # CORRECT responses
    if response_type == ResponseType.CORRECT:
        if confidence == ConfidenceLevel.LOW:
            return 5  # Possible guess (signal conflict)
        elif confidence == ConfidenceLevel.MID:
            # FORMAT-AWARE: T/F gets elevated Need
            return 2 if anchor_format == AnchorFormat.TF else 1
        else:  # HIGH
            return 0  # Demonstrated mastery (aligned)
    
    raise ValueError(f"Invalid pattern: {response_type}, {confidence}")


# === TEST CASES ===

def test_need_score():
    # Signal conflict cases (Need = 5)
    assert calculate_need_score(ResponseType.INCORRECT, ConfidenceLevel.HIGH, AnchorFormat.MCQ) == 5
    assert calculate_need_score(ResponseType.CORRECT, ConfidenceLevel.LOW, AnchorFormat.TF) == 5
    
    # Format-aware case: T/F Correct + Mid elevated
    assert calculate_need_score(ResponseType.CORRECT, ConfidenceLevel.MID, AnchorFormat.MCQ) == 1
    assert calculate_need_score(ResponseType.CORRECT, ConfidenceLevel.MID, AnchorFormat.TF) == 2  # Elevated!
    
    # Do Not Know
    assert calculate_need_score(ResponseType.DO_NOT_KNOW, None, AnchorFormat.MCQ) == 4
    
    print("All Need score tests passed!")

test_need_score()
```

---

## 3. Variant Type Assignment

### 3.1 The Core Concept

Each Need score maps to a primary variant type that provides appropriate diagnostic follow-up.

### 3.2 Variant Mapping Table

| Need | Response Pattern | Primary Variant | Purpose |
|------|------------------|-----------------|---------|
| 5 | Incorrect + High | Open_Diagnose | Elicit reasoning to identify misconception |
| 5 | Correct + Low | Open_Confirm | Elicit reasoning to verify understanding |
| 4 | Do Not Know | Lower_MCQ | Test foundation (no reasoning to elicit) |
| 3 | Incorrect + Mid | Lower_MCQ | Test foundation, clarify error |
| 2 | Incorrect + Low | Lower_TF | Confirm basic recognition |
| 2 | T/F Correct + Mid | Lower_TF | Verify foundation (elevated from Need=1) |
| 1 | MCQ Correct + Mid | Same_MCQ | Parallel difficulty check |
| 0 | Correct + High | Higher_MCQ | Optional transfer/application |

### 3.3 Implementation

```python
def get_primary_variant(
    response_type: ResponseType,
    confidence: ConfidenceLevel | None,
    anchor_format: AnchorFormat,
    need_score: int
) -> VariantType:
    """
    Determine primary variant based on response pattern.
    
    Args:
        response_type: Student's response
        confidence: Confidence level
        anchor_format: MCQ or T/F
        need_score: Pre-calculated Need score
    
    Returns:
        Primary VariantType
    """
    
    # Need = 5: Two different variants based on pattern
    if need_score == 5:
        if response_type == ResponseType.INCORRECT:
            return VariantType.OPEN_DIAGNOSE  # Identify misconception
        else:  # CORRECT + LOW
            return VariantType.OPEN_CONFIRM   # Verify reasoning
    
    # Need = 4: Do Not Know
    if need_score == 4:
        return VariantType.LOWER_MCQ  # Test foundation
    
    # Need = 3: Incorrect + Mid
    if need_score == 3:
        return VariantType.LOWER_MCQ  # Clarify error
    
    # Need = 2: Incorrect + Low OR T/F Correct + Mid
    if need_score == 2:
        return VariantType.LOWER_TF   # Basic recognition
    
    # Need = 1: MCQ Correct + Mid
    if need_score == 1:
        return VariantType.SAME_MCQ   # Parallel check
    
    # Need = 0: Correct + High
    if need_score == 0:
        return VariantType.HIGHER_MCQ # Transfer/application
    
    raise ValueError(f"Invalid need_score: {need_score}")


def is_open_ended(variant: VariantType) -> bool:
    """Check if variant requires free-text response."""
    return variant in {VariantType.OPEN_DIAGNOSE, VariantType.OPEN_CONFIRM}


# === TEST CASES ===

def test_variant_assignment():
    # Open-ended variants for Need = 5
    assert get_primary_variant(ResponseType.INCORRECT, ConfidenceLevel.HIGH, AnchorFormat.MCQ, 5) == VariantType.OPEN_DIAGNOSE
    assert get_primary_variant(ResponseType.CORRECT, ConfidenceLevel.LOW, AnchorFormat.TF, 5) == VariantType.OPEN_CONFIRM
    
    # Closed variants for lower Need
    assert get_primary_variant(ResponseType.DO_NOT_KNOW, None, AnchorFormat.MCQ, 4) == VariantType.LOWER_MCQ
    assert get_primary_variant(ResponseType.INCORRECT, ConfidenceLevel.LOW, AnchorFormat.MCQ, 2) == VariantType.LOWER_TF
    
    print("All variant assignment tests passed!")

test_variant_assignment()
```

---

## 4. Format Fallback Mechanism

### 4.1 The Core Concept

When the open-ended cap (3) is reached, Need=5 items receive closed-format fallbacks instead of being dropped.

### 4.2 Fallback Table

| Primary Variant | Fallback Variant | Rationale |
|-----------------|------------------|-----------|
| Open_Diagnose | Lower_MCQ | Test foundation if reasoning unavailable |
| Open_Confirm | Same_MCQ | Parallel check if verification unavailable |

### 4.3 Implementation

```python
# Fallback mapping
FALLBACK_VARIANTS = {
    VariantType.OPEN_DIAGNOSE: VariantType.LOWER_MCQ,
    VariantType.OPEN_CONFIRM: VariantType.SAME_MCQ,
}


def apply_fallback_if_needed(
    primary_variant: VariantType,
    current_open_ended_count: int,
    open_ended_cap: int = 3
) -> tuple[VariantType, bool]:
    """
    Apply fallback variant if open-ended cap is reached.
    
    Args:
        primary_variant: The ideal variant
        current_open_ended_count: How many open-ended already assigned
        open_ended_cap: Maximum allowed (default: 3)
    
    Returns:
        Tuple of (assigned_variant, is_open_ended)
    """
    
    # Check if primary is open-ended
    if primary_variant not in FALLBACK_VARIANTS:
        return primary_variant, False  # Not open-ended, no fallback needed
    
    # Check if cap allows another
    if current_open_ended_count < open_ended_cap:
        return primary_variant, True   # Use primary, counts as open-ended
    
    # Cap reached, apply fallback
    fallback = FALLBACK_VARIANTS[primary_variant]
    return fallback, False  # Use fallback, not open-ended


# === TEST CASES ===

def test_fallback():
    # Cap not reached
    variant, is_open = apply_fallback_if_needed(VariantType.OPEN_DIAGNOSE, 2)
    assert variant == VariantType.OPEN_DIAGNOSE
    assert is_open == True
    
    # Cap reached - fallback applied
    variant, is_open = apply_fallback_if_needed(VariantType.OPEN_DIAGNOSE, 3)
    assert variant == VariantType.LOWER_MCQ  # Fallback!
    assert is_open == False
    
    # Non-open-ended - no change
    variant, is_open = apply_fallback_if_needed(VariantType.LOWER_MCQ, 3)
    assert variant == VariantType.LOWER_MCQ
    assert is_open == False
    
    print("All fallback tests passed!")

test_fallback()
```

---

## 5. Tiebreaker Hierarchy

### 5.1 The Core Concept

When multiple items have the same Need score, apply tiebreakers in order to ensure deterministic selection.

### 5.2 Tiebreaker Order

| Priority | Criterion | Description |
|----------|-----------|-------------|
| 1 | Domain deficit | Favor domains below minimum (2) |
| 2 | Format priority | T/F before MCQ (higher info deficit) |
| 3 | Subcategory spread | Favor subcategories with 0 items selected |
| 4 | Domain order | B&C → RM → I&R |
| 5 | Seeded random | Reproducible randomness |

### 5.3 Implementation

```python
import random

DOMAIN_ORDER = [Domain.BORROWING_CREDIT, Domain.RISK_MANAGEMENT, Domain.INVESTMENT_RISK]


def create_sort_key(
    item,  # ScoredAnchor
    domain_counts: dict,
    subcategory_counts: dict,
    random_values: dict,
    domain_minimum: int = 2
) -> tuple:
    """
    Create a sorting key for priority ordering.
    
    Lower values = higher priority (for ascending sort).
    
    Returns:
        Tuple for sorting
    """
    
    # 1. Domain deficit: 0 if below minimum (priority), 1 if at/above
    domain_count = domain_counts.get(item.domain, 0)
    domain_deficit = 0 if domain_count < domain_minimum else 1
    
    # 2. Format priority: 0 for T/F, 1 for MCQ
    format_priority = 0 if item.anchor_format == AnchorFormat.TF else 1
    
    # 3. Subcategory spread: lower count = higher priority
    subcategory_count = subcategory_counts.get(item.subcategory, 0)
    
    # 4. Domain order: index in list
    domain_order = DOMAIN_ORDER.index(item.domain)
    
    # 5. Seeded random: pre-generated for reproducibility
    random_value = random_values.get(item.anchor_id, 0.5)
    
    return (
        -item.need_score,    # Higher Need first (negative for ascending sort)
        domain_deficit,
        format_priority,
        subcategory_count,
        domain_order,
        random_value
    )


def generate_random_values(anchor_ids: list, seed: int = 42) -> dict:
    """Generate reproducible random values for tiebreaking."""
    rng = random.Random(seed)
    return {aid: rng.random() for aid in anchor_ids}


def sort_candidates(items, domain_counts, subcategory_counts, random_values):
    """Sort candidates by Need score + tiebreakers."""
    return sorted(
        items,
        key=lambda x: create_sort_key(x, domain_counts, subcategory_counts, random_values)
    )
```

---

## 6. Real-Time Pre-Calculation

### 6.1 The Core Concept

Calculate Need scores incrementally as students answer each anchor (Q1-Q40), so selection executes instantly after Q40.

### 6.2 Implementation

```python
class RealTimeCalculator:
    """
    Maintains running state for instant SDM-10 selection.
    
    Usage:
        calculator = RealTimeCalculator()
        
        # As each anchor is answered:
        calculator.process_response("Q1", ResponseType.CORRECT, ConfidenceLevel.HIGH)
        calculator.process_response("Q2", ResponseType.INCORRECT, ConfidenceLevel.MID)
        ...
        
        # After Q40, selection is already pre-calculated:
        candidates = calculator.get_sorted_candidates()
    """
    
    def __init__(self, anchor_metadata: dict):
        """
        Args:
            anchor_metadata: Dict mapping anchor_id to {format, domain, subcategory}
        """
        self.metadata = anchor_metadata
        self.scored_anchors = {}
        self.random_values = generate_random_values(list(anchor_metadata.keys()))
    
    def process_response(
        self,
        anchor_id: str,
        response_type: ResponseType,
        confidence: ConfidenceLevel | None
    ):
        """
        Process a single response immediately after submission.
        
        Time complexity: O(log n) for sorted insertion
        """
        meta = self.metadata[anchor_id]
        
        # Calculate Need score
        need = calculate_need_score(
            response_type,
            confidence,
            meta['format']
        )
        
        # Get primary variant
        variant = get_primary_variant(
            response_type,
            confidence,
            meta['format'],
            need
        )
        
        # Store scored anchor
        self.scored_anchors[anchor_id] = {
            'anchor_id': anchor_id,
            'need_score': need,
            'primary_variant': variant,
            'domain': meta['domain'],
            'subcategory': meta['subcategory'],
            'anchor_format': meta['format'],
        }
    
    def get_sorted_candidates(self):
        """Get all candidates sorted by priority."""
        items = list(self.scored_anchors.values())
        domain_counts = {d: 0 for d in Domain}
        subcategory_counts = {}
        
        return sort_candidates(items, domain_counts, subcategory_counts, self.random_values)
```

---

## 7. Phase 1: Domain Minimum Enforcement

### 7.1 The Core Concept

Ensure each domain has at least 2 items before filling remaining slots.

### 7.2 Implementation

```python
def phase1_select_domain_minimums(
    sorted_candidates: list,
    domain_minimum: int = 2,
    subcategory_cap: int = 2,
    open_ended_cap: int = 3
) -> tuple[list, dict, dict, int]:
    """
    Phase 1: Select 2 items per domain.
    
    Args:
        sorted_candidates: Pre-sorted by Need + tiebreakers
        
    Returns:
        (selected_items, domain_counts, subcategory_counts, open_ended_count)
    """
    
    selected = []
    selected_ids = set()
    domain_counts = {d: 0 for d in Domain}
    subcategory_counts = {}
    open_ended_count = 0
    
    for domain in Domain:
        items_needed = domain_minimum
        
        # Get candidates from this domain
        domain_candidates = [
            c for c in sorted_candidates
            if c['domain'] == domain and c['anchor_id'] not in selected_ids
        ]
        
        for candidate in domain_candidates:
            if items_needed <= 0:
                break
            
            # Check subcategory cap
            subcat = candidate['subcategory']
            if subcategory_counts.get(subcat, 0) >= subcategory_cap:
                continue
            
            # Apply fallback if needed
            assigned, is_open = apply_fallback_if_needed(
                candidate['primary_variant'],
                open_ended_count,
                open_ended_cap
            )
            
            # Update candidate
            candidate['assigned_variant'] = assigned
            candidate['is_open_ended'] = is_open
            
            # Select it
            selected.append(candidate)
            selected_ids.add(candidate['anchor_id'])
            domain_counts[domain] += 1
            subcategory_counts[subcat] = subcategory_counts.get(subcat, 0) + 1
            if is_open:
                open_ended_count += 1
            
            items_needed -= 1
    
    return selected, domain_counts, subcategory_counts, open_ended_count
```

---

## 8. Phase 2: Need-Based Slot Filling

### 8.1 The Core Concept

Fill remaining slots (typically 4) by Need priority, respecting constraints.

### 8.2 Implementation

```python
def phase2_fill_remaining_slots(
    sorted_candidates: list,
    already_selected: list,
    domain_counts: dict,
    subcategory_counts: dict,
    open_ended_count: int,
    target_size: int = 10,
    subcategory_cap: int = 2,
    open_ended_cap: int = 3
) -> tuple[list, dict, int]:
    """
    Phase 2: Fill remaining slots by Need priority.
    
    Returns:
        (all_selected, updated_subcategory_counts, updated_open_ended_count)
    """
    
    selected = already_selected.copy()
    selected_ids = {item['anchor_id'] for item in selected}
    subcategory_counts = subcategory_counts.copy()
    
    slots_remaining = target_size - len(selected)
    
    for candidate in sorted_candidates:
        if slots_remaining <= 0:
            break
        
        # Skip already selected
        if candidate['anchor_id'] in selected_ids:
            continue
        
        # Check subcategory cap
        subcat = candidate['subcategory']
        if subcategory_counts.get(subcat, 0) >= subcategory_cap:
            continue
        
        # Apply fallback
        assigned, is_open = apply_fallback_if_needed(
            candidate['primary_variant'],
            open_ended_count,
            open_ended_cap
        )
        
        candidate['assigned_variant'] = assigned
        candidate['is_open_ended'] = is_open
        
        # Select
        selected.append(candidate)
        selected_ids.add(candidate['anchor_id'])
        subcategory_counts[subcat] = subcategory_counts.get(subcat, 0) + 1
        if is_open:
            open_ended_count += 1
        
        slots_remaining -= 1
    
    return selected, subcategory_counts, open_ended_count
```

---

## 9. Phase 3: Fallback for Underfilled Slots

### 9.1 The Core Concept

In rare cases where constraints prevent reaching 10 items, use Need=0 (mastery) items.

### 9.2 Implementation

```python
def phase3_fill_with_mastery(
    all_candidates: list,
    already_selected: list,
    subcategory_counts: dict,
    target_size: int = 10,
    subcategory_cap: int = 2,
    seed: int = 42
) -> list:
    """
    Phase 3: Fill remaining slots with shuffled Need=0 items.
    
    This phase rarely activates.
    """
    
    selected = already_selected.copy()
    selected_ids = {item['anchor_id'] for item in selected}
    subcategory_counts = subcategory_counts.copy()
    
    slots_remaining = target_size - len(selected)
    
    if slots_remaining <= 0:
        return selected
    
    # Get Need=0 items not yet selected
    mastery = [c for c in all_candidates 
               if c['need_score'] == 0 and c['anchor_id'] not in selected_ids]
    
    # Shuffle for variety
    rng = random.Random(seed)
    rng.shuffle(mastery)
    
    for candidate in mastery:
        if slots_remaining <= 0:
            break
        
        subcat = candidate['subcategory']
        if subcategory_counts.get(subcat, 0) >= subcategory_cap:
            continue
        
        candidate['assigned_variant'] = candidate['primary_variant']
        candidate['is_open_ended'] = False
        
        selected.append(candidate)
        subcategory_counts[subcat] = subcategory_counts.get(subcat, 0) + 1
        slots_remaining -= 1
    
    return selected
```

---

## 10. Presentation Order

### 10.1 The Core Concept

Reorder selected items for optimal student experience.

### 10.2 Presentation Order Table

| Order | Variant Type | Rationale |
|-------|--------------|-----------|
| 1 | Open_Diagnose | Address confident misconceptions first (full attention) |
| 2 | Lower_MCQ | Foundational checks |
| 3 | Lower_TF | Basic recognition |
| 4 | Same_MCQ | Parallel difficulty |
| 5 | Higher_MCQ | Transfer/application |
| 6 | Open_Confirm | Verification last (after reflection) |

### 10.3 Implementation

```python
VARIANT_PRESENTATION_ORDER = {
    VariantType.OPEN_DIAGNOSE: 0,
    VariantType.LOWER_MCQ: 1,
    VariantType.LOWER_TF: 2,
    VariantType.SAME_MCQ: 3,
    VariantType.HIGHER_MCQ: 4,
    VariantType.OPEN_CONFIRM: 5,
}


def order_for_presentation(selected_items: list) -> list:
    """
    Reorder items for presentation to student.
    
    Within each variant type, items are ordered by:
    1. Need score (descending)
    2. Anchor ID (for stability)
    """
    
    def sort_key(item):
        variant_order = VARIANT_PRESENTATION_ORDER.get(
            item['assigned_variant'], 
            99
        )
        return (
            variant_order,
            -item['need_score'],  # Higher Need first within group
            item['anchor_id']
        )
    
    return sorted(selected_items, key=sort_key)
```

---

## 11. Validation

### 11.1 The Core Concept

After selection, verify all constraints are satisfied.

### 11.2 Implementation

```python
def validate_selection(selected_items: list) -> dict:
    """
    Validate SDM-10 selection against all constraints.
    
    Returns:
        {
            'is_valid': bool,
            'errors': list of error strings,
            'summary': {
                'total_items': int,
                'domain_counts': dict,
                'open_ended_count': int,
                'variant_distribution': dict
            }
        }
    """
    
    errors = []
    
    # Count domains
    domain_counts = {d: 0 for d in Domain}
    for item in selected_items:
        domain_counts[item['domain']] += 1
    
    # Count subcategories
    subcategory_counts = {}
    for item in selected_items:
        subcat = item['subcategory']
        subcategory_counts[subcat] = subcategory_counts.get(subcat, 0) + 1
    
    # Count open-ended
    open_ended_count = sum(1 for item in selected_items if item.get('is_open_ended', False))
    
    # Count variants
    variant_counts = {}
    for item in selected_items:
        v = item['assigned_variant'].value if hasattr(item['assigned_variant'], 'value') else item['assigned_variant']
        variant_counts[v] = variant_counts.get(v, 0) + 1
    
    # === VALIDATION CHECKS ===
    
    # 1. Size check
    if len(selected_items) != 10:
        errors.append(f"Size is {len(selected_items)}, expected 10")
    
    # 2. Domain minimum
    for domain in Domain:
        if domain_counts.get(domain, 0) < 2:
            errors.append(f"Domain '{domain.value}' has {domain_counts.get(domain, 0)} items, minimum is 2")
    
    # 3. Subcategory cap
    for subcat, count in subcategory_counts.items():
        if count > 2:
            errors.append(f"Subcategory '{subcat}' has {count} items, cap is 2")
    
    # 4. Open-ended cap
    if open_ended_count > 3:
        errors.append(f"Open-ended count is {open_ended_count}, cap is 3")
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors,
        'summary': {
            'total_items': len(selected_items),
            'domain_counts': {d.value: c for d, c in domain_counts.items()},
            'open_ended_count': open_ended_count,
            'variant_distribution': variant_counts
        }
    }
```

---

## 12. Loading Item Bank from CSV

### 12.1 CSV Structure

The item bank uses "#" suffix to distinguish anchors from variants:
- `Q1#` = Anchor row
- `Q1` = Variant row (linked to Q1 anchor)

### 12.2 Implementation

```python
import csv

def load_item_bank(csv_path: str) -> dict:
    """
    Load SDM-10 item bank from CSV.
    
    Returns:
        {
            'anchors': {anchor_id: anchor_data},
            'variants': {anchor_id: {variant_type: variant_data}}
        }
    """
    
    anchors = {}
    variants = {}
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            raw_id = row['Anchor_ID']
            
            # Detect anchor vs variant by "#" suffix
            is_anchor = raw_id.endswith('#')
            anchor_id = raw_id.rstrip('#')
            
            if is_anchor:
                # Parse anchor
                anchors[anchor_id] = {
                    'anchor_id': anchor_id,
                    'domain': row['Domain'],
                    'subcategory': row['Subcategory'],
                    'format': AnchorFormat.TF if row['Anchor_Format'] == 'T/F' else AnchorFormat.MCQ,
                    'question_text': row['Question_Text'],
                    'correct_answer': row['Correct_Answer'],
                }
            else:
                # Parse variant
                if anchor_id not in variants:
                    variants[anchor_id] = {}
                
                variant_type = row['Variant_Type']
                variants[anchor_id][variant_type] = {
                    'variant_id': row['Variant_ID'],
                    'question_text': row['Question_Text'],
                    'options': {
                        'A': row.get('Option_A', ''),
                        'B': row.get('Option_B', ''),
                        'C': row.get('Option_C', ''),
                        'D': row.get('Option_D', ''),
                    },
                    'correct_answer': row.get('Correct_Answer', ''),
                    'rubric_accept': row.get('Rubric_Accept', ''),
                    'rubric_partial': row.get('Rubric_Partial', ''),
                    'rubric_reject': row.get('Rubric_Reject', ''),
                    'misconception_tags': row.get('Misconception_Tags', ''),
                }
    
    return {'anchors': anchors, 'variants': variants}


def get_variant_question(item_bank: dict, anchor_id: str, variant_type: str) -> dict:
    """Retrieve specific variant for an anchor."""
    return item_bank['variants'][anchor_id][variant_type]
```

---

## 13. Complete Integration Example

### 13.1 Full Pipeline

```python
def select_sdm10(responses: list[dict]) -> dict:
    """
    Complete SDM-10 selection pipeline.
    
    Args:
        responses: List of {anchor_id, response_type, confidence}
    
    Returns:
        {
            'selected_items': list (presentation ordered),
            'validation': validation result
        }
    """
    
    # Step 1: Score all responses
    scored = []
    for r in responses:
        anchor_format = get_anchor_format(r['anchor_id'])
        need = calculate_need_score(r['response_type'], r['confidence'], anchor_format)
        variant = get_primary_variant(r['response_type'], r['confidence'], anchor_format, need)
        
        scored.append({
            'anchor_id': r['anchor_id'],
            'need_score': need,
            'primary_variant': variant,
            'domain': ANCHOR_DOMAIN[r['anchor_id']],
            'subcategory': ANCHOR_SUBCATEGORY[r['anchor_id']],
            'anchor_format': anchor_format,
        })
    
    # Step 2: Generate random values for tiebreaking
    random_values = generate_random_values([s['anchor_id'] for s in scored])
    
    # Step 3: Sort by priority
    domain_counts = {d: 0 for d in Domain}
    subcategory_counts = {}
    sorted_candidates = sort_candidates(scored, domain_counts, subcategory_counts, random_values)
    
    # Step 4: Phase 1 - Domain minimums
    selected, domain_counts, subcategory_counts, open_ended_count = phase1_select_domain_minimums(
        sorted_candidates
    )
    
    # Step 5: Re-sort with updated counts
    sorted_candidates = sort_candidates(scored, domain_counts, subcategory_counts, random_values)
    
    # Step 6: Phase 2 - Fill remaining slots
    selected, subcategory_counts, open_ended_count = phase2_fill_remaining_slots(
        sorted_candidates,
        selected,
        domain_counts,
        subcategory_counts,
        open_ended_count
    )
    
    # Step 7: Phase 3 - Fallback (if needed)
    if len(selected) < 10:
        selected = phase3_fill_with_mastery(
            scored,
            selected,
            subcategory_counts
        )
    
    # Step 8: Presentation order
    ordered = order_for_presentation(selected)
    
    # Step 9: Validate
    validation = validate_selection(ordered)
    
    return {
        'selected_items': ordered,
        'validation': validation
    }


# === USAGE EXAMPLE ===

if __name__ == "__main__":
    # Simulate 26 anchor responses
    import random as rng
    rng.seed(123)
    
    responses = []
    for anchor_id in ANCHOR_FORMAT.keys():
        resp_type = rng.choice([ResponseType.CORRECT, ResponseType.INCORRECT, ResponseType.DO_NOT_KNOW])
        conf = None if resp_type == ResponseType.DO_NOT_KNOW else rng.choice(list(ConfidenceLevel))
        responses.append({
            'anchor_id': anchor_id,
            'response_type': resp_type,
            'confidence': conf
        })
    
    # Run selection
    result = select_sdm10(responses)
    
    # Print results
    print("SELECTED ITEMS (Presentation Order):")
    print("-" * 60)
    for i, item in enumerate(result['selected_items'], 1):
        print(f"{i:2}. {item['anchor_id']:4} | Need={item['need_score']} | "
              f"{item['assigned_variant'].value:15} | {item['domain'].value}")
    
    print("\nVALIDATION:")
    print(f"  Valid: {result['validation']['is_valid']}")
    print(f"  Summary: {result['validation']['summary']}")
    if result['validation']['errors']:
        print(f"  Errors: {result['validation']['errors']}")
```

---

## Quick Reference Card

### Need Score Calculation
```python
# DO NOT KNOW → 4
# INCORRECT + HIGH → 5
# INCORRECT + MID → 3
# INCORRECT + LOW → 2
# CORRECT + LOW → 5
# CORRECT + MID → 1 (MCQ) or 2 (T/F)  ← FORMAT MATTERS
# CORRECT + HIGH → 0
```

### Variant Assignment
```python
# Need 5, Incorrect → Open_Diagnose
# Need 5, Correct → Open_Confirm
# Need 4 → Lower_MCQ
# Need 3 → Lower_MCQ
# Need 2 → Lower_TF
# Need 1 → Same_MCQ
# Need 0 → Higher_MCQ
```

### Fallback (when open-ended cap reached)
```python
# Open_Diagnose → Lower_MCQ
# Open_Confirm → Same_MCQ
```

### Tiebreaker Order
```
1. Domain deficit (below minimum first)
2. Format priority (T/F before MCQ)
3. Subcategory spread (0 items before 1)
4. Domain order (B&C → RM → I&R)
5. Seeded random
```

### Constraints
```
- SDM size: 10 items
- Domain minimum: 2 per domain
- Subcategory cap: 2 per subcategory
- Open-ended cap: 3 items
```

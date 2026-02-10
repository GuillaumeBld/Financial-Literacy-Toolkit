#!/usr/bin/env python3
"""
Reproducible verification script for Bolivard QUIN 102 Paper 1.
Reads authoritative CSV exports and recomputes every descriptive statistic
reported in the manuscript.

Usage:
    python3 verify_paper_tables.py

Inputs (same directory):
    - consented_responses_354.csv   (17,500 rows × 14 cols)
    - diagnose_by_item.csv          (AI diagnosis classifications)
    - confirm_by_item.csv           (AI understanding-level classifications)

Author: Automated verification — generated 2026-02-10
"""

import csv
import os
import sys
from collections import Counter, defaultdict
from statistics import mean, median, stdev

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Helpers ───────────────────────────────────────────────────────────────────

def load_csv(filename):
    path = os.path.join(SCRIPT_DIR, filename)
    with open(path, newline="") as f:
        return list(csv.DictReader(f))

def pct(n, total, decimals=1):
    return round(100 * n / total, decimals) if total else 0.0

def banner(title):
    print(f"\n{'=' * 70}")
    print(f"  {title}")
    print(f"{'=' * 70}")

def check(label, expected, actual, tol=0.15):
    """Compare expected vs actual; flag if they differ beyond tolerance."""
    match = abs(expected - actual) <= tol
    status = "PASS" if match else "FAIL"
    print(f"  [{status}] {label}: expected={expected}, computed={actual}")
    return match

# ─── Load data ─────────────────────────────────────────────────────────────────

rows = load_csv("consented_responses_354.csv")
diagnose_rows = load_csv("diagnose_by_item.csv")
confirm_rows = load_csv("confirm_by_item.csv")

# ─── Table 4.1: Sample size ───────────────────────────────────────────────────

banner("Table 4.1 / Sample — Unique consented students")

attempt_ids = set(r["attempt_id"] for r in rows)
n_students = len(attempt_ids)
print(f"  N = {n_students}")
check("Consented sample size", 354, n_students)

# ─── Table 4.3: Response counts by item type ──────────────────────────────────

banner("Table 4.3 — Response Counts by SDM Item Type")

scored_rows = [r for r in rows if r["is_scored"] == "t"]
anchor_rows = [r for r in rows if r["is_anchor"] == "t"]
scored_anchor = [r for r in rows if r["is_scored"] == "t" and r["is_anchor"] == "t"]
unscored_anchor = [r for r in rows if r["is_scored"] == "f" and r["is_anchor"] == "t"]
sdm_rows = [r for r in rows if r["is_anchor"] == "f"]

# Anchor scored knowledge items
n_anchor_scored = len(scored_anchor)
print(f"  Anchor scored responses: {n_anchor_scored}")
check("Anchor scored (354 × 26)", 354 * 26, n_anchor_scored)

# Anchor unscored preference items
n_anchor_unscored = len(unscored_anchor)
print(f"  Anchor unscored responses: {n_anchor_unscored}")
check("Anchor unscored (354 × 14)", 354 * 14, n_anchor_unscored)

# SDM open-ended
n_sdm = len(sdm_rows)
print(f"  SDM open-ended responses: {n_sdm}")

# Diagnose vs Confirm from SDM
sdm_diagnose = [r for r in sdm_rows if "Diagnose" in r.get("item_type", "")]
sdm_confirm = [r for r in sdm_rows if "Confirm" in r.get("item_type", "")]
print(f"  SDM Diagnose: {len(sdm_diagnose)}")
print(f"  SDM Confirm: {len(sdm_confirm)}")

# From the AI-scored CSVs
total_diagnose = sum(int(r["n"]) for r in diagnose_rows)
total_confirm = sum(int(r["confirm_n"]) for r in confirm_rows)
print(f"  Diagnose (from diagnose_by_item.csv): {total_diagnose}")
print(f"  Confirm (from confirm_by_item.csv): {total_confirm}")
check("Diagnose scored", 493, total_diagnose)
check("Confirm scored", 285, total_confirm)

# ─── Table 4.4: Diagnose three-way classification ─────────────────────────────

banner("Table 4.4 — Diagnose Three-Way Classification (n=493 scored, 479 classified)")

d_misc = sum(int(r["misconception"]) for r in diagnose_rows)
d_kg = sum(int(r["knowledge_gap"]) for r in diagnose_rows)
d_se = sum(int(r["selection_error"]) for r in diagnose_rows)
d_classified = d_misc + d_kg + d_se
d_unclassified = total_diagnose - d_classified

print(f"  Misconception:   {d_misc} ({pct(d_misc, d_classified)}%)")
print(f"  Knowledge Gap:   {d_kg} ({pct(d_kg, d_classified)}%)")
print(f"  Selection Error: {d_se} ({pct(d_se, d_classified)}%)")
print(f"  Classified total: {d_classified}")
print(f"  Unclassified:    {d_unclassified}")

check("Misconception count", 258, d_misc)
check("Knowledge Gap count", 68, d_kg)
check("Selection Error count", 153, d_se)
check("Classified total", 479, d_classified)
check("Unclassified", 14, d_unclassified)

# ─── Table 4.6: Confirm three-way classification ──────────────────────────────

banner("Table 4.6 — Confirm Three-Way Classification (n=285)")

c_ver = sum(int(r["verified"]) for r in confirm_rows)
c_par = sum(int(r["partial"]) for r in confirm_rows)
c_guess = sum(int(r["likely_guess"]) for r in confirm_rows)
c_total = c_ver + c_par + c_guess

print(f"  Verified:      {c_ver} ({pct(c_ver, c_total)}%)")
print(f"  Partial:       {c_par} ({pct(c_par, c_total)}%)")
print(f"  Likely Guess:  {c_guess} ({pct(c_guess, c_total)}%)")
print(f"  Total:         {c_total}")

check("Verified", 127, c_ver)
check("Partial", 119, c_par)
check("Likely Guess", 39, c_guess)
check("Confirm total", 285, c_total)

# ─── Section 6.2 / Table 6.1: Overall assessment scores ───────────────────────

banner("Section 6.2 / Table 6.1 — Overall Assessment Scores")

# Compute per-student score: mean of is_scored='t' items (score 100 or 0)
student_scores = {}
for r in rows:
    if r["is_scored"] == "t" and r["is_anchor"] == "t":
        aid = r["attempt_id"]
        score = float(r["item_score"])  # 100.00 or 0.00
        student_scores.setdefault(aid, []).append(score)

# Convert to percentages (already 0-100 scale)
pct_scores = [mean(v) for v in student_scores.values()]
overall_mean = round(mean(pct_scores), 1)
overall_sd = round(stdev(pct_scores), 1)
overall_median = round(median(pct_scores), 1)
overall_min = round(min(pct_scores), 1)
overall_max = round(max(pct_scores), 1)

print(f"  N students:  {len(pct_scores)}")
print(f"  Mean:        {overall_mean}%")
print(f"  SD:          {overall_sd}%")
print(f"  Median:      {overall_median}%")
print(f"  Min:         {overall_min}%")
print(f"  Max:         {overall_max}%")

check("Overall mean", 67.0, overall_mean)
check("Overall SD", 17.9, overall_sd)
check("Overall median", 69.2, overall_median)

# ─── Table 6.2: Domain means ──────────────────────────────────────────────────

banner("Table 6.2 — Mean Score by Domain")

domain_scores = defaultdict(list)
for r in rows:
    if r["is_scored"] == "t" and r["is_anchor"] == "t":
        domain_scores[r["domain"]].append(float(r["item_score"]))

# Per-student domain means
student_domain = defaultdict(lambda: defaultdict(list))
for r in rows:
    if r["is_scored"] == "t" and r["is_anchor"] == "t":
        student_domain[r["attempt_id"]][r["domain"]].append(float(r["item_score"]))

for domain in sorted(student_domain[list(student_domain.keys())[0]].keys()):
    dmeans = [mean(student_domain[aid][domain]) for aid in student_domain if domain in student_domain[aid]]
    d_mean = round(mean(dmeans), 1)
    d_sd = round(stdev(dmeans), 1)
    print(f"  {domain}: mean={d_mean}%, SD={d_sd}%")

# Expected domain means from paper
EXPECTED_DOMAINS = {
    "Behavioral and Risk Management Knowledge": 72.4,
    "Borrowing, Interest Rates, and Financial Numeracy Knowledge": 69.2,
    "Risk and Return Knowledge": 63.4,
}
for domain, exp in EXPECTED_DOMAINS.items():
    dmeans = [mean(student_domain[aid][domain]) for aid in student_domain if domain in student_domain[aid]]
    if dmeans:
        check(f"{domain} mean", exp, round(mean(dmeans), 1))

# ─── Table 6.3: Performance bands ─────────────────────────────────────────────

banner("Table 6.3 — Performance Bands")

bands = {"Below 50%": 0, "50–69%": 0, "70–79%": 0, "80%+": 0}
for s in pct_scores:
    if s < 50:
        bands["Below 50%"] += 1
    elif s < 70:
        bands["50–69%"] += 1
    elif s < 80:
        bands["70–79%"] += 1
    else:
        bands["80%+"] += 1

EXPECTED_BANDS = {"Below 50%": 45, "50–69%": 161, "70–79%": 60, "80%+": 88}
for band, count in bands.items():
    print(f"  {band}: {count} ({pct(count, len(pct_scores))}%)")
    check(f"{band} count", EXPECTED_BANDS[band], count)

# ─── SDM completion ───────────────────────────────────────────────────────────

banner("SDM — Items per Student")

sdm_per_student = Counter()
for r in rows:
    if r["is_anchor"] == "f":
        sdm_per_student[r["attempt_id"]] += 1

students_with_sdm = len(sdm_per_student)
students_with_10 = sum(1 for v in sdm_per_student.values() if v == 10)
students_with_lt10 = sum(1 for v in sdm_per_student.values() if v < 10)

print(f"  Students with SDM responses: {students_with_sdm}")
print(f"  Students with exactly 10 items: {students_with_10}")
print(f"  Students with < 10 items: {students_with_lt10}")
check("Students with 10 SDM items", 300, students_with_10)
check("Students with <10 SDM items", 54, students_with_lt10)

# SDM item count distribution
item_dist = Counter(sdm_per_student.values())
for k in sorted(item_dist.keys()):
    print(f"    {k} items: {item_dist[k]} students")

# SDM mean score (Open_Diagnose + Open_Confirm, scored items only)
sdm_scored = [r for r in rows if r["is_anchor"] == "f" and r["is_scored"] == "t"]
if sdm_scored:
    sdm_student_scores = defaultdict(list)
    for r in sdm_scored:
        sdm_student_scores[r["attempt_id"]].append(float(r["item_score"]))
    sdm_means = [mean(v) for v in sdm_student_scores.values()]
    sdm_overall = round(mean(sdm_means), 1)
    print(f"  SDM scored mean: {sdm_overall}%")

# ─── Item counts ───────────────────────────────────────────────────────────────

banner("Item Counts — 26 scored + 14 unscored = 40 anchor items")

scored_items = set()
unscored_items = set()
for r in rows:
    if r["is_anchor"] == "t":
        if r["is_scored"] == "t":
            scored_items.add(r["item_id"])
        else:
            unscored_items.add(r["item_id"])

print(f"  Unique scored anchor items: {len(scored_items)}")
print(f"  Unique unscored anchor items: {len(unscored_items)}")
print(f"  Total anchor items: {len(scored_items) + len(unscored_items)}")
check("Scored anchor items", 26, len(scored_items))
check("Unscored anchor items", 14, len(unscored_items))

# ─── Representativeness check ─────────────────────────────────────────────────

banner("Representativeness — Consented vs Full Cohort")

print(f"  Consented cohort mean: {overall_mean}%")
print(f"  (Full cohort mean must be verified from all_responses_421_students.csv or DB)")

# Try to load full cohort if available
full_path = os.path.join(SCRIPT_DIR, "all_responses_421_students.csv")
if os.path.exists(full_path):
    full_rows = load_csv("all_responses_421_students.csv")
    full_student_scores = defaultdict(list)
    for r in full_rows:
        if r.get("is_scored") == "t" and r.get("is_anchor") == "t":
            full_student_scores[r["attempt_id"]].append(float(r["item_score"]))
    if full_student_scores:
        full_pcts = [mean(v) for v in full_student_scores.values()]
        full_mean = round(mean(full_pcts), 1)
        print(f"  Full cohort mean: {full_mean}% (N={len(full_pcts)})")
        print(f"  Difference: {round(abs(overall_mean - full_mean), 1)} percentage points")

# ─── Summary ───────────────────────────────────────────────────────────────────

banner("SUMMARY")
print("  All checks above should show [PASS].")
print("  If any show [FAIL], investigate the discrepancy.")
print(f"  Script completed. Source: {os.path.basename(__file__)}")
print()

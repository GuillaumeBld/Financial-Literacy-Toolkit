#!/usr/bin/env python3
"""Generate publication-quality charts for the Financial Literacy research paper.

All figure data is sourced from the production database (N = 431 submitted students)
or from regenerated CSVs in docs/data/. No hardcoded values without a documented
data source. See plan: .claude/plans/jazzy-wishing-dijkstra.md for derivation.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
import pandas as pd
import numpy as np
import os

# Loyola branding
MAROON = '#8B0015'
GOLD = '#F1BE48'
DARK_GRAY = '#333333'
LIGHT_GRAY = '#F5F5F5'
MEDIUM_GRAY = '#999999'

# Secondary palette
TEAL = '#2A7F62'
STEEL_BLUE = '#4682B4'
CORAL = '#E8655A'
SLATE = '#5B6770'

OUT = '/root/Financial-Literacy-Toolkit/exports/figures'
os.makedirs(OUT, exist_ok=True)

sns.set_theme(style='whitegrid', font_scale=1.1)
plt.rcParams.update({
    'font.family': 'sans-serif',
    'font.sans-serif': ['DejaVu Sans'],
    'axes.titleweight': 'bold',
    'axes.titlesize': 13,
    'axes.labelsize': 11,
    'figure.dpi': 200,
    'savefig.dpi': 200,
    'savefig.bbox': 'tight',
    'savefig.pad_inches': 0.3,
})

DATA = '/root/Financial-Literacy-Toolkit/docs/data'

# ── Fig 1: Score Distribution Histogram ──────────────────────────────
def fig1_score_distribution():
    df = pd.read_csv(f'{DATA}/domain-score-distribution.csv')
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(range(len(df)), df['count'], color=MAROON, edgecolor='white', linewidth=0.5, width=0.85)
    # Highlight modal bar
    modal_idx = df['count'].idxmax()
    bars[modal_idx].set_color(GOLD)
    bars[modal_idx].set_edgecolor(MAROON)
    bars[modal_idx].set_linewidth(1.5)
    ax.set_xticks(range(len(df)))
    ax.set_xticklabels(df['score_range'].str.replace('-', '–') + '%', rotation=0, fontsize=9)
    ax.set_xlabel('Score Range')
    ax.set_ylabel('Number of Students')
    ax.set_title('Figure 1. Pre-Course Overall Score Distribution (N = 431)')
    # Add count labels on bars
    for i, (v, p) in enumerate(zip(df['count'], df['percentage'])):
        if v > 5:
            ax.text(i, v + 1.5, f'{v}\n({p:.1f}%)', ha='center', va='bottom', fontsize=7.5, color=DARK_GRAY)
    # Add mean line — overall mean from scores table: AVG(overall) = 66.44 for N=431
    # Position: 66.44% falls in the 60-69 bin (index 6), offset ~0.644 into the bin
    ax.axvline(x=6.144, color=TEAL, linestyle='--', linewidth=1.5, label='Mean = 66.4%')
    ax.legend(loc='upper left', framealpha=0.9, fontsize=9)
    ax.set_ylim(0, df['count'].max() * 1.25)
    sns.despine(left=True)
    ax.yaxis.grid(True, alpha=0.3)
    ax.xaxis.grid(False)
    fig.savefig(f'{OUT}/fig1_score_distribution.png')
    plt.close(fig)
    print('  Fig 1 done')

# ── Fig 2: Domain Performance Comparison ─────────────────────────────
def fig2_domain_performance():
    # Data source: per-student domain averages from responses JOIN items JOIN attempts
    # for N=431 submitted students. Query: AVG then STDDEV of per-student domain scores.
    domains = ['Borrowing &\nNumeracy', 'Behavioral &\nRisk Mgmt', 'Investment &\nRisk/Return']
    means = [69.23, 73.26, 63.84]  # DB: per-student domain avg, N=431
    sds = [18.99, 26.41, 21.52]    # DB: STDDEV of per-student domain avg, N=431
    colors = [STEEL_BLUE, TEAL, CORAL]

    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar(domains, means, yerr=sds, capsize=5, color=colors, edgecolor='white', linewidth=0.5, width=0.6,
                  error_kw={'linewidth': 1.2, 'color': DARK_GRAY})
    ax.set_ylabel('Average Percent Correct (%)')
    ax.set_title('Figure 2. Domain-Level Performance Comparison (N = 431)')
    ax.set_ylim(0, 100)
    # Overall mean from scores table: AVG(overall) = 66.44 for N=431
    ax.axhline(y=66.44, color=MAROON, linestyle='--', linewidth=1.2, label='Overall Mean = 66.4%')
    for i, (m, s) in enumerate(zip(means, sds)):
        ax.text(i, m + s + 2, f'{m:.1f}%', ha='center', va='bottom', fontsize=10, fontweight='bold', color=DARK_GRAY)
    ax.legend(loc='upper right', framealpha=0.9, fontsize=9)
    sns.despine(left=True)
    ax.yaxis.grid(True, alpha=0.3)
    ax.xaxis.grid(False)
    fig.savefig(f'{OUT}/fig2_domain_performance.png')
    plt.close(fig)
    print('  Fig 2 done')

# ── Fig 3: Daily Enrollment & Completion Timeline ────────────────────
def fig3_enrollment_timeline():
    df = pd.read_csv(f'{DATA}/collection-summary.csv')
    df['date'] = pd.to_datetime(df['date'])
    df['day_label'] = df['date'].dt.strftime('Feb %d')

    fig, ax1 = plt.subplots(figsize=(9, 5))
    x = range(len(df))
    width = 0.35
    ax1.bar([i - width/2 for i in x], df['new_enrollments'], width, label='New Enrollments', color=MAROON, alpha=0.85)
    ax1.bar([i + width/2 for i in x], df['completed_assessments'], width, label='Completed', color=GOLD, alpha=0.85)
    ax1.set_ylabel('Daily Count')
    ax1.set_xticks(x)
    ax1.set_xticklabels(df['day_label'], rotation=0, fontsize=9)

    # Cumulative completed line only (enrollment line removed to avoid
    # 442 vs 443 visual conflict — see plan Task 2)
    ax2 = ax1.twinx()
    ax2.plot(x, df['cumulative_completed'], 's--', color=TEAL, linewidth=2, markersize=5, label='Cumulative Completed')
    ax2.set_ylabel('Cumulative Total')
    ax2.set_ylim(0, 460)

    # Combine legends
    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax1.legend(h1 + h2, l1 + l2, loc='upper left', framealpha=0.9, fontsize=8.5)
    ax1.set_title('Figure 3. Daily Enrollment and Completion (Feb 2\u201310, 2026)')

    # Annotate final count — 443 onboarded from paper narrative, 431 from chart data
    last_x = len(df) - 1
    ax2.annotate('443 onboarded\n431 submitted\n(97.3%)', xy=(last_x, 431), fontsize=8.5,
                 ha='center', va='bottom', color=DARK_GRAY,
                 bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=MEDIUM_GRAY, alpha=0.9))

    sns.despine(right=False)
    ax1.yaxis.grid(True, alpha=0.3)
    ax1.xaxis.grid(False)
    fig.savefig(f'{OUT}/fig3_enrollment_timeline.png')
    plt.close(fig)
    print('  Fig 3 done')

# ── Fig 4: Submission Time of Day ────────────────────────────────────
def fig4_submission_time():
    df = pd.read_csv(f'{DATA}/submission-timeline.csv')
    # Fill missing hours with 0
    all_hours = pd.DataFrame({'hour_utc': range(24)})
    df = all_hours.merge(df, on='hour_utc', how='left').fillna(0)
    # Convert UTC to Chicago (CST = UTC-6)
    df['hour_cst'] = (df['hour_utc'] - 6) % 24
    df = df.sort_values('hour_cst')

    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.fill_between(range(24), df['submissions'].values, alpha=0.3, color=MAROON)
    ax.plot(range(24), df['submissions'].values, color=MAROON, linewidth=2)
    ax.scatter(range(24), df['submissions'].values, color=MAROON, s=25, zorder=5)

    ax.set_xticks(range(24))
    ax.set_xticklabels([f'{h}:00' if h % 3 == 0 else '' for h in df['hour_cst'].values], fontsize=8)
    ax.set_xlabel('Time of Day (Chicago / CST)')
    ax.set_ylabel('Number of Submissions')
    ax.set_title('Figure 4. Assessment Submission Time Distribution (N = 431)')

    # Highlight peak window
    peak_start = list(df['hour_cst']).index(14) if 14 in df['hour_cst'].values else None
    peak_end = list(df['hour_cst']).index(22) if 22 in df['hour_cst'].values else None
    if peak_start is not None and peak_end is not None:
        ax.axvspan(peak_start, peak_end, alpha=0.08, color=GOLD, label='Evening Peak (2\u201310 PM)')

    ax.legend(loc='upper left', fontsize=9)
    sns.despine(left=True)
    ax.yaxis.grid(True, alpha=0.3)
    ax.xaxis.grid(False)
    fig.savefig(f'{OUT}/fig4_submission_time.png')
    plt.close(fig)
    print('  Fig 4 done')

# ── Fig 5: Confidence Calibration ────────────────────────────────────
def fig5_confidence_calibration():
    # Data source: scores.overconfidence_index for N=431 submitted students.
    # OI = avg_normalized_confidence - avg_correctness (range -0.90 to +0.75).
    # Thresholds: Underconfident OI < -0.10, Well-Calibrated -0.10 <= OI < 0.10,
    #   Moderately Overconfident 0.10 <= OI < 0.30, Highly Overconfident OI >= 0.30.
    categories = ['Underconfident', 'Well-Calibrated', 'Moderately\nOverconfident', 'Highly\nOverconfident']
    counts = [140, 160, 101, 30]   # DB: exact counts from threshold bins, N=431
    percentages = [round(c * 100.0 / 431, 1) for c in counts]  # [32.5, 37.1, 23.4, 7.0]
    colors = [STEEL_BLUE, TEAL, GOLD, CORAL]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), gridspec_kw={'width_ratios': [1.3, 1]})

    # Bar chart
    bars = ax1.barh(categories, percentages, color=colors, edgecolor='white', linewidth=0.5, height=0.6)
    for i, (p, c) in enumerate(zip(percentages, counts)):
        ax1.text(p + 1, i, f'{p}%  (n={c})', va='center', fontsize=9.5, color=DARK_GRAY)
    ax1.set_xlabel('Percentage of Students')
    ax1.set_xlim(0, 55)
    ax1.set_title('Figure 5. Confidence Calibration Categories (N = 431)')
    ax1.invert_yaxis()
    sns.despine(ax=ax1, left=True)
    ax1.yaxis.grid(False)
    ax1.xaxis.grid(True, alpha=0.3)

    # Pie chart
    wedges, texts, autotexts = ax2.pie(percentages, labels=None, autopct='%1.0f%%',
                                        colors=colors, startangle=90, pctdistance=0.75,
                                        wedgeprops={'edgecolor': 'white', 'linewidth': 1.5})
    for t in autotexts:
        t.set_fontsize(9)
        t.set_fontweight('bold')
    ax2.legend(categories, loc='center left', bbox_to_anchor=(0.85, 0.5), fontsize=8)
    ax2.set_title('Distribution', fontsize=11)

    fig.suptitle('')
    fig.tight_layout()
    fig.savefig(f'{OUT}/fig5_confidence_calibration.png')
    plt.close(fig)
    print('  Fig 5 done')

# ── Fig 6: Item Difficulty Ranking ───────────────────────────────────
def fig6_item_difficulty():
    # Data source: responses JOIN items for N=431 submitted students.
    # Percent correct = AVG(CASE WHEN score=100 THEN 1 ELSE 0 END) * 100 per item.
    # All 26 scored anchor items (is_anchor=true, is_scored=true).
    items = [
        ('Q4: Borrowing/Interest', 92.81),
        ('Q1: Compound Interest', 91.42),
        ('Q3: Inflation', 85.85),
        ('Q14: Risk Diversification', 84.45),
        ('Q33: Probability', 78.89),
        ('Q35: Risk-Return Relationship', 78.19),
        ('Q30: Risk-Return Tradeoff', 77.26),
        ('Q37: Insurance Types', 76.33),
        ('Q11: Risk Diversification', 75.41),
        ('Q9: Budgeting', 74.94),
        ('Q34: Diversification Effect', 74.71),
        ('Q2: Borrowing/Mortgages', 72.62),
        ('Q39: Stocks vs Bonds Risk', 71.93),
        ('Q5: Emergency Fund', 71.69),
        ('Q12: Insurance', 70.77),
        ('Q40: 2008 Financial Crisis', 69.37),
        ('Q36: Diversification Principle', 64.73),
        ('Q13: Insurance Deductible', 62.41),
        ('Q31: Stock Market Function', 62.18),
        ('Q7: Inflation (Fixed Income)', 60.09),
        ('Q8: Auto Loans', 57.54),
        ('Q32: Long-Term Asset Returns', 52.67),
        ('Q10: Credit Reports', 52.44),
        ('Q29: Interest Rates & Bonds', 36.19),
        ('Q6: Inflation (Lowering)', 32.95),
        ('Q38: Inflation Protection', 23.67),
    ]
    items.reverse()
    labels, values = zip(*items)

    fig, ax = plt.subplots(figsize=(9, 9))
    colors_bar = [TEAL if v >= 70 else GOLD if v >= 50 else CORAL for v in values]
    bars = ax.barh(labels, values, color=colors_bar, edgecolor='white', linewidth=0.5, height=0.7)

    ax.axvline(x=50, color=DARK_GRAY, linestyle=':', linewidth=1, alpha=0.5)
    # Overall mean from scores table: 66.44% for N=431
    ax.axvline(x=66.44, color=MAROON, linestyle='--', linewidth=1.2, label='Overall Mean (66.4%)')

    for i, v in enumerate(values):
        ax.text(v + 0.8, i, f'{v:.1f}%', va='center', fontsize=7.5, color=DARK_GRAY)

    ax.set_xlabel('Percent Correct')
    ax.set_xlim(0, 105)
    ax.set_title('Figure 6. Item Difficulty Ranking by Subdomain (N = 431)')

    # Legend for colors
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor=TEAL, label='Strong (\u226570%)'),
        Patch(facecolor=GOLD, label='Moderate (50\u201369%)'),
        Patch(facecolor=CORAL, label='Weak (<50%)'),
    ]
    ax.legend(handles=legend_elements, loc='lower right', fontsize=8.5, framealpha=0.9)

    sns.despine(left=True)
    ax.yaxis.grid(False)
    ax.xaxis.grid(True, alpha=0.3)
    fig.savefig(f'{OUT}/fig6_item_difficulty.png')
    plt.close(fig)
    print('  Fig 6 done')

# ── Fig 7: Demographic Composition ───────────────────────────────────
def fig7_demographics():
    # Data source: student_profiles JOIN attempts for N=431 submitted students.
    # Suppression rule: categories with < 10 respondents show "< 10" with no percentage.
    fig, axes = plt.subplots(2, 3, figsize=(13, 8))

    # 7a: Gender (N=431: Female 251, Male 174, PNS 6 → suppressed)
    ax = axes[0, 0]
    cats = ['Female', 'Male', 'Other /\nPrefer not\nto say']
    vals = [58.2, 40.4, None]  # PNS suppressed (n=6 < 10)
    colors_g = [CORAL, STEEL_BLUE, MEDIUM_GRAY]
    bar_vals = [v if v is not None else 2.0 for v in vals]  # small bar for suppressed
    bars = ax.bar(cats, bar_vals, color=colors_g, edgecolor='white', width=0.6)
    for i, v in enumerate(vals):
        if v is not None:
            ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
        else:
            ax.text(i, bar_vals[i] + 1.0, '< 10', ha='center', fontsize=8, color=MEDIUM_GRAY, style='italic')
    ax.set_title('(a) Gender', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 75)
    ax.set_ylabel('% of Students')

    # 7b: Age (N=431: ≤20 367, >20 59, PNA 5 → suppressed)
    ax = axes[0, 1]
    cats = ['≤ 20', '> 20', 'Prefer not\nto say']
    vals = [85.2, 13.7, None]  # PNA suppressed (n=5 < 10)
    colors_a = [MAROON, GOLD, MEDIUM_GRAY]
    bar_vals = [v if v is not None else 2.0 for v in vals]
    bars = ax.bar(cats, bar_vals, color=colors_a, edgecolor='white', width=0.6)
    for i, v in enumerate(vals):
        if v is not None:
            ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
        else:
            ax.text(i, bar_vals[i] + 1.0, '< 10', ha='center', fontsize=8, color=MEDIUM_GRAY, style='italic')
    ax.set_title('(b) Age Range', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 100)

    # 7c: Race/Ethnicity (N=431: White 210, Hispanic 94, Asian 54, Black 29,
    #     Two+ 28, Other/PNS/NULL combined 16 ≥ 10)
    ax = axes[0, 2]
    cats = ['White', 'Hispanic', 'Asian', 'Black', 'Two+', 'Other /\nPrefer not\nto say']
    vals = [48.7, 21.8, 12.5, 6.7, 6.5, 3.7]
    colors_c = [MAROON, GOLD, TEAL, STEEL_BLUE, CORAL, MEDIUM_GRAY]
    ax.barh(cats, vals, color=colors_c, edgecolor='white', height=0.6)
    for i, v in enumerate(vals): ax.text(v + 0.8, i, f'{v}%', va='center', fontsize=8.5)
    ax.set_title('(c) Race/Ethnicity', fontsize=11, fontweight='bold')
    ax.set_xlim(0, 62)
    ax.invert_yaxis()

    # 7d: Work Status (N=431: Part-time 303, None 63, Full-time 57, PNA 8 → suppressed)
    ax = axes[1, 0]
    cats = ['Part-time', 'None', 'Full-time', 'Prefer not\nto say']
    vals = [70.3, 14.6, 13.2, None]  # PNA suppressed (n=8 < 10)
    colors_w = [MAROON, STEEL_BLUE, GOLD, MEDIUM_GRAY]
    bar_vals = [v if v is not None else 2.0 for v in vals]
    bars = ax.bar(cats, bar_vals, color=colors_w, edgecolor='white', width=0.6)
    for i, v in enumerate(vals):
        if v is not None:
            ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
        else:
            ax.text(i, bar_vals[i] + 1.0, '< 10', ha='center', fontsize=8, color=MEDIUM_GRAY, style='italic')
    ax.set_title('(d) Work Experience', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 85)
    ax.set_ylabel('% of Students')

    # 7e: First-Gen (N=431: No 297, Yes 121, PNS+NULL 13 ≥ 10)
    ax = axes[1, 1]
    cats = ['No', 'Yes', 'Prefer not\nto say']
    vals = [68.9, 28.1, 3.0]
    ax.bar(cats, vals, color=[STEEL_BLUE, MAROON, MEDIUM_GRAY], edgecolor='white', width=0.6)
    for i, v in enumerate(vals): ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
    ax.set_title('(e) First-Generation', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 85)

    # 7f: Hide last subplot
    axes[1, 2].axis('off')

    for ax in axes.flat:
        if ax.get_visible() and ax.has_data():
            sns.despine(ax=ax, left=True)
            ax.yaxis.grid(True, alpha=0.2)
            ax.xaxis.grid(False)

    fig.suptitle('Figure 7. Sample Demographics (N = 431, submitted)\nCategories with fewer than 10 respondents are suppressed.',
                 fontsize=13, fontweight='bold', y=1.03)
    fig.tight_layout()
    fig.savefig(f'{OUT}/fig7_demographics.png')
    plt.close(fig)
    print('  Fig 7 done')

# ── Fig 8: Financial Background ──────────────────────────────────────
def fig8_financial_background():
    # Data source: student_profiles JOIN attempts for N=431 submitted students.
    # Suppression rule: categories with < 10 respondents show "< 10" with no percentage.
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5))

    # 8a: Financial Stress (N=431: Never 46, Rarely 93, Sometimes 189,
    #     Often 81, Always 18, PNA 4 → suppressed)
    cats = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always', 'Prefer not\nto say']
    vals = [10.7, 21.6, 43.9, 18.8, 4.2, None]  # PNA suppressed (n=4 < 10)
    colors_s = [TEAL, STEEL_BLUE, GOLD, CORAL, MAROON, MEDIUM_GRAY]
    bar_vals = [v if v is not None else 1.5 for v in vals]
    bars = ax1.bar(cats, bar_vals, color=colors_s, edgecolor='white', width=0.65)
    for i, v in enumerate(vals):
        if v is not None:
            ax1.text(i, v + 1, f'{v}%', ha='center', fontsize=9)
        else:
            ax1.text(i, bar_vals[i] + 0.8, '< 10', ha='center', fontsize=8, color=MEDIUM_GRAY, style='italic')
    ax1.set_title('(a) Frequency of Financial Stress', fontsize=11, fontweight='bold')
    ax1.set_ylabel('% of Students')
    ax1.set_ylim(0, 55)
    sns.despine(ax=ax1, left=True)
    ax1.yaxis.grid(True, alpha=0.2)
    ax1.xaxis.grid(False)

    # 8b: Self-Rated Knowledge (N=431: Very Low 9, Low 107, Moderate 253,
    #     High 52, Very High 7, PNA 3 → suppressed)
    cats = ['Very Low', 'Low', 'Moderate', 'High', 'Very High', 'Prefer not\nto say']
    vals = [2.1, 24.8, 58.7, 12.1, 1.6, None]  # PNA suppressed (n=3 < 10)
    colors_k = [CORAL, GOLD, STEEL_BLUE, TEAL, MAROON, MEDIUM_GRAY]
    bar_vals = [v if v is not None else 1.5 for v in vals]
    bars = ax2.bar(cats, bar_vals, color=colors_k, edgecolor='white', width=0.65)
    for i, v in enumerate(vals):
        if v is not None:
            ax2.text(i, v + 1, f'{v}%', ha='center', fontsize=9)
        else:
            ax2.text(i, bar_vals[i] + 0.8, '< 10', ha='center', fontsize=8, color=MEDIUM_GRAY, style='italic')
    ax2.set_title('(b) Self-Rated Financial Knowledge', fontsize=11, fontweight='bold')
    ax2.set_ylim(0, 72)
    sns.despine(ax=ax2, left=True)
    ax2.yaxis.grid(True, alpha=0.2)
    ax2.xaxis.grid(False)

    fig.suptitle('Figure 8. Financial Background and Self-Assessment (N = 431, submitted)\nCategories with fewer than 10 respondents are suppressed.',
                 fontsize=13, fontweight='bold', y=1.03)
    fig.tight_layout()
    fig.savefig(f'{OUT}/fig8_financial_background.png')
    plt.close(fig)
    print('  Fig 8 done')

# ── Run all ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('Generating charts...')
    fig1_score_distribution()
    fig2_domain_performance()
    fig3_enrollment_timeline()
    fig4_submission_time()
    fig5_confidence_calibration()
    fig6_item_difficulty()
    fig7_demographics()
    fig8_financial_background()
    print(f'All charts saved to {OUT}/')

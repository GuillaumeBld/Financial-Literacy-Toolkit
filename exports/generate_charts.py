#!/usr/bin/env python3
"""Generate publication-quality charts for the Financial Literacy research paper."""

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
    ax.set_title('Figure 1. Pre-Course Overall Score Distribution (N = 421)')
    # Add count labels on bars
    for i, (v, p) in enumerate(zip(df['count'], df['percentage'])):
        if v > 5:
            ax.text(i, v + 1.5, f'{v}\n({p:.1f}%)', ha='center', va='bottom', fontsize=7.5, color=DARK_GRAY)
    # Add mean line
    ax.axvline(x=6.155, color=TEAL, linestyle='--', linewidth=1.5, label='Mean = 66.6%')
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
    domains = ['Borrowing &\nNumeracy', 'Behavioral &\nRisk Mgmt', 'Investment &\nRisk/Return']
    means = [69.33, 73.46, 63.97]
    sds = [18.5, 20.2, 19.8]  # approximate SDs from paper
    colors = [STEEL_BLUE, TEAL, CORAL]

    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar(domains, means, yerr=sds, capsize=5, color=colors, edgecolor='white', linewidth=0.5, width=0.6,
                  error_kw={'linewidth': 1.2, 'color': DARK_GRAY})
    ax.set_ylabel('Average Percent Correct (%)')
    ax.set_title('Figure 2. Domain-Level Performance Comparison')
    ax.set_ylim(0, 100)
    ax.axhline(y=66.55, color=MAROON, linestyle='--', linewidth=1.2, label='Overall Mean = 66.6%')
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

    ax2 = ax1.twinx()
    ax2.plot(x, df['cumulative_enrollments'], 'o-', color=MAROON, linewidth=2, markersize=5, label='Cumulative Enrolled')
    ax2.plot(x, df['cumulative_completed'], 's--', color=TEAL, linewidth=2, markersize=5, label='Cumulative Completed')
    ax2.set_ylabel('Cumulative Total')
    ax2.set_ylim(0, 480)

    # Combine legends
    h1, l1 = ax1.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax1.legend(h1 + h2, l1 + l2, loc='upper left', framealpha=0.9, fontsize=8.5)
    ax1.set_title('Figure 3. Daily Enrollment and Completion (Feb 2–9, 2026)')

    # Annotate final count
    ax2.annotate(f'433 enrolled\n421 completed\n(97.2%)', xy=(7, 433), fontsize=8.5,
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
    ax.set_title('Figure 4. Assessment Submission Time Distribution (N = 421)')

    # Highlight peak window
    peak_start = list(df['hour_cst']).index(14) if 14 in df['hour_cst'].values else None
    peak_end = list(df['hour_cst']).index(22) if 22 in df['hour_cst'].values else None
    if peak_start is not None and peak_end is not None:
        ax.axvspan(peak_start, peak_end, alpha=0.08, color=GOLD, label='Evening Peak (2–10 PM)')

    ax.legend(loc='upper left', fontsize=9)
    sns.despine(left=True)
    ax.yaxis.grid(True, alpha=0.3)
    ax.xaxis.grid(False)
    fig.savefig(f'{OUT}/fig4_submission_time.png')
    plt.close(fig)
    print('  Fig 4 done')

# ── Fig 5: Confidence Calibration ────────────────────────────────────
def fig5_confidence_calibration():
    categories = ['Underconfident', 'Well-Calibrated', 'Moderately\nOverconfident', 'Highly\nOverconfident']
    percentages = [32.8, 41.1, 19.0, 7.1]
    counts = [int(421 * p / 100) for p in percentages]
    colors = [STEEL_BLUE, TEAL, GOLD, CORAL]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.5), gridspec_kw={'width_ratios': [1.3, 1]})

    # Bar chart
    bars = ax1.barh(categories, percentages, color=colors, edgecolor='white', linewidth=0.5, height=0.6)
    for i, (p, c) in enumerate(zip(percentages, counts)):
        ax1.text(p + 1, i, f'{p}%  (n={c})', va='center', fontsize=9.5, color=DARK_GRAY)
    ax1.set_xlabel('Percentage of Students')
    ax1.set_xlim(0, 55)
    ax1.set_title('Figure 5. Confidence Calibration Categories')
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
    # Data from paper Table 4.6 (top easiest and hardest items)
    items = [
        ('Q4: Simple Interest', 92.87),
        ('Q5: Compound Interest', 88.36),
        ('Q11: Impulse Control', 86.94),
        ('Q1: Numeracy Division', 85.27),
        ('Q3: Time Value of Money', 82.90),
        ('Q12: Budget Adherence', 82.42),
        ('Q34: Diversification Risk', 80.76),
        ('Q33: Portfolio Diversification', 78.15),
        ('Q29: Stock/Bond Distinction', 74.82),
        ('Q2: Inflation Basics', 72.21),
        ('Q9: APR Comparison', 66.27),
        ('Q40: Crisis/Systemic Risk', 63.42),
        ('Q10: Amortization', 62.00),
        ('Q8: Credit Score Factors', 60.81),
        ('Q30: Interest Rate/Bond Price', 56.29),
        ('Q35: Bond Maturity Risk', 49.64),
        ('Q36: Diversification Principle', 46.08),
        ('Q6: Inflation on Returns', 43.47),
        ('Q32: Return Ranking', 40.62),
        ('Q31: Compound Growth', 38.72),
        ('Q38: Inflation Hedge', 23.99),
    ]
    items.reverse()
    labels, values = zip(*items)

    fig, ax = plt.subplots(figsize=(9, 8))
    colors_bar = [TEAL if v >= 70 else GOLD if v >= 50 else CORAL for v in values]
    bars = ax.barh(labels, values, color=colors_bar, edgecolor='white', linewidth=0.5, height=0.7)

    ax.axvline(x=50, color=DARK_GRAY, linestyle=':', linewidth=1, alpha=0.5)
    ax.axvline(x=66.55, color=MAROON, linestyle='--', linewidth=1.2, label='Overall Mean (66.6%)')

    for i, v in enumerate(values):
        ax.text(v + 0.8, i, f'{v:.1f}%', va='center', fontsize=7.5, color=DARK_GRAY)

    ax.set_xlabel('Percent Correct')
    ax.set_xlim(0, 105)
    ax.set_title('Figure 6. Item Difficulty Ranking by Subdomain (N = 421)')
    ax.legend(loc='lower right', fontsize=9)

    # Legend for colors
    from matplotlib.patches import Patch
    legend_elements = [
        Patch(facecolor=TEAL, label='Strong (≥70%)'),
        Patch(facecolor=GOLD, label='Moderate (50–69%)'),
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
    fig, axes = plt.subplots(2, 3, figsize=(13, 8))

    # 7a: Gender
    ax = axes[0, 0]
    cats = ['Female', 'Male', 'Prefer\nnot to say']
    vals = [58.4, 40.2, 1.4]
    ax.bar(cats, vals, color=[CORAL, STEEL_BLUE, MEDIUM_GRAY], edgecolor='white', width=0.6)
    for i, v in enumerate(vals): ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
    ax.set_title('(a) Gender', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 75)
    ax.set_ylabel('% of Students')

    # 7b: Age
    ax = axes[0, 1]
    cats = ['≤ 20', '> 20', 'Prefer\nnot to say']
    vals = [87.4, 14.3, 1.2]
    ax.bar(cats, vals, color=[MAROON, GOLD, MEDIUM_GRAY], edgecolor='white', width=0.6)
    for i, v in enumerate(vals): ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
    ax.set_title('(b) Age Range', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 100)

    # 7c: Race/Ethnicity
    ax = axes[0, 2]
    cats = ['White', 'Hispanic', 'Asian', 'Black', 'Two+', 'Other']
    vals = [49.4, 22.3, 13.3, 6.9, 6.7, 1.7]
    colors_c = [MAROON, GOLD, TEAL, STEEL_BLUE, CORAL, MEDIUM_GRAY]
    ax.barh(cats, vals, color=colors_c, edgecolor='white', height=0.6)
    for i, v in enumerate(vals): ax.text(v + 0.8, i, f'{v}%', va='center', fontsize=8.5)
    ax.set_title('(c) Race/Ethnicity', fontsize=11, fontweight='bold')
    ax.set_xlim(0, 62)
    ax.invert_yaxis()

    # 7d: Work Status
    ax = axes[1, 0]
    cats = ['Part-time', 'None', 'Full-time']
    vals = [72.2, 15.0, 13.5]
    ax.bar(cats, vals, color=[MAROON, STEEL_BLUE, GOLD], edgecolor='white', width=0.6)
    for i, v in enumerate(vals): ax.text(i, v + 1.5, f'{v}%', ha='center', fontsize=9)
    ax.set_title('(d) Work Experience', fontsize=11, fontweight='bold')
    ax.set_ylim(0, 85)
    ax.set_ylabel('% of Students')

    # 7e: First-Gen
    ax = axes[1, 1]
    cats = ['No', 'Yes', 'Prefer\nnot to say']
    vals = [70.8, 28.5, 3.1]
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

    fig.suptitle('Figure 7. Sample Demographics (N = 421)', fontsize=13, fontweight='bold', y=1.01)
    fig.tight_layout()
    fig.savefig(f'{OUT}/fig7_demographics.png')
    plt.close(fig)
    print('  Fig 7 done')

# ── Fig 8: Financial Background ──────────────────────────────────────
def fig8_financial_background():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5))

    # 8a: Financial Stress
    cats = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
    vals = [10.9, 22.3, 44.7, 19.5, 4.3]
    colors_s = [TEAL, STEEL_BLUE, GOLD, CORAL, MAROON]
    ax1.bar(cats, vals, color=colors_s, edgecolor='white', width=0.65)
    for i, v in enumerate(vals): ax1.text(i, v + 1, f'{v}%', ha='center', fontsize=9)
    ax1.set_title('(a) Frequency of Financial Stress', fontsize=11, fontweight='bold')
    ax1.set_ylabel('% of Students')
    ax1.set_ylim(0, 55)
    sns.despine(ax=ax1, left=True)
    ax1.yaxis.grid(True, alpha=0.2)
    ax1.xaxis.grid(False)

    # 8b: Self-Rated Knowledge
    cats = ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
    vals = [2.1, 25.2, 60.1, 12.8, 1.7]
    colors_k = [CORAL, GOLD, STEEL_BLUE, TEAL, MAROON]
    ax2.bar(cats, vals, color=colors_k, edgecolor='white', width=0.65)
    for i, v in enumerate(vals): ax2.text(i, v + 1, f'{v}%', ha='center', fontsize=9)
    ax2.set_title('(b) Self-Rated Financial Knowledge', fontsize=11, fontweight='bold')
    ax2.set_ylim(0, 72)
    sns.despine(ax=ax2, left=True)
    ax2.yaxis.grid(True, alpha=0.2)
    ax2.xaxis.grid(False)

    fig.suptitle('Figure 8. Financial Background and Self-Assessment (N = 421)', fontsize=13, fontweight='bold', y=1.01)
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

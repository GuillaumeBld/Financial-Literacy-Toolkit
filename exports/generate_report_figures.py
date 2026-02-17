#!/usr/bin/env python3
"""Copy paper figures to report_figures/ and regenerate fig2 with layout fix.

The only change from the paper figure is fig2_domain_performance.png:
- ylim raised from 100 to 105 so the Behavioral bar label (73.3% + SD=26.4%)
  is no longer clipped at the top of the chart.
All data values are identical to the paper figure.
"""

import shutil
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns

# Loyola branding (must match generate_charts.py)
MAROON = '#8B0015'
GOLD = '#F1BE48'
DARK_GRAY = '#333333'
TEAL = '#2A7F62'
STEEL_BLUE = '#4682B4'
CORAL = '#E8655A'

SRC = '/root/Financial-Literacy-Toolkit/exports/figures'
DST = '/root/Financial-Literacy-Toolkit/exports/report_figures'

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


def copy_all_figures():
    """Copy every PNG from figures/ to report_figures/."""
    os.makedirs(DST, exist_ok=True)
    for fname in os.listdir(SRC):
        if fname.endswith('.png'):
            shutil.copy2(os.path.join(SRC, fname), os.path.join(DST, fname))
            print(f'  Copied {fname}')


def regenerate_fig2():
    """Regenerate fig2_domain_performance.png with ylim=105 (layout fix only)."""
    # Identical data from generate_charts.py lines 84-86
    domains = ['Borrowing &\nNumeracy', 'Behavioral &\nRisk Mgmt', 'Investment &\nRisk/Return']
    means = [69.23, 73.26, 63.84]
    sds = [18.99, 26.41, 21.52]
    colors = [STEEL_BLUE, TEAL, CORAL]

    fig, ax = plt.subplots(figsize=(7, 5))
    bars = ax.bar(domains, means, yerr=sds, capsize=5, color=colors,
                  edgecolor='white', linewidth=0.5, width=0.6,
                  error_kw={'linewidth': 1.2, 'color': DARK_GRAY})
    ax.set_ylabel('Average Percent Correct (%)')
    ax.set_title('Figure 2. Domain-Level Performance Comparison (N = 431)')
    ax.set_ylim(0, 105)  # Changed from 100 to 105 to prevent label clipping
    ax.axhline(y=66.44, color=MAROON, linestyle='--', linewidth=1.2,
               label='Overall Mean = 66.4%')
    for i, (m, s) in enumerate(zip(means, sds)):
        ax.text(i, m + s + 2, f'{m:.1f}%', ha='center', va='bottom',
                fontsize=10, fontweight='bold', color=DARK_GRAY)
    ax.legend(loc='upper right', framealpha=0.9, fontsize=9)

    # Add error bar explanation
    ax.text(0.5, -0.12,
            'Error bars show +/- one standard deviation of individual student scores.',
            transform=ax.transAxes, ha='center', fontsize=8.5, color=DARK_GRAY,
            style='italic')

    sns.despine(left=True)
    ax.yaxis.grid(True, alpha=0.3)
    ax.xaxis.grid(False)
    fig.savefig(os.path.join(DST, 'fig2_domain_performance.png'))
    plt.close(fig)
    print('  Regenerated fig2_domain_performance.png (ylim=105)')


if __name__ == '__main__':
    print('Generating report figures...')
    copy_all_figures()
    regenerate_fig2()
    print(f'All report figures saved to {DST}/')

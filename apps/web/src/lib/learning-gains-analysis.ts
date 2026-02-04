/**
 * Learning Gains Analysis Module
 *
 * Consolidated analysis for RQ1 (Learning Gains) and RQ2 (Heterogeneity)
 * All learning-related statistical analysis in one extensible module.
 */

import {
  mean,
  standardDeviation,
  cohensD,
  interpretCohensD,
  confidenceInterval95,
  pairedTTest,
  cronbachAlpha,
  interpretAlpha,
  exploratoryFactorAnalysis,
  getSampleWarnings
} from './statistics';

// =============================================================================
// TYPES
// =============================================================================

export interface LearningGainsOverall {
  preMean: number;
  preSD: number;
  postMean: number;
  postSD: number;
  gain: number;
  gainCI: [number, number];
  cohensD: number;
  cohensInterpretation: 'negligible' | 'small' | 'medium' | 'large';
  pValue: number;
  sampleSize: number;
}

export interface DomainGain {
  domain: string;
  shortName: string;
  preMean: number;
  postMean: number;
  gain: number;
  cohensD: number;
  itemCount: number;
}

export interface GainsDistributionBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
}

export interface CronbachAlphaResult {
  alpha: number;
  interpretation: string;
  itemCount: number;
}

export interface EFALoading {
  itemId: string;
  domain: string;
  factor1: number;
  factor2: number;
  factor3: number;
  primaryFactor: number;
  crossLoading: boolean;
}

export interface EFAResult {
  loadings: EFALoading[];
  eigenvalues: number[];
  varianceExplained: number[];
  cumulativeVariance: number[];
  kmo: number | null; // Kaiser-Meyer-Olkin measure
  warnings: string[];
}

export interface SURCoefficient {
  covariate: string;
  borrowingCredit: { beta: number; se: number; pValue: number };
  riskManagement: { beta: number; se: number; pValue: number };
  investmentRisk: { beta: number; se: number; pValue: number };
}

export interface SURResult {
  coefficients: SURCoefficient[];
  residualCorrelation: number[][];
  rSquared: { borrowingCredit: number; riskManagement: number; investmentRisk: number };
  sampleSize: number;
  warnings: string[];
}

export interface ItemDifficulty {
  itemId: string;
  domain: string;
  percentCorrect: number;
  doNotKnowRate: number;
  discriminationIndex: number;
}

export interface LearningGainsAnalysis {
  // Metadata
  meta: {
    computedAt: string;
    sampleSize: number;
    preAssessments: number;
    postAssessments: number;
    matchedPairs: number;
  };

  // RQ1: Learning Gains
  overall: LearningGainsOverall;
  byDomain: DomainGain[];
  distribution: GainsDistributionBucket[];

  // Psychometric Analysis
  psychometrics: {
    cronbachAlpha: {
      byDomain: Record<string, CronbachAlphaResult>;
      overall: CronbachAlphaResult;
    };
    efa: EFAResult;
    itemDifficulty: ItemDifficulty[];
  };

  // RQ2: Heterogeneity Analysis
  heterogeneity: {
    sur: SURResult;
  };

  // Warnings and Notes
  warnings: string[];
}

// =============================================================================
// DOMAIN CONFIGURATION
// =============================================================================

export const DOMAIN_CONFIG = {
  'Borrowing, Interest Rates, and Financial Numeracy Knowledge': {
    shortName: 'Borrowing & Credit',
    itemCount: 10,
    items: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10']
  },
  'Behavioral and Risk Management Knowledge': {
    shortName: 'Risk Management',
    itemCount: 4,
    items: ['Q11', 'Q12', 'Q13', 'Q14']
  },
  'Risk and Return Knowledge': {
    shortName: 'Investment & Risk',
    itemCount: 12,
    items: ['Q29', 'Q30', 'Q31', 'Q32', 'Q33', 'Q34', 'Q35', 'Q36', 'Q37', 'Q38', 'Q39', 'Q40']
  }
} as const;

export const TOTAL_SCORED_ITEMS = 26;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export interface StudentGainData {
  userId: string;
  preScore: number;
  postScore: number;
  preDomains: Record<string, number>;
  postDomains: Record<string, number>;
}

export interface ItemResponseData {
  attemptId: string;
  userId: string;
  itemId: string;
  domain: string;
  correct: number;
}

export interface AnalysisInput {
  studentGains: StudentGainData[];
  itemResponses: ItemResponseData[];
  preAssessmentCount: number;
  postAssessmentCount: number;
}

/**
 * Compute comprehensive learning gains analysis
 */
export function computeLearningGainsAnalysis(input: AnalysisInput): LearningGainsAnalysis {
  const { studentGains, itemResponses, preAssessmentCount, postAssessmentCount } = input;
  const sampleSize = studentGains.length;
  const warnings: string[] = [];

  // Add sample warnings
  warnings.push(...getSampleWarnings(sampleSize, TOTAL_SCORED_ITEMS));

  // ==========================================================================
  // OVERALL LEARNING GAINS
  // ==========================================================================
  const preScores = studentGains.map(s => s.preScore);
  const postScores = studentGains.map(s => s.postScore);
  const gainScores = studentGains.map(s => s.postScore - s.preScore);

  const overall: LearningGainsOverall = sampleSize >= 2 ? {
    preMean: round(mean(preScores), 1),
    preSD: round(standardDeviation(preScores), 1),
    postMean: round(mean(postScores), 1),
    postSD: round(standardDeviation(postScores), 1),
    gain: round(mean(gainScores), 1),
    gainCI: confidenceInterval95(preScores, postScores).map(v => round(v, 1)) as [number, number],
    cohensD: round(cohensD(preScores, postScores)),
    cohensInterpretation: interpretCohensD(cohensD(preScores, postScores)),
    pValue: round(pairedTTest(preScores, postScores), 3),
    sampleSize
  } : {
    preMean: 0,
    preSD: 0,
    postMean: 0,
    postSD: 0,
    gain: 0,
    gainCI: [0, 0],
    cohensD: 0,
    cohensInterpretation: 'negligible',
    pValue: 1,
    sampleSize: 0
  };

  // ==========================================================================
  // DOMAIN-LEVEL GAINS
  // ==========================================================================
  const byDomain: DomainGain[] = Object.entries(DOMAIN_CONFIG).map(([domain, config]) => {
    const preDomainScores = studentGains
      .filter(s => s.preDomains[domain] !== undefined)
      .map(s => s.preDomains[domain]);
    const postDomainScores = studentGains
      .filter(s => s.postDomains[domain] !== undefined)
      .map(s => s.postDomains[domain]);

    if (preDomainScores.length < 2 || postDomainScores.length < 2) {
      return {
        domain,
        shortName: config.shortName,
        preMean: 0,
        postMean: 0,
        gain: 0,
        cohensD: 0,
        itemCount: config.itemCount
      };
    }

    return {
      domain,
      shortName: config.shortName,
      preMean: round(mean(preDomainScores), 1),
      postMean: round(mean(postDomainScores), 1),
      gain: round(mean(postDomainScores) - mean(preDomainScores), 1),
      cohensD: round(cohensD(preDomainScores, postDomainScores)),
      itemCount: config.itemCount
    };
  });

  // ==========================================================================
  // GAINS DISTRIBUTION
  // ==========================================================================
  const distributionRanges = [
    { range: '< -10', min: -Infinity, max: -10 },
    { range: '-10 to 0', min: -10, max: 0 },
    { range: '0 to +10', min: 0, max: 10 },
    { range: '+10 to +20', min: 10, max: 20 },
    { range: '+20 to +30', min: 20, max: 30 },
    { range: '> +30', min: 30, max: Infinity }
  ];

  const distribution: GainsDistributionBucket[] = distributionRanges.map(range => {
    const count = gainScores.filter(g => g > range.min && g <= range.max).length;
    return {
      ...range,
      count,
      percentage: sampleSize > 0 ? round((count / sampleSize) * 100, 0) : 0
    };
  });

  // ==========================================================================
  // CRONBACH'S ALPHA
  // ==========================================================================
  const responsesByAttempt: Record<string, Record<string, number>> = {};
  const domainItems: Record<string, Set<string>> = {};
  const itemDomainMap: Record<string, string> = {};

  itemResponses.forEach(row => {
    if (!responsesByAttempt[row.attemptId]) {
      responsesByAttempt[row.attemptId] = {};
    }
    responsesByAttempt[row.attemptId][row.itemId] = row.correct;

    if (!domainItems[row.domain]) {
      domainItems[row.domain] = new Set();
    }
    domainItems[row.domain].add(row.itemId);
    itemDomainMap[row.itemId] = row.domain;
  });

  const cronbachByDomain: Record<string, CronbachAlphaResult> = {};

  Object.entries(domainItems).forEach(([domain, items]) => {
    const itemIds = Array.from(items).sort();
    const attempts = Object.keys(responsesByAttempt);

    const itemScoreMatrix: number[][] = [];
    attempts.forEach(attemptId => {
      const attemptResponses = responsesByAttempt[attemptId];
      const scores = itemIds.map(itemId => attemptResponses[itemId] ?? 0);
      if (scores.some(s => s !== undefined)) {
        itemScoreMatrix.push(scores);
      }
    });

    if (itemScoreMatrix.length >= 3) {
      const alpha = cronbachAlpha(itemScoreMatrix);
      cronbachByDomain[domain] = {
        alpha: round(alpha),
        interpretation: interpretAlpha(alpha),
        itemCount: itemIds.length
      };
    } else {
      cronbachByDomain[domain] = {
        alpha: 0,
        interpretation: 'insufficient data',
        itemCount: itemIds.length
      };
    }
  });

  // Overall Cronbach's alpha
  const allItemIds = Array.from(new Set(itemResponses.map(r => r.itemId))).sort();
  const allAttempts = Object.keys(responsesByAttempt);
  const overallItemMatrix: number[][] = [];

  allAttempts.forEach(attemptId => {
    const attemptResponses = responsesByAttempt[attemptId];
    const scores = allItemIds.map(itemId => attemptResponses[itemId] ?? 0);
    if (scores.some(s => s !== undefined)) {
      overallItemMatrix.push(scores);
    }
  });

  const overallAlphaValue = overallItemMatrix.length >= 3 ? cronbachAlpha(overallItemMatrix) : 0;

  // ==========================================================================
  // EXPLORATORY FACTOR ANALYSIS (EFA)
  // ==========================================================================
  let efaResult: EFAResult = {
    loadings: [],
    eigenvalues: [],
    varianceExplained: [],
    cumulativeVariance: [],
    kmo: null,
    warnings: []
  };

  if (overallItemMatrix.length >= 30) {
    try {
      const efa = exploratoryFactorAnalysis(overallItemMatrix, 3);
      const loadings = efa.rotatedLoadings || efa.loadings;

      // Calculate cumulative variance
      const cumVar: number[] = [];
      let cumSum = 0;
      efa.varianceExplained.forEach(v => {
        cumSum += v;
        cumVar.push(round(cumSum, 1));
      });

      efaResult = {
        loadings: allItemIds.map((itemId, i) => {
          const rowLoadings = loadings[i] || [0, 0, 0];
          const absLoadings = rowLoadings.map(Math.abs);
          const maxIdx = absLoadings.indexOf(Math.max(...absLoadings));

          // Check for cross-loading (>0.4 on multiple factors)
          const highLoadings = absLoadings.filter(l => l > 0.4);
          const crossLoading = highLoadings.length > 1;

          return {
            itemId,
            domain: itemDomainMap[itemId] || 'Unknown',
            factor1: round(rowLoadings[0]),
            factor2: round(rowLoadings[1]),
            factor3: round(rowLoadings[2]),
            primaryFactor: maxIdx + 1,
            crossLoading
          };
        }),
        eigenvalues: efa.eigenvalues.map(e => round(e)),
        varianceExplained: efa.varianceExplained.map(v => round(v, 1)),
        cumulativeVariance: cumVar,
        kmo: null, // Would need to compute KMO
        warnings: []
      };

      // Add warnings
      if (overallItemMatrix.length < 130) {
        efaResult.warnings.push(`Sample size (${overallItemMatrix.length}) is below recommended minimum of 130 (5× items).`);
      }

      const crossLoadingCount = efaResult.loadings.filter(l => l.crossLoading).length;
      if (crossLoadingCount > 0) {
        efaResult.warnings.push(`${crossLoadingCount} items have cross-loadings (>0.4 on multiple factors).`);
      }
    } catch (err) {
      efaResult.warnings.push('EFA computation failed. Insufficient data variance.');
    }
  } else {
    efaResult.warnings.push(`EFA requires at least 30 observations. Current: ${overallItemMatrix.length}`);
  }

  // ==========================================================================
  // ITEM DIFFICULTY ANALYSIS
  // ==========================================================================
  const itemDifficulty: ItemDifficulty[] = allItemIds.map(itemId => {
    const responses = itemResponses.filter(r => r.itemId === itemId);
    const correctCount = responses.filter(r => r.correct === 1).length;
    const totalCount = responses.length;

    return {
      itemId,
      domain: itemDomainMap[itemId] || 'Unknown',
      percentCorrect: totalCount > 0 ? round((correctCount / totalCount) * 100, 1) : 0,
      doNotKnowRate: 0, // Would need "do not know" tracking
      discriminationIndex: 0 // Would need upper/lower group comparison
    };
  });

  // ==========================================================================
  // SUR HETEROGENEITY (Placeholder structure)
  // ==========================================================================
  const surResult: SURResult = {
    coefficients: [],
    residualCorrelation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    rSquared: { borrowingCredit: 0, riskManagement: 0, investmentRisk: 0 },
    sampleSize: sampleSize,
    warnings: []
  };

  if (sampleSize < 10) {
    surResult.warnings.push('Insufficient matched pre/post data for heterogeneity analysis.');
  } else if (sampleSize < 30) {
    surResult.warnings.push(`Sample size (${sampleSize}) is below recommended minimum of 30 for regression.`);
  }

  // ==========================================================================
  // COMPILE RESULT
  // ==========================================================================
  return {
    meta: {
      computedAt: new Date().toISOString(),
      sampleSize,
      preAssessments: preAssessmentCount,
      postAssessments: postAssessmentCount,
      matchedPairs: sampleSize
    },
    overall,
    byDomain,
    distribution,
    psychometrics: {
      cronbachAlpha: {
        byDomain: cronbachByDomain,
        overall: {
          alpha: round(overallAlphaValue),
          interpretation: interpretAlpha(overallAlphaValue),
          itemCount: allItemIds.length
        }
      },
      efa: efaResult,
      itemDifficulty
    },
    heterogeneity: {
      sur: surResult
    },
    warnings
  };
}

/**
 * Get empty/default learning gains analysis structure
 */
export function getEmptyLearningGainsAnalysis(): LearningGainsAnalysis {
  return {
    meta: {
      computedAt: new Date().toISOString(),
      sampleSize: 0,
      preAssessments: 0,
      postAssessments: 0,
      matchedPairs: 0
    },
    overall: {
      preMean: 0,
      preSD: 0,
      postMean: 0,
      postSD: 0,
      gain: 0,
      gainCI: [0, 0],
      cohensD: 0,
      cohensInterpretation: 'negligible',
      pValue: 1,
      sampleSize: 0
    },
    byDomain: Object.entries(DOMAIN_CONFIG).map(([domain, config]) => ({
      domain,
      shortName: config.shortName,
      preMean: 0,
      postMean: 0,
      gain: 0,
      cohensD: 0,
      itemCount: config.itemCount
    })),
    distribution: [
      { range: '< -10', min: -Infinity, max: -10, count: 0, percentage: 0 },
      { range: '-10 to 0', min: -10, max: 0, count: 0, percentage: 0 },
      { range: '0 to +10', min: 0, max: 10, count: 0, percentage: 0 },
      { range: '+10 to +20', min: 10, max: 20, count: 0, percentage: 0 },
      { range: '+20 to +30', min: 20, max: 30, count: 0, percentage: 0 },
      { range: '> +30', min: 30, max: Infinity, count: 0, percentage: 0 }
    ],
    psychometrics: {
      cronbachAlpha: {
        byDomain: {},
        overall: { alpha: 0, interpretation: 'no data', itemCount: 0 }
      },
      efa: {
        loadings: [],
        eigenvalues: [],
        varianceExplained: [],
        cumulativeVariance: [],
        kmo: null,
        warnings: ['No data available for factor analysis.']
      },
      itemDifficulty: []
    },
    heterogeneity: {
      sur: {
        coefficients: [],
        residualCorrelation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        rSquared: { borrowingCredit: 0, riskManagement: 0, investmentRisk: 0 },
        sampleSize: 0,
        warnings: ['No data available for heterogeneity analysis.']
      }
    },
    warnings: ['No assessment data available.']
  };
}

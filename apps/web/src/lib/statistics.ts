/**
 * Statistical Analysis Library
 *
 * Pure TypeScript implementation of statistical functions for:
 * - Basic descriptive statistics
 * - Cronbach's Alpha (internal consistency)
 * - Exploratory Factor Analysis (EFA)
 * - Seemingly Unrelated Regressions (SUR)
 * - Effect sizes and hypothesis testing
 */

// =============================================================================
// BASIC STATISTICS
// =============================================================================

/**
 * Calculate the arithmetic mean of an array
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate the variance of an array (sample variance, n-1 denominator)
 */
export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map(v => (v - m) ** 2);
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);
}

/**
 * Calculate the standard deviation (sample SD)
 */
export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

/**
 * Calculate covariance between two arrays
 */
export function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const xMean = mean(x);
  const yMean = mean(y);
  let sum = 0;
  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - xMean) * (y[i] - yMean);
  }
  return sum / (x.length - 1);
}

/**
 * Calculate Pearson correlation coefficient
 */
export function correlation(x: number[], y: number[]): number {
  const cov = covariance(x, y);
  const sdX = standardDeviation(x);
  const sdY = standardDeviation(y);
  if (sdX === 0 || sdY === 0) return 0;
  return cov / (sdX * sdY);
}

/**
 * Calculate standard error of the mean
 */
export function standardError(values: number[]): number {
  if (values.length === 0) return 0;
  return standardDeviation(values) / Math.sqrt(values.length);
}

// =============================================================================
// CORRELATION MATRIX
// =============================================================================

/**
 * Compute correlation matrix from a data matrix
 * @param data - 2D array where rows are observations and columns are variables
 * @returns Square correlation matrix
 */
export function correlationMatrix(data: number[][]): number[][] {
  if (data.length === 0) return [];

  const n = data.length; // observations
  const p = data[0].length; // variables

  // Transpose to get columns (variables)
  const columns: number[][] = [];
  for (let j = 0; j < p; j++) {
    columns.push(data.map(row => row[j]));
  }

  // Compute correlation matrix
  const corrMatrix: number[][] = [];
  for (let i = 0; i < p; i++) {
    corrMatrix[i] = [];
    for (let j = 0; j < p; j++) {
      if (i === j) {
        corrMatrix[i][j] = 1;
      } else if (j < i) {
        corrMatrix[i][j] = corrMatrix[j][i]; // symmetric
      } else {
        corrMatrix[i][j] = correlation(columns[i], columns[j]);
      }
    }
  }

  return corrMatrix;
}

// =============================================================================
// CRONBACH'S ALPHA
// =============================================================================

/**
 * Calculate Cronbach's Alpha for internal consistency
 * @param itemScores - 2D array where rows are observations and columns are items
 * @returns Alpha coefficient (0-1, higher = more consistent)
 */
export function cronbachAlpha(itemScores: number[][]): number {
  if (itemScores.length < 2 || itemScores[0].length < 2) {
    return 0;
  }

  const n = itemScores.length; // observations
  const k = itemScores[0].length; // items

  // Calculate variance of each item
  const itemVariances: number[] = [];
  for (let j = 0; j < k; j++) {
    const itemValues = itemScores.map(row => row[j]);
    itemVariances.push(variance(itemValues));
  }

  // Calculate total score variance
  const totalScores = itemScores.map(row => row.reduce((sum, v) => sum + v, 0));
  const totalVariance = variance(totalScores);

  if (totalVariance === 0) return 0;

  // Cronbach's alpha formula
  const sumItemVariances = itemVariances.reduce((sum, v) => sum + v, 0);
  const alpha = (k / (k - 1)) * (1 - sumItemVariances / totalVariance);

  return Math.max(0, Math.min(1, alpha)); // Clamp to [0, 1]
}

/**
 * Interpret Cronbach's Alpha value
 */
export function interpretAlpha(alpha: number): 'excellent' | 'good' | 'acceptable' | 'questionable' | 'poor' {
  if (alpha >= 0.9) return 'excellent';
  if (alpha >= 0.8) return 'good';
  if (alpha >= 0.7) return 'acceptable';
  if (alpha >= 0.6) return 'questionable';
  return 'poor';
}

// =============================================================================
// EFFECT SIZE & HYPOTHESIS TESTING
// =============================================================================

/**
 * Calculate Cohen's d for paired samples (within-subjects)
 * @param pre - Pre-test scores
 * @param post - Post-test scores
 * @returns Cohen's d effect size
 */
export function cohensD(pre: number[], post: number[]): number {
  if (pre.length !== post.length || pre.length < 2) return 0;

  // Calculate differences
  const differences = pre.map((v, i) => post[i] - v);
  const meanDiff = mean(differences);
  const sdDiff = standardDeviation(differences);

  if (sdDiff === 0) return 0;

  return meanDiff / sdDiff;
}

/**
 * Interpret Cohen's d effect size
 */
export function interpretCohensD(d: number): 'negligible' | 'small' | 'medium' | 'large' {
  const absD = Math.abs(d);
  if (absD < 0.2) return 'negligible';
  if (absD < 0.5) return 'small';
  if (absD < 0.8) return 'medium';
  return 'large';
}

/**
 * Calculate 95% confidence interval for mean difference
 * @param pre - Pre-test scores
 * @param post - Post-test scores
 * @returns [lower, upper] bounds of 95% CI
 */
export function confidenceInterval95(pre: number[], post: number[]): [number, number] {
  if (pre.length !== post.length || pre.length < 2) return [0, 0];

  const differences = pre.map((v, i) => post[i] - v);
  const meanDiff = mean(differences);
  const se = standardError(differences);

  // t-critical value for 95% CI (approximate using 1.96 for large samples)
  // For small samples, should use t-distribution
  const tCritical = pre.length < 30 ? getTCritical(pre.length - 1, 0.025) : 1.96;

  const margin = tCritical * se;
  return [meanDiff - margin, meanDiff + margin];
}

/**
 * Perform paired t-test and return p-value
 * @param pre - Pre-test scores
 * @param post - Post-test scores
 * @returns Two-tailed p-value
 */
export function pairedTTest(pre: number[], post: number[]): number {
  if (pre.length !== post.length || pre.length < 2) return 1;

  const differences = pre.map((v, i) => post[i] - v);
  const meanDiff = mean(differences);
  const se = standardError(differences);

  if (se === 0) return meanDiff === 0 ? 1 : 0;

  const tStat = meanDiff / se;
  const df = pre.length - 1;

  // Calculate p-value from t-statistic (two-tailed)
  return tDistributionPValue(Math.abs(tStat), df) * 2;
}

/**
 * Get t-critical value for given degrees of freedom and alpha
 * Approximation for common values
 */
function getTCritical(df: number, alpha: number): number {
  // Approximate t-critical values for alpha = 0.025 (two-tailed 95%)
  if (df >= 120) return 1.98;
  if (df >= 60) return 2.00;
  if (df >= 30) return 2.04;
  if (df >= 20) return 2.09;
  if (df >= 15) return 2.13;
  if (df >= 10) return 2.23;
  if (df >= 5) return 2.57;
  return 2.78;
}

/**
 * Approximate p-value from t-distribution
 * Uses approximation for computational efficiency
 */
function tDistributionPValue(t: number, df: number): number {
  // Approximation using normal distribution for large df
  if (df > 30) {
    return normalCDF(-Math.abs(t));
  }

  // For smaller df, use approximation
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;

  // Incomplete beta function approximation
  return incompleteBeta(x, a, b) / 2;
}

/**
 * Standard normal CDF approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
  // Simple approximation for t-distribution p-values
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Continued fraction approximation
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaCF(x, a, b) / a;
  } else {
    return 1 - bt * betaCF(1 - x, b, a) / b;
  }
}

/**
 * Log gamma function approximation (Stirling)
 */
function lgamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    ser += c[j] / ++y;
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

/**
 * Continued fraction for incomplete beta
 */
function betaCF(x: number, a: number, b: number): number {
  const maxIterations = 100;
  const epsilon = 3e-7;

  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;

  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < epsilon) break;
  }

  return h;
}

// =============================================================================
// MATRIX OPERATIONS
// =============================================================================

/**
 * Matrix multiplication
 */
export function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;

  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }

  return result;
}

/**
 * Matrix transpose
 */
export function matrixTranspose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0].length;

  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = A[i][j];
    }
  }

  return result;
}

/**
 * Create identity matrix
 */
export function identityMatrix(n: number): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < n; i++) {
    result[i] = [];
    for (let j = 0; j < n; j++) {
      result[i][j] = i === j ? 1 : 0;
    }
  }
  return result;
}

/**
 * Matrix inverse using Gauss-Jordan elimination
 */
export function matrixInverse(A: number[][]): number[][] | null {
  const n = A.length;

  // Create augmented matrix [A | I]
  const aug: number[][] = [];
  for (let i = 0; i < n; i++) {
    aug[i] = [...A[i]];
    for (let j = 0; j < n; j++) {
      aug[i].push(i === j ? 1 : 0);
    }
  }

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    // Check for singular matrix
    if (Math.abs(aug[i][i]) < 1e-10) {
      return null;
    }

    // Scale pivot row
    const pivot = aug[i][i];
    for (let j = 0; j < 2 * n; j++) {
      aug[i][j] /= pivot;
    }

    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = aug[k][i];
        for (let j = 0; j < 2 * n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }
  }

  // Extract inverse from augmented matrix
  const inv: number[][] = [];
  for (let i = 0; i < n; i++) {
    inv[i] = aug[i].slice(n);
  }

  return inv;
}

// =============================================================================
// EIGENVALUE DECOMPOSITION (Power Iteration)
// =============================================================================

/**
 * Find eigenvalues and eigenvectors using power iteration
 * @param A - Symmetric matrix
 * @param numEigen - Number of eigenvalues to find
 * @returns Object with eigenvalues and eigenvectors
 */
export function eigenDecomposition(
  A: number[][],
  numEigen: number
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = A.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];

  // Work with a copy to deflate
  let B = A.map(row => [...row]);

  for (let k = 0; k < Math.min(numEigen, n); k++) {
    // Power iteration to find dominant eigenvalue
    let v = new Array(n).fill(1 / Math.sqrt(n));
    let eigenvalue = 0;

    for (let iter = 0; iter < 100; iter++) {
      // Multiply Bv
      const Bv: number[] = [];
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          sum += B[i][j] * v[j];
        }
        Bv[i] = sum;
      }

      // Normalize
      const norm = Math.sqrt(Bv.reduce((sum, x) => sum + x * x, 0));
      if (norm < 1e-10) break;

      eigenvalue = Bv.reduce((sum, x, i) => sum + x * v[i], 0);
      v = Bv.map(x => x / norm);
    }

    eigenvalues.push(eigenvalue);
    eigenvectors.push(v);

    // Deflate: B = B - eigenvalue * v * v^T
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        B[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }

  return { eigenvalues, eigenvectors };
}

// =============================================================================
// EXPLORATORY FACTOR ANALYSIS (EFA)
// =============================================================================

export interface EFAResult {
  loadings: number[][];
  eigenvalues: number[];
  varianceExplained: number[];
  communalities: number[];
  rotatedLoadings?: number[][];
}

/**
 * Perform Exploratory Factor Analysis using PCA
 * @param data - 2D array where rows are observations and columns are variables
 * @param numFactors - Number of factors to extract
 * @returns EFA results including loadings and variance explained
 */
export function exploratoryFactorAnalysis(
  data: number[][],
  numFactors: number
): EFAResult {
  if (data.length < 3 || data[0].length < numFactors) {
    return {
      loadings: [],
      eigenvalues: [],
      varianceExplained: [],
      communalities: []
    };
  }

  // Compute correlation matrix
  const corrMatrix = correlationMatrix(data);
  const p = corrMatrix.length;

  // Eigenvalue decomposition
  const { eigenvalues, eigenvectors } = eigenDecomposition(corrMatrix, numFactors);

  // Calculate factor loadings: loading = eigenvector * sqrt(eigenvalue)
  const loadings: number[][] = [];
  for (let i = 0; i < p; i++) {
    loadings[i] = [];
    for (let k = 0; k < numFactors; k++) {
      loadings[i][k] = eigenvectors[k][i] * Math.sqrt(Math.max(0, eigenvalues[k]));
    }
  }

  // Calculate variance explained
  const totalVariance = p; // For correlation matrix, total variance = number of variables
  const varianceExplained = eigenvalues.map(e => (e / totalVariance) * 100);

  // Calculate communalities
  const communalities = loadings.map(row =>
    row.reduce((sum, l) => sum + l * l, 0)
  );

  // Apply Varimax rotation
  const rotatedLoadings = varimaxRotation(loadings);

  return {
    loadings,
    eigenvalues,
    varianceExplained,
    communalities,
    rotatedLoadings
  };
}

/**
 * Varimax rotation for factor loadings
 */
function varimaxRotation(loadings: number[][], maxIter: number = 100): number[][] {
  const p = loadings.length; // variables
  const k = loadings[0].length; // factors

  if (k < 2) return loadings;

  // Copy loadings
  let A = loadings.map(row => [...row]);

  for (let iter = 0; iter < maxIter; iter++) {
    let converged = true;

    // Rotate each pair of factors
    for (let i = 0; i < k - 1; i++) {
      for (let j = i + 1; j < k; j++) {
        // Extract columns i and j
        const xi = A.map(row => row[i]);
        const xj = A.map(row => row[j]);

        // Calculate rotation angle
        let a = 0, b = 0, c = 0, d = 0;
        for (let v = 0; v < p; v++) {
          const u = xi[v] * xi[v] - xj[v] * xj[v];
          const t = 2 * xi[v] * xj[v];
          a += u;
          b += t;
          c += u * u - t * t;
          d += 2 * u * t;
        }

        const phi = 0.25 * Math.atan2(d - 2 * a * b / p, c - (a * a - b * b) / p);

        if (Math.abs(phi) > 1e-6) {
          converged = false;
          const cos = Math.cos(phi);
          const sin = Math.sin(phi);

          // Rotate columns
          for (let v = 0; v < p; v++) {
            const newI = cos * A[v][i] + sin * A[v][j];
            const newJ = -sin * A[v][i] + cos * A[v][j];
            A[v][i] = newI;
            A[v][j] = newJ;
          }
        }
      }
    }

    if (converged) break;
  }

  return A;
}

// =============================================================================
// ORDINARY LEAST SQUARES REGRESSION
// =============================================================================

export interface OLSResult {
  coefficients: number[];
  standardErrors: number[];
  tStats: number[];
  pValues: number[];
  rSquared: number;
  residuals: number[];
}

/**
 * Ordinary Least Squares regression
 * @param y - Dependent variable (n x 1)
 * @param X - Independent variables (n x p), should include intercept column
 * @returns Regression results
 */
export function ordinaryLeastSquares(y: number[], X: number[][]): OLSResult {
  const n = y.length;
  const p = X[0].length;

  if (n < p + 1) {
    return {
      coefficients: new Array(p).fill(0),
      standardErrors: new Array(p).fill(0),
      tStats: new Array(p).fill(0),
      pValues: new Array(p).fill(1),
      rSquared: 0,
      residuals: new Array(n).fill(0)
    };
  }

  // X'X
  const XtX = matrixMultiply(matrixTranspose(X), X);

  // (X'X)^-1
  const XtXinv = matrixInverse(XtX);
  if (!XtXinv) {
    return {
      coefficients: new Array(p).fill(0),
      standardErrors: new Array(p).fill(0),
      tStats: new Array(p).fill(0),
      pValues: new Array(p).fill(1),
      rSquared: 0,
      residuals: new Array(n).fill(0)
    };
  }

  // X'y
  const Xty: number[][] = matrixMultiply(matrixTranspose(X), y.map(v => [v]));

  // Beta = (X'X)^-1 X'y
  const beta: number[][] = matrixMultiply(XtXinv, Xty);
  const coefficients = beta.map(row => row[0]);

  // Fitted values and residuals
  const yHat = X.map(row => row.reduce((sum, x, j) => sum + x * coefficients[j], 0));
  const residuals = y.map((yi, i) => yi - yHat[i]);

  // RSS and TSS
  const yMean = mean(y);
  const rss = residuals.reduce((sum, r) => sum + r * r, 0);
  const tss = y.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);

  // R-squared
  const rSquared = tss > 0 ? 1 - rss / tss : 0;

  // Standard error of regression
  const sigmaSquared = rss / (n - p);

  // Standard errors of coefficients
  const standardErrors = XtXinv.map((row, i) => Math.sqrt(Math.max(0, sigmaSquared * row[i])));

  // t-statistics and p-values
  const tStats = coefficients.map((b, i) =>
    standardErrors[i] > 0 ? b / standardErrors[i] : 0
  );
  const pValues = tStats.map(t =>
    tDistributionPValue(Math.abs(t), n - p) * 2
  );

  return {
    coefficients,
    standardErrors,
    tStats,
    pValues,
    rSquared,
    residuals
  };
}

// =============================================================================
// SEEMINGLY UNRELATED REGRESSIONS (SUR)
// =============================================================================

export interface SURResult {
  coefficients: number[][]; // [equation][coefficient]
  standardErrors: number[][];
  tStats: number[][];
  pValues: number[][];
  rSquared: number[];
  residualCorrelation: number[][];
}

/**
 * Seemingly Unrelated Regressions (Feasible GLS)
 * @param Y - Dependent variables (n x k matrix, k equations)
 * @param X - Independent variables (n x p matrix, same for all equations)
 * @returns SUR results
 */
export function seeminglyUnrelatedRegression(
  Y: number[][],
  X: number[][]
): SURResult {
  const n = Y.length;
  const k = Y[0].length; // number of equations
  const p = X[0].length; // number of regressors

  // Step 1: Run OLS for each equation
  const olsResults: OLSResult[] = [];
  for (let eq = 0; eq < k; eq++) {
    const y = Y.map(row => row[eq]);
    olsResults.push(ordinaryLeastSquares(y, X));
  }

  // Step 2: Estimate residual covariance matrix
  const residuals = olsResults.map(r => r.residuals);
  const Sigma: number[][] = [];
  for (let i = 0; i < k; i++) {
    Sigma[i] = [];
    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let t = 0; t < n; t++) {
        sum += residuals[i][t] * residuals[j][t];
      }
      Sigma[i][j] = sum / n;
    }
  }

  // Calculate residual correlations
  const residualCorrelation: number[][] = [];
  for (let i = 0; i < k; i++) {
    residualCorrelation[i] = [];
    for (let j = 0; j < k; j++) {
      const sigmaI = Math.sqrt(Sigma[i][i]);
      const sigmaJ = Math.sqrt(Sigma[j][j]);
      residualCorrelation[i][j] = sigmaI > 0 && sigmaJ > 0
        ? Sigma[i][j] / (sigmaI * sigmaJ)
        : 0;
    }
  }

  // Step 3: GLS estimation (simplified - use OLS results with adjusted SEs)
  // For a full implementation, would need to stack equations and use Sigma^-1
  // Here we return OLS results with correlation information

  const coefficients = olsResults.map(r => r.coefficients);
  const standardErrors = olsResults.map(r => r.standardErrors);
  const tStats = olsResults.map(r => r.tStats);
  const pValues = olsResults.map(r => r.pValues);
  const rSquared = olsResults.map(r => r.rSquared);

  return {
    coefficients,
    standardErrors,
    tStats,
    pValues,
    rSquared,
    residualCorrelation
  };
}

// =============================================================================
// HELPER FUNCTIONS FOR ANALYTICS
// =============================================================================

/**
 * Format p-value with significance stars
 */
export function formatPValue(p: number): string {
  if (p < 0.001) return '***';
  if (p < 0.01) return '**';
  if (p < 0.05) return '*';
  return '';
}

/**
 * Generate sample size warnings
 */
export function getSampleWarnings(n: number, itemCount: number = 26): string[] {
  const warnings: string[] = [];

  if (n < 10) {
    warnings.push('Caution: Very small sample (n < 10). Results are highly unstable.');
  } else if (n < 30) {
    warnings.push('Note: Sample size below 30. Confidence intervals may be wide.');
  }

  const efaMinimum = itemCount * 5;
  if (n < efaMinimum) {
    warnings.push(`EFA Warning: Recommended minimum is ${efaMinimum} (5× items). Current: ${n}`);
  }

  return warnings;
}

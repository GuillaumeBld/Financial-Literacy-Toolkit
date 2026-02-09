import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';
import {
  computeLearningGainsAnalysis,
  getEmptyLearningGainsAnalysis,
  DOMAIN_CONFIG,
  type StudentGainData,
  type ItemResponseData,
  type LearningGainsAnalysis
} from '@/lib/learning-gains-analysis';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== INSTRUCTOR ANALYTICS DATA START ===');
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get course filter from query params
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get instructor's courses
    const instructorCourses = await queryMany<{
      course_id: string;
      course_name: string;
    }>(
      `SELECT ic.course_id, c.name as course_name
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        analytics: null,
        message: 'No courses assigned'
      });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);
    const targetCourseId = courseId || courseIds[0];

    // Validate that targetCourseId is one of the instructor's courses
    const isValidCourse = courseIds.includes(targetCourseId);
    if (!isValidCourse) {
      return NextResponse.json({
        error: 'Invalid course ID or access denied'
      }, { status: 403 });
    }

    // Get attempts for the target course (or all courses if no filter specified)
    const filterCourseIds = courseId ? [targetCourseId] : courseIds;

    // Get attempts for analysis
    let attemptsQuery = `
      SELECT 
        a.attempt_id,
        a.user_id,
        a.course_id,
        a.attempt_type,
        a.submitted_at,
        a.duration_s,
        s.overall,
        s.by_domain,
        s.overconfidence_index
      FROM attempts a
      LEFT JOIN scores s ON a.attempt_id = s.attempt_id
      WHERE a.course_id = ANY($1::uuid[])
    `;
    
    const attempts = await queryMany<{
      attempt_id: string;
      user_id: string;
      course_id: string;
      attempt_type: string;
      submitted_at: string | null;
      duration_s: number | null;
      overall: number | null;
      by_domain: any;
      overconfidence_index: number | null;
    }>(attemptsQuery, [filterCourseIds]);

    // Get total onboarded students from student_profiles
    const onboardedResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM student_profiles WHERE course_id = $1`,
      [targetCourseId]
    );
    const totalOnboarded = onboardedResult?.count || 0;

    // Calculate summary statistics
    const completedAttempts = attempts.filter(a => a.submitted_at);
    const inProgressAttempts = attempts.filter(a => !a.submitted_at);
    const studentsWithAttempts = new Set(attempts.map(a => a.user_id)).size;

    // Students who onboarded but never started an attempt
    const notStarted = totalOnboarded - studentsWithAttempts;

    // Note: PostgreSQL numeric types are returned as strings by the pg driver
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (Number(a.overall) || 0), 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (Number(a.duration_s) || 0), 0) / completedAttempts.length
      : 0;

    // Calculate domain performance
    const domainScores: Record<string, { scores: number[], preScores: number[], postScores: number[] }> = {};
    
    completedAttempts.forEach(attempt => {
      if (attempt.by_domain && Object.keys(attempt.by_domain).length > 0) {
        Object.entries(attempt.by_domain).forEach(([domain, score]) => {
          if (!domainScores[domain]) {
            domainScores[domain] = { scores: [], preScores: [], postScores: [] };
          }
          const numericScore = Number(score) || 0;
          domainScores[domain].scores.push(numericScore);

          if (attempt.attempt_type === 'pre') {
            domainScores[domain].preScores.push(numericScore);
          } else {
            domainScores[domain].postScores.push(numericScore);
          }
        });
      }
    });

    const domainPerformance = Object.entries(domainScores).map(([domain, data]) => {
      // Note: domain scores are stored as percentages (0-100), not decimals
      const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
      const avgPreScore = data.preScores.length > 0 ? data.preScores.reduce((sum, s) => sum + s, 0) / data.preScores.length : 0;
      const avgPostScore = data.postScores.length > 0 ? data.postScores.reduce((sum, s) => sum + s, 0) / data.postScores.length : 0;
      const improvement = avgPostScore - avgPreScore;

      return {
        domain,
        avgScore: avgScore, // Already a percentage
        attemptCount: data.scores.length,
        improvement: improvement // Already a percentage difference
      };
    });

    // Calculate domain and subdomain performance from responses (dynamic calculation)
    const domainSubdomainPerformance = await queryMany<{
      domain: string;
      subdomain: string;
      total_responses: number;
      correct_responses: number;
      avg_score: number;
      item_count: number;
    }>(`
      SELECT
        i.domain,
        i.subdomain,
        COUNT(r.response_id)::int as total_responses,
        COUNT(CASE WHEN r.score = 100 THEN 1 END)::int as correct_responses,
        ROUND(AVG(r.score)::numeric, 1) as avg_score,
        COUNT(DISTINCT i.item_id)::int as item_count
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      JOIN attempts a ON r.attempt_id = a.attempt_id
      WHERE a.course_id = $1
        AND a.submitted_at IS NOT NULL
        AND i.is_scored = true
        AND i.is_anchor = true
        AND r.score IS NOT NULL
      GROUP BY i.domain, i.subdomain
      ORDER BY i.domain, i.subdomain
    `, [targetCourseId]);

    // Group by domain for summary with subdomains
    const domainSummary: Record<string, {
      total: number;
      correct: number;
      avgScore: number;
      subdomains: Array<{ name: string; avgScore: number; count: number; itemCount: number }>;
    }> = {};

    domainSubdomainPerformance.forEach(row => {
      if (!domainSummary[row.domain]) {
        domainSummary[row.domain] = {
          total: 0,
          correct: 0,
          avgScore: 0,
          subdomains: []
        };
      }
      domainSummary[row.domain].total += row.total_responses;
      domainSummary[row.domain].correct += row.correct_responses;
      domainSummary[row.domain].subdomains.push({
        name: row.subdomain,
        avgScore: Number(row.avg_score) || 0,
        count: row.total_responses,
        itemCount: row.item_count
      });
    });

    // Calculate domain averages with short names
    const domainAverages = Object.entries(domainSummary).map(([domain, data]) => {
      const weightedSum = data.subdomains.reduce((sum, s) => sum + (s.avgScore * s.count), 0);
      const totalCount = data.subdomains.reduce((sum, s) => sum + s.count, 0);
      const avgScore = totalCount > 0 ? weightedSum / totalCount : 0;

      const shortNames: Record<string, string> = {
        'Borrowing, Interest Rates, and Financial Numeracy Knowledge': 'Borrowing & Credit',
        'Behavioral and Risk Management Knowledge': 'Risk Management',
        'Risk and Return Knowledge': 'Investment & Risk'
      };

      return {
        domain,
        shortName: shortNames[domain] || domain,
        average: Math.round(avgScore * 10) / 10,
        count: totalCount,
        correctRate: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        subdomains: data.subdomains.sort((a, b) => b.avgScore - a.avgScore)
      };
    });

    // Calculate score distribution
    // Note: scores are stored as percentages (0-100), not decimals (0-1)
    const scoreRanges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '21-40%', min: 21, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-100%', min: 81, max: 100 }
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const count = completedAttempts.filter(attempt => {
        const score = Number(attempt.overall) || 0;
        return score >= range.min && score <= range.max;
      }).length;
      
      return {
        range: range.range,
        count,
        percentage: completedAttempts.length > 0 ? Math.round((count / completedAttempts.length) * 100) : 0
      };
    });

    // Calculate time analysis (last 7 days, 30 days, 90 days)
    const now = new Date();
    const timeAnalysis = [
      {
        period: 'Last 7 days',
        days: 7
      },
      {
        period: 'Last 30 days',
        days: 30
      },
      {
        period: 'Last 90 days',
        days: 90
      }
    ].map(period => {
      const cutoffDate = new Date(now.getTime() - (period.days * 24 * 60 * 60 * 1000));
      const periodAttempts = completedAttempts.filter(attempt => 
        attempt.submitted_at && new Date(attempt.submitted_at) >= cutoffDate
      );
      
      const avgScore = periodAttempts.length > 0
        ? periodAttempts.reduce((sum, a) => sum + (Number(a.overall) || 0), 0) / periodAttempts.length
        : 0;

      return {
        period: period.period,
        attempts: periodAttempts.length,
        avgScore: avgScore // Already a percentage
      };
    });

    // Calculate student progress (pre vs post)
    const studentProgressMap: Record<string, { preScore: number, postScore: number, attempts: number }> = {};
    
    completedAttempts.forEach(attempt => {
      const score = Number(attempt.overall) || 0;

      if (!studentProgressMap[attempt.user_id]) {
        studentProgressMap[attempt.user_id] = { preScore: 0, postScore: 0, attempts: 0 };
      }
      
      studentProgressMap[attempt.user_id].attempts++;
      
      if (attempt.attempt_type === 'pre') {
        studentProgressMap[attempt.user_id].preScore = score;
      } else {
        studentProgressMap[attempt.user_id].postScore = score;
      }
    });

    const studentProgress = Object.entries(studentProgressMap)
      .filter(([_, data]) => data.preScore > 0 && data.postScore > 0)
      .map(([studentId, data]) => ({
        studentId,
        preScore: data.preScore, // Already a percentage
        postScore: data.postScore, // Already a percentage
        improvement: data.postScore - data.preScore, // Already a percentage difference
        attempts: data.attempts
      }))
      .sort((a, b) => b.improvement - a.improvement);

    // ============================================
    // BASELINE COVARIATES (B1-B13) AGGREGATION
    // ============================================
    const profilesQuery = `
      SELECT
        gender,
        race_ethnicity,
        age_range,
        first_language,
        work_experience,
        prior_financial_products,
        self_rated_financial_knowledge,
        financial_stress_frequency,
        parental_education,
        first_generation_college,
        has_student_loan_debt,
        student_loan_interest_rate,
        student_loan_maturity
      FROM student_profiles
      WHERE course_id = ANY($1::uuid[])
    `;

    const profiles = await queryMany<{
      gender: string | null;
      race_ethnicity: string | null;
      age_range: string | null;
      first_language: string | null;
      work_experience: string | null;
      prior_financial_products: string[] | null;
      self_rated_financial_knowledge: string | null;
      financial_stress_frequency: string | null;
      parental_education: string | null;
      first_generation_college: string | null;
      has_student_loan_debt: string | null;
      student_loan_interest_rate: string | null;
      student_loan_maturity: string | null;
    }>(profilesQuery, [filterCourseIds]);

    // Helper to count distribution
    const countDistribution = (values: (string | null)[]): Record<string, number> => {
      const counts: Record<string, number> = {};
      values.forEach(v => {
        const key = v || 'Not specified';
        counts[key] = (counts[key] || 0) + 1;
      });
      return counts;
    };

    // Helper to convert counts to percentage distribution
    const toPercentageDistribution = (counts: Record<string, number>, total: number) => {
      return Object.entries(counts).map(([label, count]) => ({
        label,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      })).sort((a, b) => b.count - a.count);
    };

    const totalProfiles = profiles.length;

    // B1: Gender distribution
    const genderDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.gender)),
      totalProfiles
    );

    // B2: Race/Ethnicity distribution
    const ethnicityDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.race_ethnicity)),
      totalProfiles
    );

    // B3: Age range distribution
    const ageDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.age_range)),
      totalProfiles
    );

    // B4: First language distribution
    const languageDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.first_language)),
      totalProfiles
    );

    // B5: Work experience distribution
    const workExpDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.work_experience)),
      totalProfiles
    );

    // B6: Prior financial products (multi-select, count each product)
    const productCounts: Record<string, number> = {};
    profiles.forEach(p => {
      const products = p.prior_financial_products || [];
      products.forEach(prod => {
        productCounts[prod] = (productCounts[prod] || 0) + 1;
      });
    });
    const financialProductsDist = toPercentageDistribution(productCounts, totalProfiles);

    // B7: Self-rated financial knowledge distribution
    const knowledgeDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.self_rated_financial_knowledge)),
      totalProfiles
    );

    // B8: Financial stress frequency distribution
    const stressDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.financial_stress_frequency)),
      totalProfiles
    );

    // B9: Parental education distribution
    const parentalEdDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.parental_education)),
      totalProfiles
    );

    // B10: First generation college distribution
    const firstGenDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.first_generation_college)),
      totalProfiles
    );

    // B11: Student loan debt distribution
    const loanDebtDist = toPercentageDistribution(
      countDistribution(profiles.map(p => p.has_student_loan_debt)),
      totalProfiles
    );

    // B12: Student loan interest rate (only for those with loans)
    const withLoans = profiles.filter(p => p.has_student_loan_debt === 'yes');
    const loanInterestDist = toPercentageDistribution(
      countDistribution(withLoans.map(p => p.student_loan_interest_rate)),
      withLoans.length
    );

    // B13: Student loan maturity (only for those with loans)
    const loanMaturityDist = toPercentageDistribution(
      countDistribution(withLoans.map(p => p.student_loan_maturity)),
      withLoans.length
    );

    const baselineCovariates = {
      totalProfiles,
      demographics: {
        gender: genderDist,
        raceEthnicity: ethnicityDist,
        ageRange: ageDist,
        firstLanguage: languageDist,
        workExperience: workExpDist
      },
      financialBackground: {
        priorFinancialProducts: financialProductsDist,
        selfRatedKnowledge: knowledgeDist,
        financialStress: stressDist,
        parentalEducation: parentalEdDist,
        firstGenerationCollege: firstGenDist
      },
      studentLoans: {
        hasDebt: loanDebtDist,
        interestRate: loanInterestDist,
        maturity: loanMaturityDist,
        totalWithLoans: withLoans.length
      }
    };

    // ============================================
    // RISK PROFILES
    // ============================================

    // Calculate overconfidence from scores
    const overconfidenceData = completedAttempts
      .filter(a => a.overconfidence_index !== null)
      .map(a => Number(a.overconfidence_index));

    const avgOverconfidence = overconfidenceData.length > 0
      ? overconfidenceData.reduce((sum, v) => sum + v, 0) / overconfidenceData.length
      : null;

    // Categorize overconfidence levels
    // Underconfident: OC < 0 (confidence lower than performance)
    // Well-calibrated: -0.1 <= OC < 0.1 (confidence matches performance)
    // Moderate overconfidence: 0.1 <= OC < 0.3
    // High overconfidence: OC >= 0.3
    const overconfidenceLevels = {
      underconfident: overconfidenceData.filter(v => v < -0.1).length,
      low: overconfidenceData.filter(v => v >= -0.1 && v < 0.1).length,
      moderate: overconfidenceData.filter(v => v >= 0.1 && v < 0.3).length,
      high: overconfidenceData.filter(v => v >= 0.3).length
    };

    // Financial stress risk (Often/Always = high risk)
    const highStressCount = profiles.filter(p =>
      p.financial_stress_frequency === 'often' || p.financial_stress_frequency === 'always'
    ).length;

    // Low knowledge + high stress = at-risk students
    const lowKnowledgeHighStress = profiles.filter(p =>
      (p.self_rated_financial_knowledge === 'very-low' || p.self_rated_financial_knowledge === 'low') &&
      (p.financial_stress_frequency === 'often' || p.financial_stress_frequency === 'always')
    ).length;

    // First-gen with loans = potential risk
    const firstGenWithLoans = profiles.filter(p =>
      p.first_generation_college === 'yes' && p.has_student_loan_debt === 'yes'
    ).length;

    // High interest rate loans (above 10%)
    const highInterestLoans = withLoans.filter(p =>
      p.student_loan_interest_rate === 'above-10'
    ).length;

    // ============================================
    // PREFERENCE QUESTIONS (Q15-Q28) AGGREGATION
    // ============================================

    // Query to get aggregated responses for preference questions (is_scored = false, is_anchor = true)
    const preferenceResponsesQuery = `
      SELECT
        i.item_id,
        i.stem,
        i.subdomain,
        i.options,
        r.raw_answer,
        COUNT(*)::int as count
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      JOIN attempts a ON r.attempt_id = a.attempt_id
      WHERE a.course_id = ANY($1::uuid[])
        AND a.submitted_at IS NOT NULL
        AND i.is_scored = false
        AND i.is_anchor = true
      GROUP BY i.item_id, i.stem, i.subdomain, i.options, r.raw_answer
      ORDER BY (SUBSTRING(i.item_id FROM '(\\d+)')::integer), r.raw_answer
    `;

    const preferenceRawData = await queryMany<{
      item_id: string;
      stem: string;
      subdomain: string;
      options: { id: string; text: string }[];
      raw_answer: string;
      count: number;
    }>(preferenceResponsesQuery, [filterCourseIds]);

    // Group by question and calculate totals/percentages
    const questionMap: Record<string, {
      questionId: string;
      questionText: string;
      category: string;
      options: { id: string; text: string }[];
      responses: { answer: string; answerText: string; count: number; percentage: number }[];
      totalResponses: number;
    }> = {};

    preferenceRawData.forEach(row => {
      if (!questionMap[row.item_id]) {
        questionMap[row.item_id] = {
          questionId: row.item_id,
          questionText: row.stem,
          category: row.subdomain || 'Other',
          options: row.options || [],
          responses: [],
          totalResponses: 0
        };
      }

      // Clean the raw_answer (remove quotes if present)
      const cleanAnswer = String(row.raw_answer).replace(/"/g, '');
      const option = (row.options || []).find((o: { id: string; text: string }) => o.id === cleanAnswer);
      const answerText = option?.text || cleanAnswer;

      questionMap[row.item_id].responses.push({
        answer: cleanAnswer,
        answerText,
        count: row.count,
        percentage: 0 // Will calculate after totals
      });
      questionMap[row.item_id].totalResponses += row.count;
    });

    // Calculate percentages and convert to array
    const preferenceResponses = Object.values(questionMap).map(q => {
      q.responses = q.responses.map(r => ({
        ...r,
        percentage: q.totalResponses > 0 ? Math.round((r.count / q.totalResponses) * 100) : 0
      }));
      return q;
    });

    // ============================================
    // RISK TOLERANCE CATEGORIZATION
    // ============================================
    // Based on Q15 (bonus), Q16 (downturn), Q23 (attitude toward risk)

    let riskToleranceCounts = { conservative: 0, moderate: 0, aggressive: 0 };
    let riskToleranceTotal = 0;

    // Q15: Bonus allocation question
    const q15 = questionMap['Q15'];
    if (q15) {
      q15.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') riskToleranceCounts.conservative += r.count; // Savings
        else if (ans === 'B') riskToleranceCounts.moderate += r.count; // Mutual funds
        else if (ans === 'C' || ans === 'D') riskToleranceCounts.aggressive += r.count; // Stocks or spend
        riskToleranceTotal += r.count;
      });
    }

    // Q16: Market downturn reaction
    const q16 = questionMap['Q16'];
    if (q16) {
      q16.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A' || ans === 'D') riskToleranceCounts.conservative += r.count; // Sell or move to bonds
        else if (ans === 'B') riskToleranceCounts.moderate += r.count; // Hold
        else if (ans === 'C') riskToleranceCounts.aggressive += r.count; // Buy more
        riskToleranceTotal += r.count;
      });
    }

    // Q23: Attitude toward financial risk
    const q23 = questionMap['Q23'];
    if (q23) {
      q23.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') riskToleranceCounts.conservative += r.count; // Avoid risk
        else if (ans === 'B') riskToleranceCounts.moderate += r.count; // Small risks
        else if (ans === 'C' || ans === 'D') riskToleranceCounts.aggressive += r.count; // Calculated or high risks
        riskToleranceTotal += r.count;
      });
    }

    // Normalize to get distribution
    const riskTolerance = {
      conservative: riskToleranceTotal > 0 ? Math.round((riskToleranceCounts.conservative / riskToleranceTotal) * 100) : 0,
      moderate: riskToleranceTotal > 0 ? Math.round((riskToleranceCounts.moderate / riskToleranceTotal) * 100) : 0,
      aggressive: riskToleranceTotal > 0 ? Math.round((riskToleranceCounts.aggressive / riskToleranceTotal) * 100) : 0,
      totalResponses: riskToleranceTotal
    };

    // ============================================
    // BEHAVIORAL INDICATORS
    // ============================================

    // Loss Aversion (Q17, Q18, Q19)
    let lossAversionCounts = { high: 0, moderate: 0, low: 0 };
    let lossAversionTotal = 0;

    // Q17: Loss aversion - selling winners vs losers
    const q17 = questionMap['Q17'];
    if (q17) {
      q17.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') lossAversionCounts.high += r.count; // Sell winners (loss averse)
        else if (ans === 'B') lossAversionCounts.moderate += r.count; // Hold both
        else if (ans === 'C') lossAversionCounts.low += r.count; // Sell losers (not loss averse)
        lossAversionTotal += r.count;
      });
    }

    // Q18: Regret about past decisions
    const q18 = questionMap['Q18'];
    if (q18) {
      q18.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A' || ans === 'B') lossAversionCounts.high += r.count; // Often/sometimes regret
        else if (ans === 'C') lossAversionCounts.moderate += r.count; // Rarely
        else if (ans === 'D') lossAversionCounts.low += r.count; // Never
        lossAversionTotal += r.count;
      });
    }

    // Q19: Reaction to small losses
    const q19 = questionMap['Q19'];
    if (q19) {
      q19.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') lossAversionCounts.high += r.count; // Very upset
        else if (ans === 'B') lossAversionCounts.moderate += r.count; // Somewhat upset
        else if (ans === 'C' || ans === 'D') lossAversionCounts.low += r.count; // Not upset / accept as normal
        lossAversionTotal += r.count;
      });
    }

    const lossAversion = {
      high: lossAversionTotal > 0 ? Math.round((lossAversionCounts.high / lossAversionTotal) * 100) : 0,
      moderate: lossAversionTotal > 0 ? Math.round((lossAversionCounts.moderate / lossAversionTotal) * 100) : 0,
      low: lossAversionTotal > 0 ? Math.round((lossAversionCounts.low / lossAversionTotal) * 100) : 0,
      totalResponses: lossAversionTotal
    };

    // Herding Tendency (Q20, Q21, Q22)
    let herdingCounts = { high: 0, moderate: 0, low: 0 };
    let herdingTotal = 0;

    // Q20: Following friends' investment advice
    const q20 = questionMap['Q20'];
    if (q20) {
      q20.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') herdingCounts.high += r.count; // Always follow
        else if (ans === 'B') herdingCounts.moderate += r.count; // Sometimes
        else if (ans === 'C' || ans === 'D') herdingCounts.low += r.count; // Rarely/never
        herdingTotal += r.count;
      });
    }

    // Q21: Influenced by market trends
    const q21 = questionMap['Q21'];
    if (q21) {
      q21.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') herdingCounts.high += r.count; // Very influenced
        else if (ans === 'B') herdingCounts.moderate += r.count; // Somewhat
        else if (ans === 'C' || ans === 'D') herdingCounts.low += r.count; // Not much/not at all
        herdingTotal += r.count;
      });
    }

    // Q22: Buying popular stocks
    const q22 = questionMap['Q22'];
    if (q22) {
      q22.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') herdingCounts.high += r.count; // Often buy popular
        else if (ans === 'B') herdingCounts.moderate += r.count; // Sometimes
        else if (ans === 'C' || ans === 'D') herdingCounts.low += r.count; // Rarely/do own research
        herdingTotal += r.count;
      });
    }

    const herdingTendency = {
      high: herdingTotal > 0 ? Math.round((herdingCounts.high / herdingTotal) * 100) : 0,
      moderate: herdingTotal > 0 ? Math.round((herdingCounts.moderate / herdingTotal) * 100) : 0,
      low: herdingTotal > 0 ? Math.round((herdingCounts.low / herdingTotal) * 100) : 0,
      totalResponses: herdingTotal
    };

    // Emotional Control (Q24, Q25, Q26)
    let emotionalCounts = { high: 0, moderate: 0, low: 0 };
    let emotionalTotal = 0;

    // Q24: Emotional reactions to market swings
    const q24 = questionMap['Q24'];
    if (q24) {
      q24.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'D') emotionalCounts.high += r.count; // Stay calm (high control)
        else if (ans === 'B' || ans === 'C') emotionalCounts.moderate += r.count; // Some anxiety
        else if (ans === 'A') emotionalCounts.low += r.count; // Very anxious (low control)
        emotionalTotal += r.count;
      });
    }

    // Q25: Impulsive buying decisions
    const q25 = questionMap['Q25'];
    if (q25) {
      q25.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'D') emotionalCounts.high += r.count; // Never impulsive
        else if (ans === 'C') emotionalCounts.moderate += r.count; // Rarely
        else if (ans === 'A' || ans === 'B') emotionalCounts.low += r.count; // Often/sometimes impulsive
        emotionalTotal += r.count;
      });
    }

    // Q26: Delaying gratification
    const q26 = questionMap['Q26'];
    if (q26) {
      q26.responses.forEach(r => {
        const ans = r.answer.toUpperCase();
        if (ans === 'A') emotionalCounts.high += r.count; // Always delay
        else if (ans === 'B') emotionalCounts.moderate += r.count; // Usually
        else if (ans === 'C' || ans === 'D') emotionalCounts.low += r.count; // Sometimes/rarely
        emotionalTotal += r.count;
      });
    }

    const emotionalControl = {
      high: emotionalTotal > 0 ? Math.round((emotionalCounts.high / emotionalTotal) * 100) : 0,
      moderate: emotionalTotal > 0 ? Math.round((emotionalCounts.moderate / emotionalTotal) * 100) : 0,
      low: emotionalTotal > 0 ? Math.round((emotionalCounts.low / emotionalTotal) * 100) : 0,
      totalResponses: emotionalTotal
    };

    const behavioralIndicators = {
      lossAversion,
      herdingTendency,
      emotionalControl
    };

    // Create histogram bins for OC distribution (-0.30 to 0.60 in 0.05 increments)
    // Extended range to properly show underconfident zone (< -10%)
    const ocHistogramBins: Array<{ binStart: number; binEnd: number; count: number }> = [];
    for (let binStart = -0.30; binStart < 0.60; binStart += 0.05) {
      const binEnd = binStart + 0.05;
      const count = overconfidenceData.filter(v => v >= binStart && v < binEnd).length;
      ocHistogramBins.push({
        binStart: Math.round(binStart * 100) / 100,
        binEnd: Math.round(binEnd * 100) / 100,
        count
      });
    }
    // Add underflow bin for values < -0.30
    const underflowCount = overconfidenceData.filter(v => v < -0.30).length;
    if (underflowCount > 0) {
      ocHistogramBins.unshift({ binStart: -0.35, binEnd: -0.30, count: underflowCount });
    }
    // Add overflow bin for values >= 0.60
    const overflowCount = overconfidenceData.filter(v => v >= 0.60).length;
    if (overflowCount > 0) {
      ocHistogramBins.push({ binStart: 0.60, binEnd: 0.65, count: overflowCount });
    }

    const riskProfiles = {
      overconfidence: {
        average: avgOverconfidence !== null ? Math.round(avgOverconfidence * 100) : null,
        distribution: overconfidenceLevels,
        histogram: ocHistogramBins,
        totalMeasured: overconfidenceData.length
      },
      financialStress: {
        highStressCount,
        highStressPercentage: totalProfiles > 0 ? Math.round((highStressCount / totalProfiles) * 100) : 0
      },
      atRiskIndicators: {
        lowKnowledgeHighStress,
        firstGenWithLoans,
        highInterestLoans,
        totalAtRisk: Math.max(lowKnowledgeHighStress, firstGenWithLoans, highInterestLoans)
      },
      riskTolerance,
      behavioralIndicators,
      preferenceResponses
    };

    // ============================================
    // LEARNING GAINS ANALYSIS (RQ1 & RQ2)
    // Using consolidated learning-gains-analysis module
    // ============================================

    // Get students with both pre and post scores
    const studentGains: StudentGainData[] = [];

    // Group attempts by user
    const attemptsByUser: Record<string, typeof completedAttempts> = {};
    completedAttempts.forEach(attempt => {
      if (!attemptsByUser[attempt.user_id]) {
        attemptsByUser[attempt.user_id] = [];
      }
      attemptsByUser[attempt.user_id].push(attempt);
    });

    // Find users with both pre and post
    Object.entries(attemptsByUser).forEach(([userId, userAttempts]) => {
      const preAttempt = userAttempts.find(a => a.attempt_type === 'pre');
      const postAttempt = userAttempts.find(a => a.attempt_type === 'post');

      if (preAttempt && postAttempt && preAttempt.overall !== null && postAttempt.overall !== null) {
        studentGains.push({
          userId,
          preScore: Number(preAttempt.overall),
          postScore: Number(postAttempt.overall),
          preDomains: preAttempt.by_domain || {},
          postDomains: postAttempt.by_domain || {}
        });
      }
    });

    // Query item-level responses for psychometric analysis
    const itemResponsesQuery = `
      SELECT
        r.attempt_id,
        a.user_id,
        i.item_id,
        i.domain,
        CASE WHEN r.score > 0 THEN 1 ELSE 0 END as correct
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      JOIN attempts a ON r.attempt_id = a.attempt_id
      WHERE a.course_id = ANY($1::uuid[])
        AND a.submitted_at IS NOT NULL
        AND i.is_anchor = true
        AND i.is_scored = true
      ORDER BY a.user_id, i.item_id
    `;

    const rawItemResponses = await queryMany<{
      attempt_id: string;
      user_id: string;
      item_id: string;
      domain: string;
      correct: number;
    }>(itemResponsesQuery, [filterCourseIds]);

    // Transform to ItemResponseData format
    const itemResponses: ItemResponseData[] = rawItemResponses.map(r => ({
      attemptId: r.attempt_id,
      userId: r.user_id,
      itemId: r.item_id,
      domain: r.domain,
      correct: r.correct
    }));

    // Count pre/post assessments
    const preAssessmentCount = completedAttempts.filter(a => a.attempt_type === 'pre').length;
    const postAssessmentCount = completedAttempts.filter(a => a.attempt_type === 'post').length;

    // Compute learning gains using consolidated module
    const gainsAnalysis = computeLearningGainsAnalysis({
      studentGains,
      itemResponses,
      preAssessmentCount,
      postAssessmentCount
    });

    // Map to API response format (backward compatible)
    const learningGains = {
      overall: gainsAnalysis.overall,
      byDomain: gainsAnalysis.byDomain.map(d => ({
        domain: d.domain,
        preMean: d.preMean,
        postMean: d.postMean,
        gain: d.gain,
        cohensD: d.cohensD,
        itemCount: d.itemCount
      })),
      distribution: gainsAnalysis.distribution.map(d => ({
        range: d.range,
        count: d.count,
        percentage: d.percentage
      })),
      cronbachAlpha: {
        borrowingCredit: gainsAnalysis.psychometrics.cronbachAlpha.byDomain['Borrowing, Interest Rates, and Financial Numeracy Knowledge'] || { alpha: 0, interpretation: 'no data', itemCount: 0 },
        riskManagement: gainsAnalysis.psychometrics.cronbachAlpha.byDomain['Behavioral and Risk Management Knowledge'] || { alpha: 0, interpretation: 'no data', itemCount: 0 },
        investmentRisk: gainsAnalysis.psychometrics.cronbachAlpha.byDomain['Risk and Return Knowledge'] || { alpha: 0, interpretation: 'no data', itemCount: 0 },
        overall: gainsAnalysis.psychometrics.cronbachAlpha.overall
      },
      efa: {
        loadings: gainsAnalysis.psychometrics.efa.loadings.map(l => ({
          itemId: l.itemId,
          factor1: l.factor1,
          factor2: l.factor2,
          factor3: l.factor3,
          primaryFactor: l.primaryFactor
        })),
        eigenvalues: gainsAnalysis.psychometrics.efa.eigenvalues,
        varianceExplained: gainsAnalysis.psychometrics.efa.varianceExplained,
        warnings: gainsAnalysis.psychometrics.efa.warnings
      },
      sur: gainsAnalysis.heterogeneity.sur,
      sampleWarnings: gainsAnalysis.warnings
    };

    const analytics = {
      summary: {
        totalStudents: totalOnboarded,
        submitted: completedAttempts.length,
        inProgress: inProgressAttempts.length,
        notStarted: notStarted,
        avgScore: Math.round(avgScore), // Already a percentage
        avgDuration: Math.round(avgDuration)
      },
      domainPerformance,
      domainAverages,
      scoreDistribution,
      timeAnalysis,
      studentProgress,
      baselineCovariates,
      riskProfiles,
      learningGains
    };

    console.log('Analytics calculated:', analytics);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({
          id: ic.course_id,
        name: ic.course_name
      })),
      analytics
    });

  } catch (error) {
    console.error('=== INSTRUCTOR ANALYTICS ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

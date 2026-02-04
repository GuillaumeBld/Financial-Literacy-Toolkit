import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

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

    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.overall || 0), 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    // Calculate domain performance
    const domainScores: Record<string, { scores: number[], preScores: number[], postScores: number[] }> = {};
    
    completedAttempts.forEach(attempt => {
      if (attempt.by_domain) {
        Object.entries(attempt.by_domain).forEach(([domain, score]) => {
          if (!domainScores[domain]) {
            domainScores[domain] = { scores: [], preScores: [], postScores: [] };
          }
          domainScores[domain].scores.push(score as number);
          
          if (attempt.attempt_type === 'pre') {
            domainScores[domain].preScores.push(score as number);
          } else {
            domainScores[domain].postScores.push(score as number);
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
        const score = attempt.overall || 0;
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
        ? periodAttempts.reduce((sum, a) => sum + (a.overall || 0), 0) / periodAttempts.length
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
      const score = attempt.overall || 0;
      
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
      .map(a => a.overconfidence_index as number);

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

    const riskProfiles = {
      overconfidence: {
        average: avgOverconfidence !== null ? Math.round(avgOverconfidence * 100) : null,
        distribution: overconfidenceLevels,
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
      }
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
      scoreDistribution,
      timeAnalysis,
      studentProgress,
      baselineCovariates,
      riskProfiles
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

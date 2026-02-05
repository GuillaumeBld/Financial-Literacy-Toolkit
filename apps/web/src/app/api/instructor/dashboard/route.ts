import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== INSTRUCTOR DASHBOARD DATA START ===');
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
      access_level: string;
      course_name: string;
    }>(
      `SELECT ic.course_id, ic.access_level, c.name as course_name
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        stats: null,
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
    const totalStudents = onboardedResult?.count || 0;

    // Calculate aggregate statistics
    const completedAttempts = attempts.filter(a => a.submitted_at);
    const inProgressAttempts = attempts.filter(a => !a.submitted_at);
    const studentsWithAttempts = new Set(attempts.map(a => a.user_id)).size;
    const notStarted = totalStudents - studentsWithAttempts;

    // Note: PostgreSQL numeric columns return strings, so we parse them
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (parseFloat(a.overall as unknown as string) || 0), 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    // Calculate domain and subdomain performance from responses
    // This calculates dynamically from actual response data rather than relying on pre-computed by_domain
    const domainPerformance = await queryMany<{
      domain: string;
      subdomain: string;
      total_responses: number;
      correct_responses: number;
      avg_score: number;
    }>(`
      SELECT
        i.domain,
        i.subdomain,
        COUNT(r.response_id)::int as total_responses,
        COUNT(CASE WHEN r.score = 100 THEN 1 END)::int as correct_responses,
        ROUND(AVG(r.score)::numeric, 1) as avg_score
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

    // Group by domain for summary
    const domainSummary: Record<string, {
      total: number;
      correct: number;
      avgScore: number;
      subdomains: Array<{ name: string; avgScore: number; count: number }>;
    }> = {};

    domainPerformance.forEach(row => {
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
        count: row.total_responses
      });
    });

    // Calculate domain averages
    const domainAverages = Object.entries(domainSummary).map(([domain, data]) => {
      // Calculate weighted average from subdomains
      const weightedSum = data.subdomains.reduce((sum, s) => sum + (s.avgScore * s.count), 0);
      const totalCount = data.subdomains.reduce((sum, s) => sum + s.count, 0);
      const avgScore = totalCount > 0 ? weightedSum / totalCount : 0;

      // Map to short names for display
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


    // Get student status breakdown (including onboarded students with no attempts)
    const studentStatus = await queryMany<{
      status: string;
      count: number;
      avg_score: number | null;
      avg_responses: number;
      min_hours_stale: number | null;
      max_hours_stale: number | null;
    }>(`
      SELECT * FROM (
        -- Attempt-based statuses
        WITH attempt_data AS (
          SELECT
            a.attempt_id,
            a.submitted_at,
            a.metadata->>'submission_type' as sub_type,
            s.overall,
            COALESCE(r.resp_count, 0) as resp_count,
            -- Time since last activity (last response saved, or started_at if no responses)
            EXTRACT(EPOCH FROM (NOW() - COALESCE(lr.last_response, a.started_at))) / 3600 as hours_stale
          FROM attempts a
          LEFT JOIN scores s ON s.attempt_id = a.attempt_id
          LEFT JOIN (SELECT attempt_id, COUNT(*) as resp_count FROM responses GROUP BY attempt_id) r
            ON r.attempt_id = a.attempt_id
          LEFT JOIN (SELECT attempt_id, MAX(created_at) as last_response FROM responses GROUP BY attempt_id) lr
            ON lr.attempt_id = a.attempt_id
          WHERE a.course_id = $1
        )
        SELECT
          CASE
            WHEN submitted_at IS NOT NULL AND sub_type = 'partial_legacy' THEN 'Submitted (Legacy 46)'
            WHEN submitted_at IS NOT NULL AND sub_type = 'complete_legacy' THEN 'Submitted (Legacy 50)'
            WHEN submitted_at IS NOT NULL AND sub_type = 'incomplete_sdm_legacy' THEN 'Submitted (Partial SDM)'
            WHEN submitted_at IS NOT NULL THEN 'Submitted (Normal)'
            WHEN resp_count < 10 THEN 'In Progress: Early (1-9)'
            WHEN resp_count < 20 THEN 'In Progress: Mid (10-19)'
            WHEN resp_count < 40 THEN 'In Progress: Anchor (20-39)'
            WHEN resp_count = 40 THEN 'In Progress: Anchors Done'
            ELSE 'In Progress: SDM (41-50)'
          END as status,
          COUNT(*)::int as count,
          ROUND(AVG(overall)::numeric, 1) as avg_score,
          ROUND(AVG(resp_count))::int as avg_responses,
          -- Min/Max hours stale (only for in-progress, NULL for submitted)
          ROUND(MIN(CASE WHEN submitted_at IS NULL THEN hours_stale ELSE NULL END)::numeric, 1) as min_hours_stale,
          ROUND(MAX(CASE WHEN submitted_at IS NULL THEN hours_stale ELSE NULL END)::numeric, 1) as max_hours_stale
        FROM attempt_data
        GROUP BY 1

        UNION ALL

        -- Onboarded students with no attempts
        SELECT
          'Onboarded' as status,
          COUNT(*)::int as count,
          NULL::numeric as avg_score,
          0 as avg_responses,
          -- Min/Max hours since onboarding
          ROUND(MIN(EXTRACT(EPOCH FROM (NOW() - sp.created_at)) / 3600)::numeric, 1) as min_hours_stale,
          ROUND(MAX(EXTRACT(EPOCH FROM (NOW() - sp.created_at)) / 3600)::numeric, 1) as max_hours_stale
        FROM student_profiles sp
        WHERE sp.course_id = $1
          AND NOT EXISTS (
            SELECT 1 FROM attempts a
            WHERE a.user_id = sp.user_id AND a.course_id = sp.course_id
          )
        HAVING COUNT(*) > 0
      ) sub
      ORDER BY
        CASE
          WHEN status LIKE 'Submitted%' THEN 0
          WHEN status LIKE 'In Progress%' THEN 1
          ELSE 2
        END,
        avg_responses DESC NULLS LAST
    `, [targetCourseId]);

    const stats = {
      totalStudents,
      submitted: completedAttempts.length,
      inProgress: inProgressAttempts.length,
      notStarted,
      avgScore: Math.round(avgScore * 100) / 100,
      avgDuration: Math.round(avgDuration),
      domainAverages,
      studentStatus
    };

    console.log('Dashboard stats calculated:', stats);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({
        id: ic.course_id,
        name: ic.course_name,
        accessLevel: ic.access_level
      })),
      stats,
      recentAttempts: attempts.slice(0, 10)
    });

  } catch (error) {
    console.error('=== INSTRUCTOR DASHBOARD ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

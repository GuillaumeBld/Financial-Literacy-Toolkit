import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

export const dynamic = 'force-dynamic';

const SHORT_NAMES: Record<string, string> = {
  'Borrowing, Interest Rates, and Financial Numeracy Knowledge': 'Borrowing & Credit',
  'Behavioral and Risk Management Knowledge': 'Risk Management',
  'Risk and Return Knowledge': 'Investment & Risk',
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get instructor's courses
    const instructorCourses = await queryMany<{
      course_id: string;
      access_level: string;
      course_name: string;
      term: string;
    }>(
      `SELECT ic.course_id, ic.access_level, c.name as course_name, c.term
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({ stats: null, courses: [], message: 'No courses assigned' });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);
    const targetCourseId = courseId || courseIds[0];

    if (!courseIds.includes(targetCourseId)) {
      return NextResponse.json({ error: 'Invalid course ID or access denied' }, { status: 403 });
    }

    // ── Run all queries in parallel ──
    const [
      enrolledCount,
      attemptCounts,
      scoreStats,
      domainRows,
      subdomainRows,
      studentStatusRows,
    ] = await Promise.all([
      // Q1: Total enrolled students
      queryOne<{ count: number }>(
        `SELECT COUNT(*)::int as count FROM enrollments
         WHERE course_id = $1 AND role = 'student'`,
        [targetCourseId]
      ),

      // Q2: Attempt counts (submitted, in-progress, active now)
      queryOne<{
        submitted: number;
        in_progress: number;
        active_now: number;
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE submitted_at IS NOT NULL)::int as submitted,
           COUNT(*) FILTER (WHERE submitted_at IS NULL)::int as in_progress,
           COUNT(*) FILTER (
             WHERE submitted_at IS NULL
             AND attempt_id IN (
               SELECT DISTINCT attempt_id FROM responses
               WHERE created_at > NOW() - INTERVAL '30 minutes'
             )
           )::int as active_now
         FROM attempts WHERE course_id = $1`,
        [targetCourseId]
      ),

      // Q3: Score and duration stats
      queryOne<{ avg_score: number; avg_duration: number }>(
        `SELECT
           ROUND(AVG(s.overall)::numeric, 1) as avg_score,
           ROUND(AVG(a.duration_s)::numeric, 0) as avg_duration
         FROM scores s
         JOIN attempts a ON s.attempt_id = a.attempt_id
         WHERE a.course_id = $1 AND a.submitted_at IS NOT NULL`,
        [targetCourseId]
      ),

      // Q4: Domain-level averages
      queryMany<{
        domain: string;
        total: number;
        correct: number;
        item_count: number;
      }>(
        `SELECT i.domain,
           COUNT(r.response_id)::int as total,
           COUNT(CASE WHEN r.score = 100 THEN 1 END)::int as correct,
           COUNT(DISTINCT i.item_id)::int as item_count
         FROM items i
         JOIN responses r ON i.item_id = r.item_id
         JOIN attempts a ON r.attempt_id = a.attempt_id
         WHERE i.is_anchor = true AND i.is_scored = true
           AND a.course_id = $1 AND a.submitted_at IS NOT NULL
         GROUP BY i.domain`,
        [targetCourseId]
      ),

      // Q5: Subdomain-level averages
      queryMany<{
        domain: string;
        subdomain: string;
        total: number;
        correct: number;
        item_count: number;
      }>(
        `SELECT i.domain, i.subdomain,
           COUNT(r.response_id)::int as total,
           COUNT(CASE WHEN r.score = 100 THEN 1 END)::int as correct,
           COUNT(DISTINCT i.item_id)::int as item_count
         FROM items i
         JOIN responses r ON i.item_id = r.item_id
         JOIN attempts a ON r.attempt_id = a.attempt_id
         WHERE i.is_anchor = true AND i.is_scored = true
           AND a.course_id = $1 AND a.submitted_at IS NOT NULL
         GROUP BY i.domain, i.subdomain`,
        [targetCourseId]
      ),

      // Q6: Student status breakdown with staleness
      queryMany<{
        status: string;
        count: number;
        active_count: number;
        avg_score: number | null;
        avg_responses: number;
        min_hours_stale: number | null;
        max_hours_stale: number | null;
      }>(
        `WITH student_data AS (
           -- Submitted students
           SELECT
             a.user_id,
             CASE
               WHEN EXISTS (
                 SELECT 1 FROM responses r2
                 JOIN items i2 ON r2.item_id = i2.item_id
                 WHERE r2.attempt_id = a.attempt_id
                 AND i2.variant_type IN ('Open_Diagnose', 'Open_Confirm')
               ) THEN 'Submitted (with SDM)'
               ELSE 'Submitted (anchor only)'
             END as status,
             s.overall as score,
             (SELECT COUNT(*)::int FROM responses WHERE attempt_id = a.attempt_id) as response_count,
             EXTRACT(EPOCH FROM (NOW() - a.submitted_at)) / 3600.0 as hours_stale,
             0::int as is_active
           FROM attempts a
           LEFT JOIN scores s ON a.attempt_id = s.attempt_id
           WHERE a.course_id = $1 AND a.submitted_at IS NOT NULL

           UNION ALL

           -- In-progress students
           SELECT
             a.user_id,
             'In Progress' as status,
             NULL as score,
             (SELECT COUNT(*)::int FROM responses WHERE attempt_id = a.attempt_id) as response_count,
             EXTRACT(EPOCH FROM (NOW() - COALESCE(
               (SELECT MAX(r3.created_at) FROM responses r3 WHERE r3.attempt_id = a.attempt_id),
               a.started_at
             ))) / 3600.0 as hours_stale,
             CASE WHEN EXISTS (
               SELECT 1 FROM responses r4
               WHERE r4.attempt_id = a.attempt_id
               AND r4.created_at > NOW() - INTERVAL '30 minutes'
             ) THEN 1 ELSE 0 END as is_active
           FROM attempts a
           WHERE a.course_id = $1 AND a.submitted_at IS NULL

           UNION ALL

           -- Onboarded but not started
           SELECT
             e.user_id,
             'Onboarded (not started)' as status,
             NULL as score,
             0 as response_count,
             EXTRACT(EPOCH FROM (NOW() - e.created_at)) / 3600.0 as hours_stale,
             0 as is_active
           FROM enrollments e
           WHERE e.course_id = $1 AND e.role = 'student'
           AND NOT EXISTS (
             SELECT 1 FROM attempts a WHERE a.user_id = e.user_id AND a.course_id = $1
           )
         )
         SELECT
           status,
           COUNT(*)::int as count,
           SUM(is_active)::int as active_count,
           ROUND(AVG(score)::numeric, 1) as avg_score,
           ROUND(AVG(response_count)::numeric, 0) as avg_responses,
           ROUND(MIN(hours_stale)::numeric, 1) as min_hours_stale,
           ROUND(MAX(hours_stale)::numeric, 1) as max_hours_stale
         FROM student_data
         GROUP BY status
         ORDER BY
           CASE
             WHEN status LIKE 'Submitted%' THEN 1
             WHEN status LIKE 'In Progress%' THEN 2
             ELSE 3
           END, status`,
        [targetCourseId]
      ),
    ]);

    const totalStudents = enrolledCount?.count || 0;
    const submitted = attemptCounts?.submitted || 0;
    const inProgress = attemptCounts?.in_progress || 0;
    const activeNow = attemptCounts?.active_now || 0;
    const notStarted = totalStudents - submitted - inProgress;

    // Build domain averages with subdomains
    const subdomainsByDomain: Record<string, Array<{ name: string; avgScore: number; count: number }>> = {};
    for (const row of subdomainRows) {
      const shortName = SHORT_NAMES[row.domain] || row.domain;
      if (!subdomainsByDomain[shortName]) subdomainsByDomain[shortName] = [];
      subdomainsByDomain[shortName].push({
        name: row.subdomain,
        avgScore: row.total > 0 ? Math.round(row.correct / row.total * 1000) / 10 : 0,
        count: row.item_count,
      });
    }

    const domainAverages = domainRows.map(row => {
      const shortName = SHORT_NAMES[row.domain] || row.domain;
      const correctRate = row.total > 0 ? Math.round(row.correct / row.total * 1000) / 10 : 0;
      return {
        domain: row.domain,
        shortName,
        average: correctRate,
        count: row.item_count,
        correctRate,
        subdomains: subdomainsByDomain[shortName] || [],
      };
    });

    const stats = {
      totalStudents,
      submitted,
      inProgress,
      activeNow,
      notStarted: Math.max(0, notStarted),
      avgScore: Number(scoreStats?.avg_score) || 0,
      avgDuration: Number(scoreStats?.avg_duration) || 0,
      domainAverages,
      studentStatus: studentStatusRows.map(row => ({
        ...row,
        avg_score: row.avg_score ? Number(row.avg_score) : null,
        avg_responses: Number(row.avg_responses) || 0,
        min_hours_stale: row.min_hours_stale ? Number(row.min_hours_stale) : null,
        max_hours_stale: row.max_hours_stale ? Number(row.max_hours_stale) : null,
      })),
    };

    return NextResponse.json({
      stats,
      courses: instructorCourses.map(ic => ({
        id: ic.course_id,
        name: ic.course_name,
        term: ic.term,
        accessLevel: ic.access_level,
      })),
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

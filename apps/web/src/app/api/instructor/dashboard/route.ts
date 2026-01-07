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

    // Calculate aggregate statistics
    const totalAttempts = attempts.length;
    const preAttempts = attempts.filter(a => a.attempt_type === 'pre');
    const postAttempts = attempts.filter(a => a.attempt_type === 'post');

    const completedAttempts = attempts.filter(a => a.submitted_at);
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.overall || 0), 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    // Calculate domain-specific averages
    const domainScores: Record<string, number[]> = {};
    completedAttempts.forEach(attempt => {
      if (attempt.by_domain) {
        Object.entries(attempt.by_domain).forEach(([domain, score]) => {
          if (!domainScores[domain]) {
            domainScores[domain] = [];
          }
          domainScores[domain].push(score as number);
        });
      }
    });

    const domainAverages = Object.entries(domainScores).map(([domain, scores]) => ({
      domain,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
      count: scores.length
    }));

    // Get unique students
    const uniqueStudents = new Set(attempts.map(a => a.user_id)).size;

    const stats = {
      totalAttempts,
      preAttempts: preAttempts.length,
      postAttempts: postAttempts.length,
      completedAttempts: completedAttempts.length,
      uniqueStudents,
      avgScore: Math.round(avgScore * 100) / 100,
      avgDuration: Math.round(avgDuration),
      domainAverages
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

import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== INSTRUCTOR SUBMISSIONS DATA START ===');
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
        submissions: [],
        message: 'No courses assigned'
      });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);

    // Get all submissions for instructor's courses
    const submissions = await queryMany<{
      attempt_id: string;
      user_id: string;
      course_id: string;
      attempt_type: string;
      submitted_at: string | null;
      duration_s: number | null;
      hashed_student_key: string;
      course_name: string;
      overall: number | null;
      by_domain: any;
      overconfidence_index: number | null;
    }>(
      `SELECT 
        a.attempt_id,
        a.user_id,
        a.course_id,
        a.attempt_type,
        a.submitted_at,
        a.duration_s,
        u.hashed_student_key,
        c.name as course_name,
        s.overall,
        s.by_domain,
        s.overconfidence_index
      FROM attempts a
      JOIN users u ON a.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN scores s ON a.attempt_id = s.attempt_id
      WHERE a.course_id = ANY($1::uuid[])
        AND a.submitted_at IS NOT NULL
      ORDER BY a.submitted_at DESC`,
      [courseIds]
    );

    // Transform the data for easier consumption
    const transformedSubmissions = submissions.map(submission => ({
        attempt_id: submission.attempt_id,
        user_id: submission.user_id,
      hashed_student_key: submission.hashed_student_key || 'Unknown',
        course_id: submission.course_id,
      course_name: submission.course_name || 'Unknown Course',
        attempt_type: submission.attempt_type,
        submitted_at: submission.submitted_at,
        duration_s: submission.duration_s || 0,
      overall_score: submission.overall || 0,
      overconfidence_index: submission.overconfidence_index || 0,
      domain_scores: submission.by_domain || {}
    }));

    console.log('Submissions loaded:', transformedSubmissions.length);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({
          id: ic.course_id,
        name: ic.course_name
      })),
      submissions: transformedSubmissions
    });

  } catch (error) {
    console.error('=== INSTRUCTOR SUBMISSIONS ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

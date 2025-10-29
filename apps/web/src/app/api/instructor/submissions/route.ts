import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Verify instructor session token
async function verifyInstructorToken(token: string) {
  const { data: session, error } = await supabase
    .from('instructor_sessions')
    .select('instructor_id, expires_at')
    .eq('token_hash', token)
    .single();

  if (error || !session) {
    return null;
  }

  // Check if session expired
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session.instructor_id;
}

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
    const { data: instructorCourses } = await supabase
      .from('instructor_courses')
      .select('course_id, courses(course_id, name)')
      .eq('instructor_id', instructorId);

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
    const { data: submissions, error: submissionsError } = await supabase
      .from('attempts')
      .select(`
        attempt_id,
        user_id,
        course_id,
        attempt_type,
        submitted_at,
        duration_s,
        users(hashed_student_key),
        courses(name),
        scores(overall, by_domain, overconfidence_index)
      `)
      .in('course_id', courseIds)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Transform the data for easier consumption
    const transformedSubmissions = submissions?.map(submission => {
      const scoreData = Array.isArray(submission.scores) ? submission.scores[0] : submission.scores;
      const userData = Array.isArray(submission.users) ? submission.users[0] : submission.users;
      const courseData = Array.isArray(submission.courses) ? submission.courses[0] : submission.courses;

      return {
        attempt_id: submission.attempt_id,
        user_id: submission.user_id,
        hashed_student_key: userData?.hashed_student_key || 'Unknown',
        course_id: submission.course_id,
        course_name: courseData?.name || 'Unknown Course',
        attempt_type: submission.attempt_type,
        submitted_at: submission.submitted_at,
        duration_s: submission.duration_s || 0,
        overall_score: scoreData?.overall || 0,
        overconfidence_index: scoreData?.overconfidence_index || 0,
        domain_scores: scoreData?.by_domain || {}
      };
    }) || [];

    console.log('Submissions loaded:', transformedSubmissions.length);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({
        id: ic.course_id,
        name: ic.courses?.name || 'Unknown Course'
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

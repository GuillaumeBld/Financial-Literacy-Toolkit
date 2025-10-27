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
    const { data: instructorCourses } = await supabase
      .from('instructor_courses')
      .select('course_id, access_level, courses(course_id, name, term)')
      .eq('instructor_id', instructorId);

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

    // Get all attempts for the course(s)
    let attemptsQuery = supabase
      .from('attempts')
      .select(`
        attempt_id,
        user_id,
        course_id,
        attempt_type,
        submitted_at,
        duration_s,
        scores(overall, by_domain, overconfidence_index)
      `);

    if (courseId) {
      attemptsQuery = attemptsQuery.eq('course_id', courseId);
    } else {
      attemptsQuery = attemptsQuery.in('course_id', courseIds);
    }

    const { data: attempts, error: attemptsError } = await attemptsQuery;

    if (attemptsError) {
      console.error('Error fetching attempts:', attemptsError);
      return NextResponse.json(
        { error: 'Failed to fetch attempts' },
        { status: 500 }
      );
    }

    // Calculate aggregate statistics
    const totalAttempts = attempts?.length || 0;
    const preAttempts = attempts?.filter(a => a.attempt_type === 'pre') || [];
    const postAttempts = attempts?.filter(a => a.attempt_type === 'post') || [];

    const completedAttempts = attempts?.filter(a => a.submitted_at) || [];
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => {
          const scoreData = Array.isArray(a.scores) ? a.scores[0] : a.scores;
          return sum + (scoreData?.overall || 0);
        }, 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    // Calculate domain-specific averages
    const domainScores: Record<string, number[]> = {};
    completedAttempts.forEach(attempt => {
      const scoreData = Array.isArray(attempt.scores) ? attempt.scores[0] : attempt.scores;
      if (scoreData?.by_domain) {
        Object.entries(scoreData.by_domain).forEach(([domain, score]) => {
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
    const uniqueStudents = new Set(attempts?.map(a => a.user_id)).size;

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
        ...ic.courses,
        accessLevel: ic.access_level
      })),
      stats,
      recentAttempts: attempts?.slice(0, 10) || []
    });

  } catch (error) {
    console.error('=== INSTRUCTOR DASHBOARD ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

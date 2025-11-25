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
    const { data: instructorCourses } = await supabase
      .from('instructor_courses')
      .select('course_id, courses(course_id, name)')
      .eq('instructor_id', instructorId);

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

    // Get all attempts for analysis
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

    // Calculate summary statistics
    const totalAttempts = attempts?.length || 0;
    const completedAttempts = attempts?.filter(a => a.submitted_at) || [];
    const uniqueStudents = new Set(attempts?.map(a => a.user_id)).size;
    
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => {
          const scoreData = Array.isArray(a.scores) ? a.scores[0] : a.scores;
          return sum + (scoreData?.overall || 0);
        }, 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    const completionRate = totalAttempts > 0 ? (completedAttempts.length / totalAttempts) * 100 : 0;

    // Calculate domain performance
    const domainScores: Record<string, { scores: number[], preScores: number[], postScores: number[] }> = {};
    
    completedAttempts.forEach(attempt => {
      const scoreData = Array.isArray(attempt.scores) ? attempt.scores[0] : attempt.scores;
      if (scoreData?.by_domain) {
        Object.entries(scoreData.by_domain).forEach(([domain, score]) => {
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
      const avgScore = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
      const avgPreScore = data.preScores.length > 0 ? data.preScores.reduce((sum, s) => sum + s, 0) / data.preScores.length : 0;
      const avgPostScore = data.postScores.length > 0 ? data.postScores.reduce((sum, s) => sum + s, 0) / data.postScores.length : 0;
      const improvement = avgPostScore - avgPreScore;

      return {
        domain,
        avgScore: avgScore * 100,
        attemptCount: data.scores.length,
        improvement: improvement * 100
      };
    });

    // Calculate score distribution
    const scoreRanges = [
      { range: '0-20%', min: 0, max: 0.2 },
      { range: '21-40%', min: 0.21, max: 0.4 },
      { range: '41-60%', min: 0.41, max: 0.6 },
      { range: '61-80%', min: 0.61, max: 0.8 },
      { range: '81-100%', min: 0.81, max: 1.0 }
    ];

    const scoreDistribution = scoreRanges.map(range => {
      const count = completedAttempts.filter(attempt => {
        const scoreData = Array.isArray(attempt.scores) ? attempt.scores[0] : attempt.scores;
        const score = scoreData?.overall || 0;
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
        new Date(attempt.submitted_at) >= cutoffDate
      );
      
      const avgScore = periodAttempts.length > 0
        ? periodAttempts.reduce((sum, a) => {
            const scoreData = Array.isArray(a.scores) ? a.scores[0] : a.scores;
            return sum + (scoreData?.overall || 0);
          }, 0) / periodAttempts.length
        : 0;

      return {
        period: period.period,
        attempts: periodAttempts.length,
        avgScore: avgScore * 100
      };
    });

    // Calculate student progress (pre vs post)
    const studentProgressMap: Record<string, { preScore: number, postScore: number, attempts: number }> = {};
    
    completedAttempts.forEach(attempt => {
      const scoreData = Array.isArray(attempt.scores) ? attempt.scores[0] : attempt.scores;
      const score = scoreData?.overall || 0;
      
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
        preScore: data.preScore * 100,
        postScore: data.postScore * 100,
        improvement: (data.postScore - data.preScore) * 100,
        attempts: data.attempts
      }))
      .sort((a, b) => b.improvement - a.improvement);

    const analytics = {
      summary: {
        totalStudents: uniqueStudents,
        totalAttempts,
        avgScore: Math.round(avgScore * 100),
        avgDuration: Math.round(avgDuration),
        completionRate: Math.round(completionRate)
      },
      domainPerformance,
      scoreDistribution,
      timeAnalysis,
      studentProgress
    };

    console.log('Analytics calculated:', analytics);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => {
        const courseName = Array.isArray(ic.courses) && ic.courses.length > 0
          ? ic.courses[0]?.name
          : undefined;

        return {
          id: ic.course_id,
          name: courseName || 'Unknown Course'
        };
      }),
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

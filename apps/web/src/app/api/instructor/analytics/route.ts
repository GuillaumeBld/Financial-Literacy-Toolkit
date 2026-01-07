import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
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

    // Get all attempts for analysis
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
    }>(attemptsQuery, [courseIds]);

    // Calculate summary statistics
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.submitted_at);
    const uniqueStudents = new Set(attempts.map(a => a.user_id)).size;
    
    const avgScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.overall || 0), 0) / completedAttempts.length
      : 0;

    const avgDuration = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.duration_s || 0), 0) / completedAttempts.length
      : 0;

    const completionRate = totalAttempts > 0 ? (completedAttempts.length / totalAttempts) * 100 : 0;

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
        avgScore: avgScore * 100
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

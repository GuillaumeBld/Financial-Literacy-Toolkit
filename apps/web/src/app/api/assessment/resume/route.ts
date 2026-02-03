import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!attemptId && (!userId || !courseId)) {
      return NextResponse.json(
        { error: 'Either attemptId or both userId and courseId are required' },
        { status: 400 }
      );
    }

    let attempt;

    if (attemptId) {
      // Get specific attempt
      attempt = await query(
        `SELECT attempt_id, user_id, course_id, attempt_type, started_at, submitted_at
         FROM attempts WHERE attempt_id = $1`,
        [attemptId]
      );
    } else {
      // Get latest attempt for user/course (prioritize in-progress, then completed)
      attempt = await query(
        `SELECT attempt_id, user_id, course_id, attempt_type, started_at, submitted_at
         FROM attempts
         WHERE user_id = $1 AND course_id = $2
         ORDER BY
           CASE WHEN submitted_at IS NULL THEN 0 ELSE 1 END,
           started_at DESC
         LIMIT 1`,
        [userId, courseId]
      );
    }

    if (!attempt.rows || attempt.rows.length === 0) {
      return NextResponse.json({
        success: true,
        hasAttempt: false,
        attempt: null,
        responses: [],
      });
    }

    const attemptData = attempt.rows[0];

    // Get all responses for this attempt
    const responses = await query(
      `SELECT r.response_id, r.item_id, r.raw_answer, r.score, r.confidence,
              i.stem, i.type, i.domain, i.key, i.options, i.is_scored, i.external_item_id
       FROM responses r
       JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = $1
       ORDER BY r.created_at ASC`,
      [attemptData.attempt_id]
    );

    return NextResponse.json({
      success: true,
      hasAttempt: true,
      attempt: {
        attemptId: attemptData.attempt_id,
        attemptType: attemptData.attempt_type,
        startedAt: attemptData.started_at,
        isSubmitted: !!attemptData.submitted_at,
      },
      responses: responses.rows.map((r: any) => ({
        itemId: r.item_id,
        answer: r.raw_answer,
        confidence: r.confidence,
        score: r.score,
        isScored: r.is_scored,
        domain: r.domain,
      })),
    });
  } catch (error: any) {
    console.error('Error getting resume data:', error);

    // User-friendly error messages
    let userMessage = 'Failed to get resume data';
    if (
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('SASL') ||
      error.message?.includes('connect') ||
      error.message?.includes('timeout')
    ) {
      userMessage = 'Service temporarily unavailable';
    } else if (error.message?.includes('invalid input syntax')) {
      userMessage = 'Invalid request parameters';
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

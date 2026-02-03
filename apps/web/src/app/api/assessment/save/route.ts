import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limit save requests
    const rateLimit = await checkRateLimit(request, RATE_LIMITS.SUBMIT, 'save');
    if (!rateLimit.allowed) {
      return rateLimit.response;
    }

    const body = await request.json();
    const { userId, courseId, attemptId, responses, currentIndex, sessionToken } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses to save' },
        { status: 400 }
      );
    }

    const result = await transaction(async (client) => {
      let activeAttemptId = attemptId;
      let activeSessionToken = sessionToken;

      // If no attemptId, find or create an attempt
      if (!activeAttemptId) {
        // Check for existing in-progress attempt
        const existingAttempt = await client.query(
          `SELECT attempt_id, session_token FROM attempts
           WHERE user_id = $1 AND course_id = $2 AND submitted_at IS NULL
           ORDER BY started_at DESC LIMIT 1`,
          [userId, courseId]
        );

        if (existingAttempt.rows.length > 0) {
          activeAttemptId = existingAttempt.rows[0].attempt_id;
          // Validate session token if attempt exists
          const dbToken = existingAttempt.rows[0].session_token;
          if (dbToken && sessionToken && dbToken !== sessionToken) {
            throw new Error('SESSION_CONFLICT');
          }
        } else {
          // Create new attempt with session token
          const newSessionToken = randomUUID();
          const newAttempt = await client.query(
            `INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, started_at, session_token, session_created_at)
             VALUES ($1, $2, (SELECT instrument_id FROM instruments LIMIT 1), 'pre', NOW(), $3, NOW())
             RETURNING attempt_id`,
            [userId, courseId, newSessionToken]
          );
          activeAttemptId = newAttempt.rows[0].attempt_id;
          activeSessionToken = newSessionToken;
        }
      } else {
        // Validate session token for provided attemptId
        if (sessionToken) {
          const attemptCheck = await client.query(
            `SELECT session_token FROM attempts WHERE attempt_id = $1`,
            [attemptId]
          );
          if (attemptCheck.rows.length > 0) {
            const dbToken = attemptCheck.rows[0].session_token;
            if (dbToken && dbToken !== sessionToken) {
              throw new Error('SESSION_CONFLICT');
            }
          }
        }
      }

      // Filter valid responses
      const validResponses = responses.filter(
        (r: any) => r.itemId && r.answer !== undefined
      );

      if (validResponses.length > 0) {
        // Collect arrays for bulk upsert (single query instead of N individual UPSERTs)
        const itemIds = validResponses.map((r: any) => r.itemId);
        const rawAnswers = validResponses.map((r: any) => JSON.stringify(r.answer));
        const confidences = validResponses.map((r: any) => r.confidence || null);
        const scores = validResponses.map((r: any) => r.score ?? null);

        // Single bulk upsert using UNNEST
        await client.query(
          `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence, score, created_at)
           SELECT $1, unnest($2::text[]), unnest($3::jsonb[]), unnest($4::int[]), unnest($5::numeric[]), NOW()
           ON CONFLICT (attempt_id, item_id)
           DO UPDATE SET raw_answer = EXCLUDED.raw_answer, confidence = EXCLUDED.confidence, score = EXCLUDED.score`,
          [activeAttemptId, itemIds, rawAnswers, confidences, scores]
        );
      }

      // Save current progress index in attempt metadata (using a separate field or JSON)
      // For now, we'll track progress by counting responses
      const progressCount = await client.query(
        `SELECT COUNT(*) as answered FROM responses WHERE attempt_id = $1`,
        [activeAttemptId]
      );

      return {
        attemptId: activeAttemptId,
        savedCount: responses.length,
        totalAnswered: parseInt(progressCount.rows[0].answered),
        currentIndex: currentIndex,
        sessionToken: activeSessionToken,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error saving progress:', error);

    // Handle session conflict (multi-tab detection)
    if (error.message === 'SESSION_CONFLICT') {
      return NextResponse.json(
        {
          error: 'Session expired. This assessment is open in another browser tab or window. Please close this tab and continue in the other window.',
          code: 'SESSION_CONFLICT'
        },
        { status: 409 }
      );
    }

    // User-friendly error messages
    let userMessage = 'Failed to save progress';
    if (
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('SASL') ||
      error.message?.includes('connect')
    ) {
      userMessage = 'Service temporarily unavailable. Your progress is saved locally.';
    }

    return NextResponse.json(
      { error: userMessage },
      { status: 500 }
    );
  }
}

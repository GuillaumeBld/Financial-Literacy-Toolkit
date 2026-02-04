import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';
import { submissionBreaker } from '@/lib/circuit-breaker';
import { checkStudentRateLimit, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  console.log('=== API SUBMISSION START ===');
  try {
    // Apply IP-based rate limiting first (before parsing body)
    const ipRateLimit = await checkRateLimit(request, RATE_LIMITS.SUBMIT, 'submit-ip');
    if (!ipRateLimit.allowed) {
      console.warn('Rate limit exceeded for IP');
      return ipRateLimit.response;
    }

    const body = await request.json();
    console.log('Request body received:', {
      courseCode: body.courseCode,
      studentId: body.studentId,
      attemptType: body.attemptType,
      responsesCount: body.responses?.length,
      timeSpent: body.timeSpent
    });

    const {
      courseCode,
      studentId,
      attemptType, // 'pre' or 'post'
      responses, // Array of { itemId, answer, confidence }
      timeSpent, // in seconds
      metadata, // { tabSwitches: number, etc. }
      sessionToken // Multi-tab prevention token
    } = body;

    // Apply student-specific rate limiting (after we have studentId)
    if (studentId && courseCode) {
      const studentRateLimit = await checkStudentRateLimit(studentId, courseCode);
      if (!studentRateLimit.allowed) {
        console.warn(`Rate limit exceeded for student ${studentId} in course ${courseCode}`);
        return studentRateLimit.response;
      }
    }

    // Validate required fields
    console.log('Validating required fields...');
    if (!courseCode || !studentId || !attemptType || !responses) {
      console.error('Missing required fields:', { courseCode, studentId, attemptType, responsesCount: responses?.length });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    if (!['pre', 'post'].includes(attemptType)) {
      return NextResponse.json(
        { error: 'Invalid attempt type. Must be "pre" or "post"' },
        { status: 400 }
      );
    }

    // Validate responses array
    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { error: 'No responses provided' },
        { status: 400 }
      );
    }

    // Filter out blank/empty answers as a safety net
    const validResponses = responses.filter(
      (r: any) => r.itemId && r.answer !== undefined && r.answer !== null && String(r.answer).trim() !== ''
    );

    if (validResponses.length < responses.length) {
      console.warn(`Filtered ${responses.length - validResponses.length} blank responses from submission`);
    }

    if (validResponses.length === 0) {
      return NextResponse.json(
        { error: 'All responses are blank' },
        { status: 400 }
      );
    }

    // Use transaction for all database operations, wrapped with circuit breaker
    const result = await submissionBreaker.execute(() => transaction(async (client) => {
    // Get course information (including pepper for hashing)
      // Look up course by name
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Invalid course code');
      }
      
      console.log('Course found:', courseData.course_id);

    // Create hashed student key (FERPA compliant)
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId as string);

    // Find or create user
      let user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
      console.log('User not found, creating new user...');
      // Create new user
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, $2) RETURNING user_id',
          [hashedStudentKey, 'hashed']
        );

      user = newUser;
        console.log('New user created:', user.rows[0].user_id);

      // Enroll user in course
      console.log('Enrolling user in course...');
        await client.query(
          'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.rows[0].user_id, courseData.course_id, 'student']
      );
    } else {
        console.log('Existing user found:', user.rows[0].user_id);
    }

      const userId = user.rows[0].user_id;

    // Get the appropriate instrument (pre/post assessment)
    const instrumentName = attemptType === 'pre'
      ? 'Pre-Course Assessment'
      : 'Post-Course Assessment';

      const instrument = await client.query(
        'SELECT instrument_id FROM instruments WHERE name = $1 AND status = $2 LIMIT 1',
        [instrumentName, 'active']
      );

      if (!instrument.rows || instrument.rows.length === 0) {
        throw new Error(`No active ${attemptType} assessment found`);
      }

      const instrumentId = instrument.rows[0].instrument_id;

    // Check if user already completed this assessment type
      const existingAttempt = await client.query(
        'SELECT attempt_id FROM attempts WHERE user_id = $1 AND course_id = $2 AND instrument_id = $3 AND attempt_type = $4 AND submitted_at IS NOT NULL',
        [userId, courseData.course_id, instrumentId, attemptType]
      );

      if (existingAttempt.rows && existingAttempt.rows.length > 0) {
        throw new Error(`You have already completed the ${attemptType} assessment for this course`);
    }

    // Check if metadata column exists in attempts table
    const metadataColumnCheck = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'attempts' AND column_name = 'metadata'"
    );
    const hasMetadataColumn = metadataColumnCheck.rows && metadataColumnCheck.rows.length > 0;

    // Reuse existing in-progress attempt (created by auto-save) or create a new one
    let attemptId: string;

    const existingInProgress = await client.query(
      `SELECT attempt_id, session_token FROM attempts
       WHERE user_id = $1 AND course_id = $2 AND instrument_id = $3 AND submitted_at IS NULL
       ORDER BY started_at DESC LIMIT 1`,
      [userId, courseData.course_id, instrumentId]
    );

    if (existingInProgress.rows.length > 0) {
      attemptId = existingInProgress.rows[0].attempt_id;

      // Validate session token for multi-tab prevention
      const dbToken = existingInProgress.rows[0].session_token;
      if (dbToken && sessionToken && dbToken !== sessionToken) {
        throw new Error('SESSION_CONFLICT');
      }

      console.log('Reusing existing in-progress attempt:', attemptId);

      // Calculate duration server-side from attempt creation time for accuracy
      // This fixes incorrect durations for resumed assessments where client-side
      // timing may be lost or reset between sessions
      const attemptTiming = await client.query(
        'SELECT created_at FROM attempts WHERE attempt_id = $1',
        [attemptId]
      );
      const serverDuration = attemptTiming.rows[0]?.created_at
        ? Math.floor((Date.now() - new Date(attemptTiming.rows[0].created_at).getTime()) / 1000)
        : timeSpent;

      // Note: We no longer delete auto-saved responses here.
      // Instead, we use ON CONFLICT DO UPDATE below to preserve original created_at timestamps.

      // Update attempt metadata with final submission data
      if (hasMetadataColumn) {
        await client.query(
          'UPDATE attempts SET attempt_type = $1, duration_s = $2, metadata = $3 WHERE attempt_id = $4',
          [attemptType, serverDuration || null, metadata || {}, attemptId]
        );
      } else {
        await client.query(
          'UPDATE attempts SET attempt_type = $1, duration_s = $2 WHERE attempt_id = $3',
          [attemptType, serverDuration || null, attemptId]
        );
      }
    } else {
      console.log('Creating new assessment attempt...');
      let attempt;
      if (hasMetadataColumn) {
        attempt = await client.query(
          'INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, duration_s, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING attempt_id',
          [userId, courseData.course_id, instrumentId, attemptType, timeSpent || null, metadata || {}]
        );
      } else {
        attempt = await client.query(
          'INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, duration_s) VALUES ($1, $2, $3, $4, $5) RETURNING attempt_id',
          [userId, courseData.course_id, instrumentId, attemptType, timeSpent || null]
        );
      }
      attemptId = attempt.rows[0].attempt_id;
      console.log('New attempt created:', attemptId);
    }

    console.log('Inserting responses (batch)...');
    // === BULK INSERT RESPONSES ===
    // Prepare arrays for PostgreSQL UNNEST - reduces 40 queries to 1
    const itemIds = validResponses.map((r: any) => r.itemId);
    const rawAnswers = validResponses.map((r: any) => JSON.stringify(r.answer));
    const confidences = validResponses.map((r: any) => r.confidence || null);

    // Single bulk upsert - preserves original created_at timestamps for auto-saved responses
    await client.query(
      `INSERT INTO responses (attempt_id, item_id, raw_answer, confidence)
       SELECT $1, unnest($2::text[]), unnest($3::jsonb[]), unnest($4::int[])
       ON CONFLICT (attempt_id, item_id)
       DO UPDATE SET raw_answer = EXCLUDED.raw_answer, confidence = EXCLUDED.confidence`,
      [attemptId, itemIds, rawAnswers, confidences]
    );
    console.log(`Bulk inserted ${validResponses.length} responses`);

      // === BATCH SCORING ===
    // Per source of truth: Only score knowledge items (Q1-Q14, Q29-Q40)
    // Preference items (Q15-Q28) have is_scored=false and should NOT be scored

    // Check if is_scored column exists (migration may not be applied yet)
    const columnCheck = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'is_scored'"
    );
    const hasIsScoredColumn = columnCheck.rows && columnCheck.rows.length > 0;

    // Fetch all items in single query instead of 40 individual queries
    // Include is_anchor to properly exclude SDM items from grade calculation
    const itemQuery = hasIsScoredColumn
      ? `SELECT item_id, key, type, is_scored, is_anchor FROM items WHERE item_id = ANY($1::text[])`
      : `SELECT item_id, key, type, NULL::boolean as is_scored, is_anchor FROM items WHERE item_id = ANY($1::text[])`;

    interface ItemRow {
      item_id: string;
      key: string | null;
      type: string;
      is_scored: boolean | null;
      is_anchor: boolean | null;
    }

    const itemsResult = await client.query(itemQuery, [validResponses.map((r: any) => r.itemId)]);
    const itemsMap = new Map<string, ItemRow>(
      (itemsResult.rows as ItemRow[]).map((i: ItemRow) => [i.item_id, i])
    );
    console.log(`Fetched ${itemsResult.rows.length} items for scoring`);

    // Calculate scores in memory
    const scoreUpdates: { itemId: string; score: number }[] = [];
    let totalScore = 0;
    let scoredItems = 0;

    for (const response of validResponses) {
      const item = itemsMap.get(response.itemId);
      if (!item) continue;

      // Skip non-anchor items (SDM) and non-scored items (preference Q15-Q28)
      // Per source of truth: only 26 anchor knowledge items contribute to grade
      if (item.is_anchor === false || (hasIsScoredColumn && item.is_scored === false)) {
        continue;
      }

      if (item.type === 'multiple_choice' && item.key) {
        const score = response.answer === item.key ? 100 : 0;
        scoreUpdates.push({ itemId: response.itemId, score });
        totalScore += score;
        scoredItems++;
      } else if (item.type !== 'multiple_choice') {
        // For short answers and other types, placeholder score
        scoreUpdates.push({ itemId: response.itemId, score: 50 });
        totalScore += 50;
        scoredItems++;
      }
      // MC items without key: score remains null (pending AI/manual review)
    }

    // Single bulk update for all scores instead of 40 individual updates
    if (scoreUpdates.length > 0) {
      const updateItemIds = scoreUpdates.map(s => s.itemId);
      const updateScores = scoreUpdates.map(s => s.score);

      await client.query(
        `UPDATE responses r
         SET score = u.score
         FROM (SELECT unnest($1::text[]) as item_id, unnest($2::int[]) as score) u
         WHERE r.attempt_id = $3 AND r.item_id = u.item_id`,
        [updateItemIds, updateScores, attemptId]
      );
      console.log(`Bulk updated ${scoreUpdates.length} scores`);
    }

    // Get total scoreable items to use as denominator
    // This ensures unanswered scored items count as 0, not excluded from the average
    const totalScoreableQuery = hasIsScoredColumn
      ? `SELECT COUNT(*) as total FROM items WHERE is_anchor = true AND is_active = true AND is_scored = true`
      : `SELECT COUNT(*) as total FROM items WHERE is_anchor = true AND is_active = true`;
    const totalScoreableResult = await client.query(totalScoreableQuery);
    const totalScoreableItems = parseInt(totalScoreableResult.rows[0]?.total || '0');
    const denominator = Math.max(totalScoreableItems, scoredItems);
    const overallScore = denominator > 0 ? totalScore / denominator : 0;
    console.log(`Scored ${scoredItems}/${totalScoreableItems} scoreable items, overall: ${overallScore.toFixed(1)}%`);

    // Calculate Overconfidence Index
    // OC = avg(normalized_confidence) - avg(actual_correctness)
    // normalized_confidence: (confidence - 1) / 2 maps 1-3 to 0-1
    // actual_correctness: 1 if answer matches key, 0 otherwise
    // Only include anchor items (exclude SDM) per source of truth
    const ocQuery = `
      SELECT
        AVG((r.confidence - 1)::float / 2) as avg_norm_confidence,
        AVG(CASE WHEN TRIM(BOTH '"' FROM r.raw_answer::text) = i.key THEN 1 ELSE 0 END)::float as avg_correctness
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      WHERE r.attempt_id = $1
        AND i.is_anchor = true
        AND i.is_scored = true
        AND r.confidence IS NOT NULL
    `;
    const ocResult = await client.query(ocQuery, [attemptId]);
    const avgNormConfidence = parseFloat(ocResult.rows[0]?.avg_norm_confidence) || 0;
    const avgCorrectness = parseFloat(ocResult.rows[0]?.avg_correctness) || 0;
    const overconfidenceIndex = avgNormConfidence - avgCorrectness;
    console.log(`OC calculation: avg_conf=${avgNormConfidence.toFixed(3)}, avg_correct=${avgCorrectness.toFixed(3)}, OC=${overconfidenceIndex.toFixed(3)}`);

    // Insert overall scores
      await client.query(
        'INSERT INTO scores (attempt_id, overall, by_domain, se_overall, overconfidence_index) VALUES ($1, $2, $3, $4, $5)',
        [attemptId, overallScore, {}, 5.0, overconfidenceIndex]
      );

    // Mark attempt as submitted ONLY after all data is saved successfully
    await client.query(
      'UPDATE attempts SET submitted_at = $1 WHERE attempt_id = $2',
      [new Date().toISOString(), attemptId]
    );

      return {
        attemptId,
        overallScore
      };
    }));

    return NextResponse.json({
      success: true,
      attemptId: result.attemptId,
      message: 'Assessment submitted successfully',
      score: Math.round(result.overallScore)
    });

  } catch (error) {
    console.error('=== API SUBMISSION ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    // Handle session conflict (multi-tab detection)
    if (errorMessage === 'SESSION_CONFLICT') {
      return NextResponse.json(
        {
          error: 'Session expired. This assessment is open in another browser tab or window. Please close this tab and continue in the other window.',
          code: 'SESSION_CONFLICT'
        },
        { status: 409 }
      );
    }

    // Handle specific error cases
    if (errorMessage.includes('already completed')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 }
      );
    }

    if (errorMessage.includes('Invalid course code') || errorMessage.includes('No active')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      );
    }

    // Circuit breaker is open - service temporarily unavailable
    if (errorMessage.includes('Service temporarily unavailable')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

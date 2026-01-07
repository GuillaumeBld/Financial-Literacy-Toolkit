import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('=== API SUBMISSION START ===');
  try {
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
      timeSpent // in seconds
    } = body;

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

    // Use transaction for all database operations
    const result = await transaction(async (client) => {
    // Get course information (including pepper for hashing)
      // Supports both "QUINN 102" and "Financial Literacy" for backward compatibility
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode
      );

      if (!courseData) {
        throw new Error('Invalid course code');
      }
      
      console.log('Course found:', courseData.course_id);

    // Create hashed student key (FERPA compliant)
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

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

    console.log('Creating assessment attempt...');
    // Create assessment attempt
      const attempt = await client.query(
        'INSERT INTO attempts (user_id, course_id, instrument_id, attempt_type, submitted_at, duration_s) VALUES ($1, $2, $3, $4, $5, $6) RETURNING attempt_id',
        [userId, courseData.course_id, instrumentId, attemptType, new Date().toISOString(), timeSpent || null]
      );

      const attemptId = attempt.rows[0].attempt_id;
      console.log('Attempt created:', attemptId);

    console.log('Inserting responses...');
    // Insert responses
      for (const response of responses) {
        // Ensure raw_answer is properly formatted for JSONB column
        // The pg driver automatically serializes JavaScript objects/arrays to JSONB
        // If answer is already an object/array, pass it directly (don't stringify)
        // If answer is a string, check if it's JSON and parse it, otherwise use as-is
        let rawAnswer = response.answer;
        if (typeof rawAnswer === 'string') {
          // Try to parse if it looks like JSON, otherwise store as string value
          try {
            const parsed = JSON.parse(rawAnswer);
            rawAnswer = parsed;
          } catch {
            // Not valid JSON, store as string (pg will handle JSONB serialization)
            rawAnswer = rawAnswer;
          }
        }
        // pg driver handles JSONB serialization automatically - don't use JSON.stringify()
        await client.query(
          'INSERT INTO responses (attempt_id, item_id, raw_answer, confidence) VALUES ($1, $2, $3, $4)',
          [attemptId, response.itemId, rawAnswer, response.confidence || null]
        );
      }

    console.log('Responses inserted successfully');

      // Calculate basic scores
    let totalScore = 0;
    let scoredItems = 0; // Track only items that were actually scored

    for (const response of responses) {
      // Get item details to check answer
        const item = await client.query(
          'SELECT key, type FROM items WHERE item_id = $1',
          [response.itemId]
        );

        if (item.rows && item.rows.length > 0) {
          const itemData = item.rows[0];
          
          if (itemData.type === 'multiple_choice') {
            if (itemData.key) {
              // Simple scoring for multiple choice with answer key
              const isCorrect = response.answer === itemData.key;
              const score = isCorrect ? 100 : 0;

              // Update response with score
              await client.query(
                'UPDATE responses SET score = $1 WHERE attempt_id = $2 AND item_id = $3',
                [score, attemptId, response.itemId]
              );

              totalScore += score;
              scoredItems += 1; // Increment scored items count
            } else {
              // Multiple choice item without answer key - misconfigured, mark as pending
              // Don't assign placeholder score to prevent inflated assessment scores
              console.warn(`Multiple choice item ${response.itemId} missing answer key - marking as pending`);
              // Score remains null, will be handled by AI scoring or manual review
              // Don't increment scoredItems to exclude from average calculation
            }
          } else {
            // For short answers and other types, mark as pending AI scoring
            totalScore += 50; // Placeholder score
            scoredItems += 1; // Increment scored items count
          }
        }
        // If item not found, skip scoring (don't increment scoredItems)
    }

    const overallScore = scoredItems > 0 ? totalScore / scoredItems : 0;

    // Insert overall scores
      await client.query(
        'INSERT INTO scores (attempt_id, overall, by_domain, se_overall, overconfidence_index) VALUES ($1, $2, $3, $4, $5)',
        [attemptId, overallScore, {}, 5.0, 0]
      );

      return {
        attemptId,
        overallScore
      };
    });

    return NextResponse.json({
      success: true,
      attemptId: result.attemptId,
      message: 'Assessment submitted successfully',
      score: Math.round(result.overallScore)
    });

  } catch (error) {
    console.error('=== API SUBMISSION ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

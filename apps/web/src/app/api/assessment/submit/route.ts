import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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

    // Get course information (including pepper for hashing)
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('course_id, pepper')
      .eq('name', courseCode);

    if (courseError || !courses || courses.length === 0) {
      console.error('Course lookup error:', courseError);
      return NextResponse.json(
        { error: 'Invalid course code' },
        { status: 404 }
      );
    }

    // Use first course if multiple exist
    const course = courses[0];
    console.log('Course found:', course.course_id);

    console.log('Creating hashed student key...');
    // Create hashed student key (FERPA compliant)
    const hashedStudentKey = AuthUtils.createHashedStudentKey(course.pepper, studentId);

    console.log('Looking up existing user...');
    // Find or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('hashed_student_key', hashedStudentKey)
      .single();

    if (userError && userError.code === 'PGRST116') { // Not found
      console.log('User not found, creating new user...');
      // Create new user
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          hashed_student_key: hashedStudentKey,
          sso_provider: 'hashed'
        })
        .select('user_id')
        .single();

      if (createUserError) {
        console.error('Error creating user:', createUserError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }

      user = newUser;
      console.log('New user created:', user.user_id);

      // Enroll user in course
      console.log('Enrolling user in course...');
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.user_id,
          course_id: course.course_id,
          role: 'student'
        });

      if (enrollError) {
        console.error('Error enrolling user:', enrollError);
        // Don't fail the request, just log the error
      }
    } else if (userError) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    } else {
      console.log('Existing user found:', user?.user_id);
    }

    // Ensure user was found or created
    if (!user) {
      return NextResponse.json(
        { error: 'User authentication failed' },
        { status: 500 }
      );
    }

    // Get the appropriate instrument (pre/post assessment)
    const instrumentName = attemptType === 'pre'
      ? 'Pre-Course Assessment'
      : 'Post-Course Assessment';

    const { data: instrument, error: instrumentError } = await supabase
      .from('instruments')
      .select('instrument_id')
      .eq('name', instrumentName)
      .eq('status', 'active')
      .single();

    if (instrumentError || !instrument) {
      return NextResponse.json(
        { error: `No active ${attemptType} assessment found` },
        { status: 404 }
      );
    }

    // Check if user already completed this assessment type
    const { data: existingAttempt, error: attemptCheckError } = await supabase
      .from('attempts')
      .select('attempt_id')
      .eq('user_id', user.user_id)
      .eq('course_id', course.course_id)
      .eq('instrument_id', instrument.instrument_id)
      .eq('attempt_type', attemptType)
      .not('submitted_at', 'is', null)
      .single();

    if (existingAttempt) {
      return NextResponse.json(
        { error: `You have already completed the ${attemptType} assessment for this course` },
        { status: 409 }
      );
    }

    console.log('Creating assessment attempt...');
    // Create assessment attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('attempts')
      .insert({
        user_id: user.user_id,
        course_id: course.course_id,
        instrument_id: instrument.instrument_id,
        attempt_type: attemptType,
        submitted_at: new Date().toISOString(),
        duration_s: timeSpent || null
      })
      .select('attempt_id')
      .single();

    if (attemptError) {
      console.error('Error creating attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to create assessment attempt' },
        { status: 500 }
      );
    }

    console.log('Attempt created:', attempt.attempt_id);

    console.log('Inserting responses...');
    // Insert responses
    const responseInserts = responses.map((response: any) => ({
      attempt_id: attempt.attempt_id,
      item_id: response.itemId,
      raw_answer: response.answer,
      confidence: response.confidence || null
    }));

    const { error: responsesError } = await supabase
      .from('responses')
      .insert(responseInserts);

    if (responsesError) {
      console.error('Error inserting responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to save responses' },
        { status: 500 }
      );
    }

    console.log('Responses inserted successfully');

    // Calculate basic scores (this would be enhanced with AI scoring)
    // For now, just calculate multiple choice scores
    let totalScore = 0;
    let totalItems = responses.length;

    for (const response of responses) {
      // Get item details to check answer
      const { data: item } = await supabase
        .from('items')
        .select('key, type')
        .eq('item_id', response.itemId)
        .single();

      if (item && item.type === 'multiple_choice' && item.key) {
        // Simple scoring for multiple choice
        const isCorrect = response.answer === item.key;
        const score = isCorrect ? 100 : 0;

        // Update response with score
        await supabase
          .from('responses')
          .update({ score })
          .eq('attempt_id', attempt.attempt_id)
          .eq('item_id', response.itemId);

        totalScore += score;
      } else {
        // For short answers, mark as pending AI scoring
        totalScore += 50; // Placeholder score
      }
    }

    const overallScore = totalItems > 0 ? totalScore / totalItems : 0;

    // Insert overall scores
    const { error: scoresError } = await supabase
      .from('scores')
      .insert({
        attempt_id: attempt.attempt_id,
        overall: overallScore,
        by_domain: {}, // Would be calculated by domain
        se_overall: 5.0, // Placeholder standard error
        overconfidence_index: 0 // Would be calculated
      });

    if (scoresError) {
      console.error('Error inserting scores:', scoresError);
      // Don't fail the request for scoring errors
    }

    return NextResponse.json({
      success: true,
      attemptId: attempt.attempt_id,
      message: 'Assessment submitted successfully',
      score: Math.round(overallScore)
    });

  } catch (error) {
    console.error('=== API SUBMISSION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

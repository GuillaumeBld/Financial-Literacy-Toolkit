import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  console.log('=== CLEANUP API START ===');
  try {
    const body = await request.json();
    const { studentId, courseCode } = body;

    if (!studentId || !courseCode) {
      return NextResponse.json(
        { error: 'Missing studentId or courseCode' },
        { status: 400 }
      );
    }

    // Get course
    const { data: course } = await supabase
      .from('courses')
      .select('course_id, pepper')
      .eq('name', courseCode)
      .single();

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Create hashed key
    const hashedStudentKey = AuthUtils.createHashedStudentKey(course.pepper, studentId);

    // Find user
    const { data: user } = await supabase
      .from('users')
      .select('user_id')
      .eq('hashed_student_key', hashedStudentKey)
      .single();

    if (!user) {
      return NextResponse.json(
        { message: 'No data found for this student' },
        { status: 200 }
      );
    }

    // Get all attempts for this user
    const { data: attempts } = await supabase
      .from('attempts')
      .select('attempt_id')
      .eq('user_id', user.user_id);

    if (attempts && attempts.length > 0) {
      const attemptIds = attempts.map(a => a.attempt_id);

      console.log('Deleting scores...');
      await supabase
        .from('scores')
        .delete()
        .in('attempt_id', attemptIds);

      console.log('Deleting responses...');
      await supabase
        .from('responses')
        .delete()
        .in('attempt_id', attemptIds);

      console.log('Deleting attempts...');
      await supabase
        .from('attempts')
        .delete()
        .eq('user_id', user.user_id);
    }

    console.log('Deleting enrollments...');
    await supabase
      .from('enrollments')
      .delete()
      .eq('user_id', user.user_id);

    console.log('Deleting user...');
    await supabase
      .from('users')
      .delete()
      .eq('user_id', user.user_id);

    return NextResponse.json({
      success: true,
      message: 'Student data cleaned up successfully',
      deletedUserId: user.user_id
    });

  } catch (error) {
    console.error('=== CLEANUP API ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

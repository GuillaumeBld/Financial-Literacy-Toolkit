import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseCode } = body;

    if (!courseCode) {
      return NextResponse.json(
        { valid: false, error: 'Course code is required' },
        { status: 400 }
      );
    }

    // Check if course exists in database
    const { data: courses, error } = await supabase
      .from('courses')
      .select('course_id, name')
      .eq('name', courseCode.trim());

    if (error) {
      console.error('Error checking course:', error);
      return NextResponse.json(
        { valid: false, error: 'Unable to validate course code' },
        { status: 500 }
      );
    }

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        valid: false,
        error: 'Course not found'
      });
    }

    return NextResponse.json({
      valid: true,
      course: {
        id: courses[0].course_id,
        name: courses[0].name
      }
    });

  } catch (error) {
    console.error('Course validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


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
  console.log('=== INSTRUCTOR QUESTIONS DATA START ===');
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

    // Get all questions from the item bank
    const { data: questions, error: questionsError } = await supabase
      .from('items')
      .select(`
        item_id,
        type,
        domain,
        subdomain,
        difficulty,
        question_text,
        options,
        key,
        explanation,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    console.log('Questions loaded:', questions?.length || 0);

    return NextResponse.json({
      success: true,
      questions: questions || []
    });

  } catch (error) {
    console.error('=== INSTRUCTOR QUESTIONS ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('=== CREATE QUESTION START ===');
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

    const body = await request.json();
    const { 
      type, 
      domain, 
      subdomain, 
      difficulty, 
      question_text, 
      options, 
      key, 
      explanation 
    } = body;

    // Validate required fields
    if (!type || !domain || !question_text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the question
    const { data: newQuestion, error: createError } = await supabase
      .from('items')
      .insert({
        type,
        domain,
        subdomain: subdomain || '',
        difficulty: difficulty || 1,
        question_text,
        options: options || null,
        key: key || null,
        explanation: explanation || null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating question:', createError);
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    console.log('Question created:', newQuestion.item_id);

    return NextResponse.json({
      success: true,
      question: newQuestion
    });

  } catch (error) {
    console.error('=== CREATE QUESTION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

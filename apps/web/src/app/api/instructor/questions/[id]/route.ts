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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== GET QUESTION START ===');
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

    // Get the specific question
    const { data: question, error: questionError } = await supabase
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
      .eq('item_id', params.id)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question
    });

  } catch (error) {
    console.error('=== GET QUESTION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== UPDATE QUESTION START ===');
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

    // Update the question
    const { data: updatedQuestion, error: updateError } = await supabase
      .from('items')
      .update({
        type,
        domain,
        subdomain: subdomain || '',
        difficulty: difficulty || 1,
        question_text,
        options: options || null,
        key: key || null,
        explanation: explanation || null,
        updated_at: new Date().toISOString()
      })
      .eq('item_id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    console.log('Question updated:', updatedQuestion.item_id);

    return NextResponse.json({
      success: true,
      question: updatedQuestion
    });

  } catch (error) {
    console.error('=== UPDATE QUESTION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('=== DELETE QUESTION START ===');
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

    // Delete the question
    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('item_id', params.id);

    if (deleteError) {
      console.error('Error deleting question:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete question' },
        { status: 500 }
      );
    }

    console.log('Question deleted:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('=== DELETE QUESTION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

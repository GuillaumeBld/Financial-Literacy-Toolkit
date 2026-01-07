import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

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
    const question = await queryOne<{
      item_id: string;
      type: string;
      domain: string;
      subdomain: string;
      difficulty: number;
      stem: string;
      options: any;
      key: string | null;
      rubric: any;
      created_at: string;
    }>(
      'SELECT item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, created_at FROM items WHERE item_id = $1',
      [params.id]
    );

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question: {
        item_id: question.item_id,
        type: question.type,
        domain: question.domain,
        subdomain: question.subdomain,
        difficulty: question.difficulty,
        question_text: question.stem,
        options: question.options,
        key: question.key,
        explanation: question.rubric,
        created_at: question.created_at,
        updated_at: question.created_at
      }
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
    const updatedQuestion = await queryOne<{
      item_id: string;
      type: string;
      domain: string;
      subdomain: string;
      difficulty: number;
      stem: string;
      options: any;
      key: string | null;
      rubric: any;
      created_at: string;
    }>(
      `UPDATE items 
       SET type = $1, domain = $2, subdomain = $3, difficulty = $4, stem = $5, options = $6, key = $7, rubric = $8
       WHERE item_id = $9
       RETURNING item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, created_at`,
      [
        type,
        domain,
        subdomain || '',
        difficulty ?? 1, // Use nullish coalescing to preserve 0 as valid difficulty value
        question_text,
        options || null, // pg driver automatically serializes objects/arrays to JSONB
        key || null,
        explanation || null, // pg driver automatically serializes objects/arrays to JSONB
        params.id
      ]
    );

    if (!updatedQuestion) {
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    console.log('Question updated:', updatedQuestion.item_id);

    return NextResponse.json({
      success: true,
      question: {
        item_id: updatedQuestion.item_id,
        type: updatedQuestion.type,
        domain: updatedQuestion.domain,
        subdomain: updatedQuestion.subdomain,
        difficulty: updatedQuestion.difficulty,
        question_text: updatedQuestion.stem,
        options: updatedQuestion.options,
        key: updatedQuestion.key,
        explanation: updatedQuestion.rubric,
        created_at: updatedQuestion.created_at,
        updated_at: updatedQuestion.created_at
      }
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
    await query(
      'DELETE FROM items WHERE item_id = $1',
      [params.id]
    );

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

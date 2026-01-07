import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

// Verify instructor session token
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
    const questions = await queryMany<{
      item_id: string;
      type: string;
      domain: string;
      subdomain: string;
      difficulty: number;
      stem: string;
      options: any;
      key: string | null;
      rubric: any;
      is_active: boolean;
      created_at: string;
    }>(
      'SELECT item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, COALESCE(is_active, false) as is_active, created_at FROM items ORDER BY created_at DESC'
    );

    console.log('Questions loaded:', questions.length);

    return NextResponse.json({
      success: true,
      questions: questions.map(q => ({
        item_id: q.item_id,
        type: q.type,
        domain: q.domain,
        subdomain: q.subdomain,
        difficulty: q.difficulty,
        question_text: q.stem,
        options: q.options,
        key: q.key,
        explanation: q.rubric,
        is_active: q.is_active,
        created_at: q.created_at,
        updated_at: q.created_at
      }))
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
    const newQuestion = await queryOne<{
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
      `INSERT INTO items (type, domain, subdomain, difficulty, stem, options, key, rubric)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, created_at`,
      [
        type,
        domain,
        subdomain || '',
        difficulty ?? 1, // Use nullish coalescing to preserve 0 as valid difficulty value
        question_text,
        options || null, // pg driver automatically serializes objects/arrays to JSONB
        key || null,
        explanation || null // pg driver automatically serializes objects/arrays to JSONB
      ]
    );

    if (!newQuestion) {
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 500 }
      );
    }

    console.log('Question created:', newQuestion.item_id);

    return NextResponse.json({
      success: true,
      question: {
        item_id: newQuestion.item_id,
        type: newQuestion.type,
        domain: newQuestion.domain,
        subdomain: newQuestion.subdomain,
        difficulty: newQuestion.difficulty,
        question_text: newQuestion.stem,
        options: newQuestion.options,
        key: newQuestion.key,
        explanation: newQuestion.rubric,
        created_at: newQuestion.created_at,
        updated_at: newQuestion.created_at
      }
    });

  } catch (error) {
    console.error('=== CREATE QUESTION ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const columns = await queryMany<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'items'"
    );
    const columnSet = new Set(columns.map((c) => c.column_name));
    const hasIsSdm = columnSet.has('is_sdm');
    const hasIsScored = columnSet.has('is_scored');
    const hasExternalItemId = columnSet.has('external_item_id');
    const hasAnchorItemId = columnSet.has('anchor_item_id');
    const hasVariantType = columnSet.has('variant_type');
    const hasTriggerCondition = columnSet.has('trigger_condition');
    const hasExternalId = columnSet.has('external_id');

    const selectIsSdm = hasIsSdm ? 'is_sdm' : 'NULL::boolean as is_sdm';
    const selectIsScored = hasIsScored ? 'is_scored' : 'true::boolean as is_scored';
    const selectExternalItemId = hasExternalItemId ? 'external_item_id' : 'NULL::text as external_item_id';
    const selectAnchorItemId = hasAnchorItemId ? 'anchor_item_id' : 'NULL::uuid as anchor_item_id';
    const selectVariantType = hasVariantType ? 'variant_type' : 'NULL::text as variant_type';
    const selectTriggerCondition = hasTriggerCondition ? 'trigger_condition' : 'NULL::text as trigger_condition';
    const selectExternalId = hasExternalId ? 'external_id' : 'NULL::text as external_id';

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
      is_anchor: boolean | null;
      is_sdm: boolean | null;
      is_scored: boolean | null;
      external_item_id: string | null;
      anchor_item_id: string | null;
      variant_type: string | null;
      trigger_condition: string | null;
      external_id: string | null;
      created_at: string;
    }>(
      `SELECT item_id, type, domain, subdomain, difficulty, stem, options, key, rubric,
              COALESCE(is_active, false) as is_active,
              is_anchor,
              ${selectIsSdm},
              ${selectIsScored},
              ${selectExternalItemId},
              ${selectAnchorItemId},
              ${selectVariantType},
              ${selectTriggerCondition},
              ${selectExternalId},
              created_at
       FROM items
       ORDER BY created_at DESC`
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
        is_anchor: q.is_anchor,
        // Derive is_sdm from anchor_item_id presence when column doesn't exist
        is_sdm: q.is_sdm ?? (q.anchor_item_id ? true : false),
        is_scored: q.is_scored, // false for preference items Q15-Q28
        // Use item_id as external_item_id fallback (Q1, Q2, etc.)
        external_item_id: q.external_item_id ?? q.item_id,
        anchor_item_id: q.anchor_item_id,
        variant_type: q.variant_type,
        trigger_condition: q.trigger_condition,
        external_id: q.external_id,
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
    // The pg driver automatically handles JavaScript objects/arrays for JSONB fields
    // If options/explanation are strings, parse them first; otherwise use as-is
    const optionsValue = options 
      ? (typeof options === 'string' ? JSON.parse(options) : options)
      : null;
    const explanationValue = explanation 
      ? (typeof explanation === 'string' ? JSON.parse(explanation) : explanation)
      : null;

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
      is_active: boolean;
      created_at: string;
    }>(
      `INSERT INTO items (type, domain, subdomain, difficulty, stem, options, key, rubric, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, COALESCE(is_active, false) as is_active, created_at`,
      [
        type,
        domain,
        subdomain || '',
        difficulty ?? 1, // Use nullish coalescing to preserve 0 as valid difficulty value
        question_text,
        optionsValue, // pg driver automatically serializes to JSONB
        key || null,
        explanationValue, // pg driver automatically serializes to JSONB
        false // Default to inactive for new questions
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
        is_active: newQuestion.is_active,
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

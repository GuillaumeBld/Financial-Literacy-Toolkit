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

    const columnsResult = await query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'items'"
    );
    const columnSet = new Set((columnsResult.rows || []).map((r: any) => r.column_name));
    const hasIsSdm = columnSet.has('is_sdm');
    const hasAnchorItemId = columnSet.has('anchor_item_id');
    const hasVariantType = columnSet.has('variant_type');
    const hasTriggerCondition = columnSet.has('trigger_condition');
    const hasExternalId = columnSet.has('external_id');

    const selectIsSdm = hasIsSdm ? 'is_sdm' : 'NULL::boolean as is_sdm';
    const selectAnchorItemId = hasAnchorItemId ? 'anchor_item_id' : 'NULL::uuid as anchor_item_id';
    const selectVariantType = hasVariantType ? 'variant_type' : 'NULL::text as variant_type';
    const selectTriggerCondition = hasTriggerCondition ? 'trigger_condition' : 'NULL::text as trigger_condition';
    const selectExternalId = hasExternalId ? 'external_id' : 'NULL::text as external_id';

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
      is_active: boolean | null;
      is_anchor: boolean | null;
      is_sdm: boolean | null;
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
              ${selectAnchorItemId},
              ${selectVariantType},
              ${selectTriggerCondition},
              ${selectExternalId},
              created_at
       FROM items
       WHERE item_id = $1`,
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
        is_active: question.is_active,
        is_anchor: question.is_anchor,
        is_sdm: question.is_sdm,
        anchor_item_id: question.anchor_item_id,
        variant_type: question.variant_type,
        trigger_condition: question.trigger_condition,
        external_id: question.external_id,
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
      explanation,
      is_active
    } = body;

    // Build dynamic UPDATE query for partial updates
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (type !== undefined) {
      updateFields.push(`type = $${paramIndex++}`);
      updateValues.push(type);
    }
    if (domain !== undefined) {
      updateFields.push(`domain = $${paramIndex++}`);
      updateValues.push(domain);
    }
    if (subdomain !== undefined) {
      updateFields.push(`subdomain = $${paramIndex++}`);
      updateValues.push(subdomain);
    }
    if (difficulty !== undefined) {
      updateFields.push(`difficulty = $${paramIndex++}`);
      updateValues.push(difficulty);
    }
    if (question_text !== undefined) {
      updateFields.push(`stem = $${paramIndex++}`);
      updateValues.push(question_text);
    }
    if (options !== undefined) {
      updateFields.push(`options = $${paramIndex++}::jsonb`);
      updateValues.push(options ? JSON.stringify(options) : null);
    }
    if (key !== undefined) {
      updateFields.push(`key = $${paramIndex++}`);
      updateValues.push(key);
    }
    if (explanation !== undefined) {
      updateFields.push(`rubric = $${paramIndex++}::jsonb`);
      updateValues.push(explanation ? JSON.stringify(explanation) : null);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add item_id as last parameter
    updateValues.push(params.id);

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
      is_active: boolean;
      is_anchor: boolean | null;
      is_sdm: boolean | null;
      anchor_item_id: string | null;
      variant_type: string | null;
      trigger_condition: string | null;
      external_id: string | null;
      created_at: string;
    }>(
      `UPDATE items 
       SET ${updateFields.join(', ')}
       WHERE item_id = $${paramIndex}
       RETURNING item_id, type, domain, subdomain, difficulty, stem, options, key, rubric, COALESCE(is_active, false) as is_active, is_anchor, is_sdm, anchor_item_id, variant_type, trigger_condition, external_id, created_at`,
      updateValues
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
        is_active: updatedQuestion.is_active,
        is_anchor: updatedQuestion.is_anchor,
        is_sdm: updatedQuestion.is_sdm,
        anchor_item_id: updatedQuestion.anchor_item_id,
        variant_type: updatedQuestion.variant_type,
        trigger_condition: updatedQuestion.trigger_condition,
        external_id: updatedQuestion.external_id,
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

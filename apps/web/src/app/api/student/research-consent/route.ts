import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT research_consent, research_consent_timestamp
       FROM student_profiles
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      research_consent: result.rows[0].research_consent,
      research_consent_timestamp: result.rows[0].research_consent_timestamp,
    });
  } catch (error: any) {
    console.error('Error fetching research consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent status' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, research_consent } = body;

    if (!userId || !courseId || typeof research_consent !== 'boolean') {
      return NextResponse.json(
        { error: 'userId, courseId, and research_consent (boolean) are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE student_profiles
       SET research_consent = $1,
           research_consent_timestamp = NOW(),
           updated_at = NOW()
       WHERE user_id = $2 AND course_id = $3
       RETURNING research_consent, research_consent_timestamp`,
      [research_consent, userId, courseId]
    );

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      research_consent: result.rows[0].research_consent,
      research_consent_timestamp: result.rows[0].research_consent_timestamp,
    });
  } catch (error: any) {
    console.error('Error updating research consent:', error);
    return NextResponse.json(
      { error: 'Failed to update consent' },
      { status: 500 }
    );
  }
}

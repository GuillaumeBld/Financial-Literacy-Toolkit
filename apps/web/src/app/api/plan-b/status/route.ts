import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseCode = searchParams.get('courseCode');

    if (!courseCode) {
      return NextResponse.json({ active: false, redirectUrl: null });
    }

    const result = await queryOne<{
      is_active: boolean;
      active_level: string;
      url_full: string | null;
      url_assessment_only: string | null;
      url_minimal: string | null;
    }>(
      `SELECT p.is_active, p.active_level, p.url_full, p.url_assessment_only, p.url_minimal
       FROM plan_b_settings p
       JOIN courses c ON p.course_id = c.course_id
       WHERE c.name = $1 AND p.is_active = true`,
      [courseCode.trim()]
    );

    if (!result) {
      return NextResponse.json({ active: false, redirectUrl: null });
    }

    const urlMap: Record<string, string | null> = {
      full: result.url_full,
      assessment_only: result.url_assessment_only,
      minimal: result.url_minimal,
    };

    const redirectUrl = result.active_level ? urlMap[result.active_level] : null;

    return NextResponse.json({
      active: true,
      redirectUrl,
      level: result.active_level,
    });
  } catch (error) {
    console.error('Error checking Plan B status:', error);
    // On error, don't block students — return inactive
    return NextResponse.json({ active: false, redirectUrl: null });
  }
}

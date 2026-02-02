import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne, query } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get Plan B settings for all courses this instructor manages
    const settings = await queryMany<{
      course_id: string;
      course_name: string;
      is_active: boolean;
      active_level: string | null;
      url_full: string | null;
      url_assessment_only: string | null;
      url_minimal: string | null;
      updated_at: string | null;
    }>(
      `SELECT c.course_id, c.name as course_name,
              COALESCE(p.is_active, false) as is_active,
              p.active_level, p.url_full, p.url_assessment_only, p.url_minimal, p.updated_at
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       LEFT JOIN plan_b_settings p ON c.course_id = p.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching Plan B settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const instructorId = await verifyInstructorToken(token);
    if (!instructorId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, isActive, activeLevel, urlFull, urlAssessmentOnly, urlMinimal } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Verify instructor has access to this course
    const access = await queryOne<{ access_level: string }>(
      `SELECT access_level FROM instructor_courses
       WHERE instructor_id = $1 AND course_id = $2`,
      [instructorId, courseId]
    );

    if (!access) {
      return NextResponse.json({ error: 'Access denied for this course' }, { status: 403 });
    }

    // Validate active_level
    const validLevels = ['full', 'assessment_only', 'minimal'];
    if (activeLevel && !validLevels.includes(activeLevel)) {
      return NextResponse.json({ error: 'Invalid fallback level' }, { status: 400 });
    }

    // Validate URLs if provided (must be Google Forms)
    const validateUrl = (url: string | null | undefined): boolean => {
      if (!url) return true;
      return url.startsWith('https://docs.google.com/forms') || url.startsWith('https://forms.gle');
    };

    if (!validateUrl(urlFull) || !validateUrl(urlAssessmentOnly) || !validateUrl(urlMinimal)) {
      return NextResponse.json(
        { error: 'URLs must be Google Forms links (https://docs.google.com/forms/... or https://forms.gle/...)' },
        { status: 400 }
      );
    }

    // If activating, ensure the selected level has a URL
    if (isActive && activeLevel) {
      const urlMap: Record<string, string | null | undefined> = {
        full: urlFull,
        assessment_only: urlAssessmentOnly,
        minimal: urlMinimal,
      };
      if (!urlMap[activeLevel]) {
        return NextResponse.json(
          { error: `Please provide a Google Form URL for the selected level (${activeLevel.replace('_', ' ')})` },
          { status: 400 }
        );
      }
    }

    // Upsert plan_b_settings
    await query(
      `INSERT INTO plan_b_settings (course_id, is_active, active_level, url_full, url_assessment_only, url_minimal, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (course_id) DO UPDATE SET
         is_active = $2,
         active_level = $3,
         url_full = $4,
         url_assessment_only = $5,
         url_minimal = $6,
         updated_by = $7,
         updated_at = NOW()`,
      [courseId, isActive ?? false, activeLevel || null, urlFull || null, urlAssessmentOnly || null, urlMinimal || null, instructorId]
    );

    return NextResponse.json({ success: true, message: 'Plan B settings saved' });
  } catch (error) {
    console.error('Error saving Plan B settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

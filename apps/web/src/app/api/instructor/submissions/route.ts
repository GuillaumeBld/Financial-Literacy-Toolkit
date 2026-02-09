import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('=== INSTRUCTOR SUBMISSIONS DATA START ===');
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

    // Check if this is a detail request for a specific submission
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get('attemptId');

    if (attemptId) {
      return await getSubmissionDetail(instructorId, attemptId);
    }

    // Bulk open-ended answers for flagged attempt IDs
    const openAnswersParam = searchParams.get('openAnswers');
    if (openAnswersParam) {
      return await getOpenAnswers(instructorId, openAnswersParam.split(','));
    }

    // Export ALL open-ended responses as flat CSV-ready array
    const exportOpen = searchParams.get('exportOpen');
    const courseFilter = searchParams.get('courseId');
    if (exportOpen === 'true') {
      return await exportOpenQuestions(instructorId, courseFilter);
    }

    // Get instructor's courses
    const instructorCourses = await queryMany<{
      course_id: string;
      course_name: string;
    }>(
      `SELECT ic.course_id, c.name as course_name
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({
        success: true,
        courses: [],
        submissions: [],
        message: 'No courses assigned'
      });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);

    // Get all submissions for instructor's courses
    const submissions = await queryMany<{
      attempt_id: string;
      user_id: string;
      course_id: string;
      attempt_type: string;
      submitted_at: string | null;
      duration_s: number | null;
      hashed_student_key: string;
      course_name: string;
      overall: number | null;
      by_domain: any;
      overconfidence_index: number | null;
      metadata: any;
    }>(
      `SELECT
        a.attempt_id,
        a.user_id,
        a.course_id,
        a.attempt_type,
        a.submitted_at,
        a.duration_s,
        a.metadata,
        u.hashed_student_key,
        c.name as course_name,
        s.overall,
        s.by_domain,
        s.overconfidence_index
      FROM attempts a
      JOIN users u ON a.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN scores s ON a.attempt_id = s.attempt_id
      WHERE a.course_id = ANY($1::uuid[])
        AND a.submitted_at IS NOT NULL
      ORDER BY a.submitted_at DESC`,
      [courseIds]
    );

    // Transform the data for easier consumption
    // Note: PostgreSQL numeric columns return strings, so we parse them to numbers
    const transformedSubmissions = submissions.map(submission => ({
      attempt_id: submission.attempt_id,
      user_id: submission.user_id,
      hashed_student_key: submission.hashed_student_key || 'Unknown',
      course_id: submission.course_id,
      course_name: submission.course_name || 'Unknown Course',
      attempt_type: submission.attempt_type,
      submitted_at: submission.submitted_at,
      duration_s: submission.duration_s || 0,
      overall_score: parseFloat(submission.overall as unknown as string) || 0,
      overconfidence_index: parseFloat(submission.overconfidence_index as unknown as string) || 0,
      domain_scores: submission.by_domain || {},
      tab_switches: submission.metadata?.tabSwitches ?? 0
    }));

    console.log('Submissions loaded:', transformedSubmissions.length);

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({
          id: ic.course_id,
        name: ic.course_name
      })),
      submissions: transformedSubmissions
    });

  } catch (error) {
    console.error('=== INSTRUCTOR SUBMISSIONS ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get detailed submission data including responses and student profile
async function getSubmissionDetail(instructorId: string, attemptId: string) {
  try {
    // First verify the instructor has access to this submission
    const attempt = await queryOne<{
      attempt_id: string;
      user_id: string;
      course_id: string;
      attempt_type: string;
      submitted_at: string;
      started_at: string;
      duration_s: number;
      metadata: any;
      hashed_student_key: string;
      course_name: string;
      overall: string;
      by_domain: any;
      overconfidence_index: string;
    }>(
      `SELECT
        a.attempt_id, a.user_id, a.course_id, a.attempt_type,
        a.submitted_at, a.started_at, a.duration_s, a.metadata,
        u.hashed_student_key, c.name as course_name,
        s.overall, s.by_domain, s.overconfidence_index
      FROM attempts a
      JOIN users u ON a.user_id = u.user_id
      JOIN courses c ON a.course_id = c.course_id
      LEFT JOIN scores s ON a.attempt_id = s.attempt_id
      WHERE a.attempt_id = $1
        AND a.course_id IN (
          SELECT course_id FROM instructor_courses WHERE instructor_id = $2
        )`,
      [attemptId, instructorId]
    );

    if (!attempt) {
      return NextResponse.json(
        { error: 'Submission not found or access denied' },
        { status: 404 }
      );
    }

    // Get all responses for this attempt with question details
    const responses = await queryMany<{
      item_id: string;
      raw_answer: any;
      score: string;
      confidence: number;
      created_at: string;
      stem: string;
      type: string;
      domain: string;
      is_scored: boolean;
      key: string;
      options: any;
    }>(
      `SELECT
        r.item_id, r.raw_answer, r.score, r.confidence, r.created_at,
        i.stem, i.type, i.domain, i.is_scored, i.key, i.options
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      WHERE r.attempt_id = $1
      ORDER BY i.is_anchor DESC, (SUBSTRING(i.item_id FROM '(\\d+)')::integer), i.item_id`,
      [attemptId]
    );

    // Get student profile
    const profile = await queryOne<{
      gender: string;
      race_ethnicity: string;
      age_range: string;
      first_language: string;
      work_experience: string;
      prior_financial_products: any;
      self_rated_financial_knowledge: string;
      financial_stress_frequency: string;
      parental_education: string;
      first_generation_college: string;
      has_student_loan_debt: string;
      student_loan_interest_rate: string;
      student_loan_maturity: string;
      research_consent: boolean;
    }>(
      `SELECT
        gender, race_ethnicity, age_range, first_language, work_experience,
        prior_financial_products, self_rated_financial_knowledge, financial_stress_frequency,
        parental_education, first_generation_college, has_student_loan_debt,
        student_loan_interest_rate, student_loan_maturity, research_consent
      FROM student_profiles
      WHERE user_id = $1 AND course_id = $2`,
      [attempt.user_id, attempt.course_id]
    );

    return NextResponse.json({
      success: true,
      submission: {
        attempt_id: attempt.attempt_id,
        user_id: attempt.user_id,
        hashed_student_key: attempt.hashed_student_key,
        course_id: attempt.course_id,
        course_name: attempt.course_name,
        attempt_type: attempt.attempt_type,
        submitted_at: attempt.submitted_at,
        started_at: attempt.started_at,
        duration_s: attempt.duration_s || 0,
        metadata: attempt.metadata || {},
        overall_score: parseFloat(attempt.overall) || 0,
        overconfidence_index: parseFloat(attempt.overconfidence_index) || 0,
        domain_scores: attempt.by_domain || {}
      },
      responses: responses.map(r => ({
        item_id: r.item_id,
        question: r.stem,
        type: r.type,
        domain: r.domain,
        answer: r.raw_answer,
        correct_answer: r.key,
        options: r.options,
        score: r.score ? parseFloat(r.score) : null,
        confidence: r.confidence,
        is_scored: r.is_scored,
        answered_at: r.created_at
      })),
      profile: profile || null
    });

  } catch (error) {
    console.error('Error getting submission detail:', error);
    return NextResponse.json(
      { error: 'Failed to get submission details' },
      { status: 500 }
    );
  }
}

// Bulk fetch open-ended answers for multiple attempts
async function getOpenAnswers(instructorId: string, attemptIds: string[]) {
  try {
    if (attemptIds.length === 0 || attemptIds.length > 50) {
      return NextResponse.json({ error: 'Invalid attempt IDs' }, { status: 400 });
    }

    // Verify instructor has access to these attempts
    const accessible = await queryMany<{ attempt_id: string }>(
      `SELECT a.attempt_id FROM attempts a
       WHERE a.attempt_id = ANY($1::uuid[])
         AND a.course_id IN (
           SELECT course_id FROM instructor_courses WHERE instructor_id = $2
         )`,
      [attemptIds, instructorId]
    );

    const accessibleIds = accessible.map(a => a.attempt_id);
    if (accessibleIds.length === 0) {
      return NextResponse.json({ success: true, openAnswers: {} });
    }

    const answers = await queryMany<{
      attempt_id: string;
      item_id: string;
      subdomain: string;
      answer: string;
    }>(
      `SELECT r.attempt_id, r.item_id, i.subdomain,
        TRIM(BOTH '"' FROM r.raw_answer::text) as answer
       FROM responses r
       JOIN items i ON r.item_id = i.item_id
       WHERE r.attempt_id = ANY($1::uuid[])
         AND i.type = 'short_answer'
       ORDER BY r.attempt_id, r.item_id`,
      [accessibleIds]
    );

    // Group by attempt_id
    const grouped: Record<string, Array<{ itemId: string; subdomain: string; answer: string }>> = {};
    answers.forEach(a => {
      if (!grouped[a.attempt_id]) grouped[a.attempt_id] = [];
      grouped[a.attempt_id].push({
        itemId: a.item_id,
        subdomain: a.subdomain,
        answer: a.answer,
      });
    });

    return NextResponse.json({ success: true, openAnswers: grouped });
  } catch (error) {
    console.error('Error getting open answers:', error);
    return NextResponse.json({ error: 'Failed to get open answers' }, { status: 500 });
  }
}

async function exportOpenQuestions(instructorId: string, courseId: string | null) {
  try {
    // Get instructor's courses
    const instructorCourses = await queryMany<{ course_id: string }>(
      `SELECT course_id FROM instructor_courses WHERE instructor_id = $1`,
      [instructorId]
    );
    const courseIds = instructorCourses.map(c => c.course_id);
    if (courseIds.length === 0) {
      return NextResponse.json({ success: true, rows: [] });
    }
    const targetCourseIds = courseId ? [courseId] : courseIds;
    if (courseId && !courseIds.includes(courseId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const rows = await queryMany<{
      hashed_student_key: string;
      attempt_id: string;
      submitted_at: string;
      item_id: string;
      subdomain: string;
      item_type: string;
      answer: string;
      anchor_item_id: string;
      anchor_answer: string;
      anchor_key: string;
      anchor_score: string;
      anchor_confidence: string;
    }>(`
      SELECT
        u.hashed_student_key,
        a.attempt_id,
        a.submitted_at::text,
        r.item_id,
        i.subdomain,
        CASE
          WHEN r.item_id LIKE '%_Open_Diagnose' THEN 'diagnose'
          WHEN r.item_id LIKE '%_Open_Confirm' THEN 'confirm'
          ELSE 'other'
        END as item_type,
        TRIM(BOTH '"' FROM r.raw_answer::text) as answer,
        -- Join the anchor item for context
        anchor_q.item_id as anchor_item_id,
        TRIM(BOTH '"' FROM anchor_r.raw_answer::text) as anchor_answer,
        COALESCE(anchor_q.key, '') as anchor_key,
        COALESCE(anchor_r.score::text, '') as anchor_score,
        COALESCE(anchor_r.confidence::text, '') as anchor_confidence
      FROM responses r
      JOIN items i ON r.item_id = i.item_id
      JOIN attempts a ON r.attempt_id = a.attempt_id
      JOIN users u ON u.user_id = a.user_id
      -- Get the corresponding anchor item (e.g. Q7_Open_Diagnose → Q7)
      LEFT JOIN items anchor_q ON anchor_q.item_id = SPLIT_PART(r.item_id, '_', 1)
        AND anchor_q.is_anchor = true
      LEFT JOIN responses anchor_r ON anchor_r.attempt_id = a.attempt_id
        AND anchor_r.item_id = anchor_q.item_id
      WHERE i.type = 'short_answer'
        AND a.submitted_at IS NOT NULL
        AND a.course_id = ANY($1::uuid[])
      ORDER BY u.hashed_student_key, r.item_id
    `, [targetCourseIds]);

    return NextResponse.json({ success: true, rows });
  } catch (error) {
    console.error('Error exporting open questions:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}

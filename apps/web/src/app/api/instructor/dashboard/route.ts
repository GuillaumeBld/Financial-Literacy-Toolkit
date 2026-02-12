import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';
import { getTagLabel } from '@/lib/misconception-labels';

export const dynamic = 'force-dynamic';

const SHORT_NAMES: Record<string, string> = {
  'Borrowing, Interest Rates, and Financial Numeracy Knowledge': 'Borrowing & Credit',
  'Behavioral and Risk Management Knowledge': 'Risk Management',
  'Risk and Return Knowledge': 'Investment & Risk',
};

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

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    // Get instructor's courses
    const instructorCourses = await queryMany<{
      course_id: string;
      access_level: string;
      course_name: string;
    }>(
      `SELECT ic.course_id, ic.access_level, c.name as course_name
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({ success: true, courses: [], data: null, message: 'No courses assigned' });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);
    const targetCourseId = courseId || courseIds[0];

    if (!courseIds.includes(targetCourseId)) {
      return NextResponse.json({ error: 'Invalid course ID or access denied' }, { status: 403 });
    }

    // ── Run all queries in parallel ──
    const [
      scoreStats,
      scoreDist,
      itemStats,
      distractors,
      confDists,
      sdmCounts,
      misconceptionRows,
      totalPossibleResult,
      studentCount,
    ] = await Promise.all([
      // Q1: Mean and median scores
      queryOne<{ mean_score: number; median_score: number }>(`
        SELECT ROUND(AVG(overall)::numeric, 2) as mean_score,
               ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall)::numeric, 2) as median_score
        FROM scores s JOIN attempts a ON s.attempt_id = a.attempt_id
        WHERE a.course_id = $1 AND a.submitted_at IS NOT NULL
      `, [targetCourseId]),

      // Q2: Score histogram
      queryMany<{ bucket: number; count: number }>(`
        SELECT FLOOR(s.overall / 10)::int as bucket, COUNT(*)::int as count
        FROM scores s JOIN attempts a ON s.attempt_id = a.attempt_id
        WHERE a.course_id = $1 AND a.submitted_at IS NOT NULL
        GROUP BY bucket ORDER BY bucket
      `, [targetCourseId]),

      // Q3: Per-item stats
      queryMany<{
        item_id: string; subdomain: string; domain: string; key: string;
        stem: string; options: Array<{ id: string; text: string }>;
        total: number; correct: number; incorrect: number;
        confident_errors: number; uncertain_correct: number;
      }>(`
        SELECT i.item_id, i.subdomain, i.domain, i.key, i.stem, i.options,
          COUNT(r.response_id)::int as total,
          COUNT(CASE WHEN r.score = 100 THEN 1 END)::int as correct,
          COUNT(CASE WHEN r.score = 0 THEN 1 END)::int as incorrect,
          COUNT(CASE WHEN r.score = 0 AND r.confidence = 3 THEN 1 END)::int as confident_errors,
          COUNT(CASE WHEN r.score = 100 AND r.confidence <= 2 THEN 1 END)::int as uncertain_correct
        FROM items i JOIN responses r ON i.item_id = r.item_id
        JOIN attempts a ON r.attempt_id = a.attempt_id
        WHERE i.is_anchor = true AND i.is_scored = true
          AND a.course_id = $1 AND a.submitted_at IS NOT NULL
        GROUP BY i.item_id, i.subdomain, i.domain, i.key, i.stem, i.options
        ORDER BY (SUBSTRING(i.item_id FROM '(\\d+)')::integer)
      `, [targetCourseId]),

      // Q4: Distractor distribution
      queryMany<{ item_id: string; distractor: string; n: number }>(`
        SELECT r.item_id, UPPER(TRIM(BOTH '"' FROM r.raw_answer::text)) as distractor, COUNT(*)::int as n
        FROM responses r JOIN items i ON r.item_id = i.item_id
        JOIN attempts a ON r.attempt_id = a.attempt_id
        WHERE i.is_anchor = true AND i.is_scored = true AND r.score = 0
          AND a.course_id = $1 AND a.submitted_at IS NOT NULL
        GROUP BY r.item_id, distractor
      `, [targetCourseId]),

      // Q5: Confidence distribution (incorrect only, for confDist)
      queryMany<{ item_id: string; confidence: number; n: number }>(`
        SELECT r.item_id, r.confidence, COUNT(*)::int as n
        FROM responses r JOIN items i ON r.item_id = i.item_id
        JOIN attempts a ON r.attempt_id = a.attempt_id
        WHERE i.is_anchor = true AND i.is_scored = true AND r.score = 0
          AND a.course_id = $1 AND a.submitted_at IS NOT NULL
        GROUP BY r.item_id, r.confidence
      `, [targetCourseId]),

      // Q6: SDM counts per anchor
      queryMany<{ anchor_id: string; variant_type: string; n: number }>(`
        SELECT SPLIT_PART(i.item_id, '_', 1) as anchor_id, i.variant_type, COUNT(*)::int as n
        FROM responses r JOIN items i ON r.item_id = i.item_id
        JOIN attempts a ON r.attempt_id = a.attempt_id
        WHERE i.variant_type IN ('Open_Diagnose', 'Open_Confirm')
          AND a.course_id = $1 AND a.submitted_at IS NOT NULL
        GROUP BY anchor_id, i.variant_type
      `, [targetCourseId]),

      // Q7: Misconceptions with evidence
      queryMany<{
        anchor_id: string; tag: string; diagnosis_type: string;
        reasoning: string; evidence_quote: string; student_answer: string;
      }>(`
        SELECT SPLIT_PART(i.item_id, '_', 1) as anchor_id,
          r.ai_flags->>'layer2_tag' as tag,
          r.ai_flags->>'diagnosis_type' as diagnosis_type,
          r.ai_flags->>'reasoning_summary' as reasoning,
          r.ai_flags->>'evidence_quote' as evidence_quote,
          TRIM(BOTH '"' FROM r.raw_answer::text) as student_answer
        FROM responses r JOIN items i ON r.item_id = i.item_id
        JOIN attempts a ON r.attempt_id = a.attempt_id
        WHERE i.variant_type = 'Open_Diagnose'
          AND a.course_id = $1 AND a.submitted_at IS NOT NULL
          AND r.ai_flags IS NOT NULL AND r.ai_flags->>'layer2_tag' IS NOT NULL
          AND r.ai_flags->>'layer2_tag' != ''
      `, [targetCourseId]),

      // Q8: Total possible misconception types (true misconceptions only, global)
      queryOne<{ total: number }>(`
        SELECT COUNT(DISTINCT ai_flags->>'layer2_tag')::int as total
        FROM responses r JOIN items i ON r.item_id = i.item_id
        WHERE i.variant_type = 'Open_Diagnose' AND r.ai_flags IS NOT NULL
          AND r.ai_flags->>'diagnosis_type' = 'misconception'
          AND r.ai_flags->>'layer2_tag' IS NOT NULL
          AND r.ai_flags->>'layer2_tag' != ''
      `),

      // Q9: Student count
      queryOne<{ count: number }>(`
        SELECT COUNT(*)::int as count FROM attempts
        WHERE course_id = $1 AND submitted_at IS NOT NULL
      `, [targetCourseId]),
    ]);

    const students = studentCount?.count || 0;
    const meanScore = Number(scoreStats?.mean_score) || 0;
    const medianScore = Number(scoreStats?.median_score) || 0;

    // Build score distribution array (10 buckets: 0-9, 10-19, ..., 90-100)
    const scoreDistArray = new Array(10).fill(0);
    for (const row of scoreDist) {
      const b = row.bucket;
      if (b >= 0 && b <= 9) {
        scoreDistArray[b] += row.count;
      } else if (b === 10) {
        // Score of exactly 100 goes in the last bucket
        scoreDistArray[9] += row.count;
      }
    }

    // Build lookup maps for per-item assembly
    const distractorMap: Record<string, Record<string, number>> = {};
    for (const row of distractors) {
      if (!distractorMap[row.item_id]) distractorMap[row.item_id] = {};
      distractorMap[row.item_id][row.distractor] = row.n;
    }

    const confDistMap: Record<string, { low: number; med: number; high: number }> = {};
    for (const row of confDists) {
      if (!confDistMap[row.item_id]) confDistMap[row.item_id] = { low: 0, med: 0, high: 0 };
      if (row.confidence === 1) confDistMap[row.item_id].low = row.n;
      else if (row.confidence === 2) confDistMap[row.item_id].med = row.n;
      else if (row.confidence === 3) confDistMap[row.item_id].high = row.n;
    }

    const sdmMap: Record<string, { diagnoseN: number; confirmN: number }> = {};
    for (const row of sdmCounts) {
      if (!sdmMap[row.anchor_id]) sdmMap[row.anchor_id] = { diagnoseN: 0, confirmN: 0 };
      if (row.variant_type === 'Open_Diagnose') sdmMap[row.anchor_id].diagnoseN = row.n;
      else if (row.variant_type === 'Open_Confirm') sdmMap[row.anchor_id].confirmN = row.n;
    }

    // Aggregate misconceptions by anchor_id + tag
    const miscByItem: Record<string, Record<string, {
      tag: string; diagnosisType: string; n: number;
      evidence: Array<{ studentAnswer: string; reasoning: string; evidenceQuote: string }>;
    }>> = {};

    for (const row of misconceptionRows) {
      if (!miscByItem[row.anchor_id]) miscByItem[row.anchor_id] = {};
      if (!miscByItem[row.anchor_id][row.tag]) {
        miscByItem[row.anchor_id][row.tag] = {
          tag: row.tag,
          diagnosisType: row.diagnosis_type,
          n: 0,
          evidence: [],
        };
      }
      const entry = miscByItem[row.anchor_id][row.tag];
      entry.n++;
      // Keep up to 5 evidence items per tag per item
      if (entry.evidence.length < 5 && row.student_answer) {
        entry.evidence.push({
          studentAnswer: row.student_answer,
          reasoning: row.reasoning || '',
          evidenceQuote: row.evidence_quote || '',
        });
      }
    }

    // Total SDM counts
    let totalDiagnose = 0;
    let totalConfirm = 0;
    for (const val of Object.values(sdmMap)) {
      totalDiagnose += val.diagnoseN;
      totalConfirm += val.confirmN;
    }

    // Assemble items
    const items = itemStats.map(row => {
      const id = row.item_id;
      const total = row.total;
      const correct = row.correct;
      const incorrect = row.incorrect;
      const pctCorrect = total > 0 ? Math.round(correct / total * 1000) / 10 : 0;
      const pctIncorrect = total > 0 ? Math.round(incorrect / total * 1000) / 10 : 0;
      const confidentErrors = row.confident_errors;
      const pctConfErrors = total > 0 ? Math.round(confidentErrors / total * 1000) / 10 : 0;
      const sdm = sdmMap[id] || { diagnoseN: 0, confirmN: 0 };

      // Build misconceptions for this item
      const itemMiscs = miscByItem[id] || {};
      const misconceptions = Object.values(itemMiscs)
        .map(m => ({
          tag: m.tag,
          label: getTagLabel(m.tag),
          diagnosisType: m.diagnosisType,
          pct: sdm.diagnoseN > 0 ? Math.round(m.n / sdm.diagnoseN * 100) : 0,
          n: m.n,
          evidence: m.evidence,
        }))
        .sort((a, b) => b.n - a.n);

      return {
        id,
        subdomain: row.subdomain,
        domain: SHORT_NAMES[row.domain] || row.domain,
        stem: row.stem,
        options: row.options,
        key: row.key,
        total,
        correct,
        incorrect,
        pctCorrect,
        pctIncorrect,
        confidentErrors,
        pctConfErrors,
        uncertainCorrect: row.uncertain_correct,
        diagnoseN: sdm.diagnoseN,
        confirmN: sdm.confirmN,
        distractors: distractorMap[id] || {},
        confDist: confDistMap[id] || { low: 0, med: 0, high: 0 },
        misconceptions,
      };
    });

    // Build domain summary from items
    const domainAccum: Record<string, { correct: number; total: number; confErrors: number; itemCount: number }> = {};
    for (const item of items) {
      if (!domainAccum[item.domain]) domainAccum[item.domain] = { correct: 0, total: 0, confErrors: 0, itemCount: 0 };
      domainAccum[item.domain].correct += item.correct;
      domainAccum[item.domain].total += item.total;
      domainAccum[item.domain].confErrors += item.confidentErrors;
      domainAccum[item.domain].itemCount++;
    }
    const domains = Object.entries(domainAccum).map(([name, d]) => ({
      name,
      pctCorrect: d.total > 0 ? Math.round(d.correct / d.total * 1000) / 10 : 0,
      totalConfErrors: d.confErrors,
      itemCount: d.itemCount,
    }));

    // Misconception summary (true misconceptions only)
    const detectedMiscTags = new Set<string>();
    for (const item of items) {
      for (const m of item.misconceptions) {
        if (m.diagnosisType === 'misconception') {
          detectedMiscTags.add(m.tag);
        }
      }
    }

    const data = {
      overall: {
        students,
        meanScore,
        medianScore,
        totalDiagnose,
        totalConfirm,
        scoreDist: scoreDistArray,
      },
      domains,
      items,
      misconceptionSummary: {
        detected: detectedMiscTags.size,
        possible: totalPossibleResult?.total || detectedMiscTags.size,
      },
    };

    return NextResponse.json({
      success: true,
      data,
      courses: instructorCourses.map(ic => ({
        id: ic.course_id,
        name: ic.course_name,
        accessLevel: ic.access_level,
      })),
    });

  } catch (error) {
    console.error('Instructor dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

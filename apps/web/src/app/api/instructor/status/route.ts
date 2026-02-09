import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { verifyInstructorToken } from '@/lib/instructor-auth';
import type {
  StaleLevel,
  StudentPosition,
  TileData,
  QuestLogItem,
  GameboardStatusResponse,
} from '@/lib/gameboard-types';

export const dynamic = 'force-dynamic';

function getStaleLevel(minutes: number): StaleLevel {
  if (minutes >= 1440) return 'red';     // 24h
  if (minutes >= 180) return 'amber';    // 3h
  if (minutes >= 15) return 'yellow';    // 15min
  return 'active';
}

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
      course_name: string;
    }>(
      `SELECT ic.course_id, c.name as course_name
       FROM instructor_courses ic
       JOIN courses c ON ic.course_id = c.course_id
       WHERE ic.instructor_id = $1`,
      [instructorId]
    );

    if (!instructorCourses || instructorCourses.length === 0) {
      return NextResponse.json({ success: true, courses: [], data: null });
    }

    const courseIds = instructorCourses.map(ic => ic.course_id);
    const targetCourseId = courseId || courseIds[0];

    if (!courseIds.includes(targetCourseId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Single optimized query: get latest attempt per student with response count and last activity
    const rows = await queryMany<{
      user_id: string;
      hashed_student_key: string;
      attempt_id: string | null;
      submitted_at: string | null;
      response_count: string; // pg returns bigint as string
      last_activity: string;
      stale_minutes: string;  // pg numeric as string
      tab_switches: number;
    }>(`
      WITH student_attempts AS (
        -- Latest attempt per student (prefer in-progress over submitted)
        SELECT DISTINCT ON (a.user_id)
          a.user_id,
          u.hashed_student_key,
          a.attempt_id,
          a.submitted_at,
          a.metadata,
          a.started_at
        FROM attempts a
        JOIN users u ON u.user_id = a.user_id
        WHERE a.course_id = $1
        ORDER BY a.user_id, a.submitted_at NULLS FIRST, a.started_at DESC
      )
      SELECT
        sa.user_id,
        sa.hashed_student_key,
        sa.attempt_id,
        sa.submitted_at,
        COALESCE(rc.cnt, 0) as response_count,
        COALESCE(rc.last_resp, sa.started_at) as last_activity,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(rc.last_resp, sa.started_at))) / 60 as stale_minutes,
        COALESCE((sa.metadata->>'tabSwitches')::int, 0) as tab_switches
      FROM student_attempts sa
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as cnt, MAX(r.created_at) as last_resp
        FROM responses r
        WHERE r.attempt_id = sa.attempt_id
      ) rc ON true

      UNION ALL

      -- Onboarded-only students (profile exists, no attempt)
      SELECT
        sp.user_id,
        u.hashed_student_key,
        NULL as attempt_id,
        NULL as submitted_at,
        0 as response_count,
        sp.completed_at as last_activity,
        EXTRACT(EPOCH FROM (NOW() - sp.completed_at)) / 60 as stale_minutes,
        0 as tab_switches
      FROM student_profiles sp
      JOIN users u ON u.user_id = sp.user_id
      WHERE sp.course_id = $1
        AND NOT EXISTS (
          SELECT 1 FROM attempts a
          WHERE a.user_id = sp.user_id AND a.course_id = sp.course_id
        )
    `, [targetCourseId]);

    // Group into tiles, onboarded, submitted, questLog
    const tiles: Record<number, TileData> = {};
    const onboarded: StudentPosition[] = [];
    const submitted: StudentPosition[] = [];
    const questLog: QuestLogItem[] = [];
    let activeCount = 0;
    let staleCount = 0;

    for (const row of rows) {
      const responseCount = Number(row.response_count);
      const staleMins = Number(row.stale_minutes);
      const staleLevel = getStaleLevel(staleMins);
      const hashedShort = row.hashed_student_key.substring(0, 8);

      let position: number;
      let status: 'onboarded' | 'in_progress' | 'submitted';

      if (!row.attempt_id) {
        // Onboarded only
        position = 0;
        status = 'onboarded';
      } else if (row.submitted_at) {
        // Submitted
        position = 51;
        status = 'submitted';
      } else {
        // In progress - position is response count, capped at 50
        position = Math.min(responseCount, 50);
        status = 'in_progress';
      }

      const student: StudentPosition = {
        userId: row.user_id,
        hashedKey: hashedShort,
        position,
        status,
        lastActivity: row.last_activity,
        staleDurationMin: Math.round(staleMins),
        staleLevel,
        tabSwitches: row.tab_switches,
      };

      if (status === 'onboarded') {
        onboarded.push(student);
      } else if (status === 'submitted') {
        submitted.push(student);
      } else {
        // In-progress: place on tile
        const tile = position || 1; // minimum tile 1 if somehow 0 responses but has attempt
        if (!tiles[tile]) {
          tiles[tile] = { tileNumber: tile, students: [], activeCount: 0, staleCount: 0, totalCount: 0 };
        }
        tiles[tile].students.push(student);
        tiles[tile].totalCount++;
        if (staleLevel === 'active') {
          tiles[tile].activeCount++;
          activeCount++;
        } else {
          tiles[tile].staleCount++;
          staleCount++;
        }
      }

      // Quest Log: students stale >= 24h (in-progress only)
      if (status === 'in_progress' && staleMins >= 1440) {
        questLog.push({
          userId: row.user_id,
          hashedKey: hashedShort,
          position,
          staleDurationMin: Math.round(staleMins),
          staleLevel,
          tabSwitches: row.tab_switches,
        });
      }
    }

    // Sort quest log by stale duration descending
    questLog.sort((a, b) => b.staleDurationMin - a.staleDurationMin);

    const data: GameboardStatusResponse = {
      tiles,
      onboarded,
      submitted,
      questLog,
      summary: {
        active: activeCount,
        stale: staleCount,
        submitted: submitted.length,
        onboarded: onboarded.length,
        total: rows.length,
      },
    };

    return NextResponse.json({
      success: true,
      courses: instructorCourses.map(ic => ({ id: ic.course_id, name: ic.course_name })),
      data,
    });
  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

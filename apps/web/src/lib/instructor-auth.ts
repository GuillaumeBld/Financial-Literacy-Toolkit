import { queryOne } from './db';

/**
 * Verify instructor session token
 */
export async function verifyInstructorToken(token: string): Promise<string | null> {
  const session = await queryOne<{
    instructor_id: string;
    expires_at: string;
  }>(
    'SELECT instructor_id, expires_at FROM instructor_sessions WHERE token = $1',
    [token]
  );

  if (!session) {
    return null;
  }

  // Check if session expired
  if (new Date(session.expires_at) < new Date()) {
    return null;
  }

  return session.instructor_id;
}




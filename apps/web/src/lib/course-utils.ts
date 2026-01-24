/**
 * Course name utilities for handling course name normalization
 */

/**
 * Normalize course name for database queries
 * @param courseCode - The course code from user input
 * @returns Array of possible course names to search in database
 */
export function getCourseSearchNames(courseCode: string): string[] {
  const normalized = courseCode.trim();

  // Return the normalized course name
  return [normalized];
}

/**
 * Get display name for a course
 * @param courseName - The course name from database
 * @returns Display name for the course
 */
export function getCourseDisplayName(courseName: string): string {
  return courseName;
}

/**
 * Find course by name
 */
export async function findCourseByName(
  queryFn: (sql: string, params: any[]) => Promise<any>,
  courseCode: string
): Promise<{ course_id: string; name: string; pepper?: string } | null> {
  const searchNames = getCourseSearchNames(courseCode);

  for (const name of searchNames) {
    const result = await queryFn(
      'SELECT course_id, name, pepper FROM courses WHERE name = $1 LIMIT 1',
      [name]
    );

    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
  }

  return null;
}

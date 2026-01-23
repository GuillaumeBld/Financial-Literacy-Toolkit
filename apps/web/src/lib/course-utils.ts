/**
 * Course name utilities for handling course name normalization
 * Supports backward compatibility between "QUIN 102" and "Financial Literacy"
 */

/**
 * Normalize course name for database queries
 * Accepts both "QUIN 102" and "Financial Literacy" and returns the actual database name
 * @param courseCode - The course code from user input
 * @returns Array of possible course names to search in database
 */
export function getCourseSearchNames(courseCode: string): string[] {
  const normalized = courseCode.trim();
  
  // Map "QUIN 102" to both possible database names for backward compatibility
  if (normalized === 'QUIN 102' || normalized === 'quinn 102') {
    return ['QUIN 102', 'Financial Literacy'];
  }
  
  // Map "Financial Literacy" to both possible database names
  if (normalized === 'Financial Literacy' || normalized === 'financial literacy') {
    return ['Financial Literacy', 'QUIN 102'];
  }
  
  // For any other course name, just use it as-is
  return [normalized];
}

/**
 * Get display name for a course
 * Maps "Financial Literacy" to "QUIN 102" for display
 * @param courseName - The course name from database
 * @returns Display name for the course
 */
export function getCourseDisplayName(courseName: string): string {
  if (courseName === 'Financial Literacy') {
    return 'QUIN 102';
  }
  return courseName;
}

/**
 * Find course by name with backward compatibility
 * Tries both "QUIN 102" and "Financial Literacy" if needed
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


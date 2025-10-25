import { createHash } from 'crypto';

/**
 * FERPA-Compliant Authentication Utilities
 * No raw student IDs are stored - only hashed identifiers
 */

export class AuthUtils {
  /**
   * Create a hashed student key for authentication
   * @param coursePepper - Unique salt for the course
   * @param studentId - Raw student ID (not stored)
   * @returns SHA256 hash for database lookup
   */
  static createHashedStudentKey(coursePepper: string, studentId: string): string {
    // Normalize student ID (trim whitespace, convert to lowercase)
    const normalizedId = studentId.trim().toLowerCase();

    // Create hash: SHA256(course_pepper + normalized_student_id)
    const hash = createHash('sha256');
    hash.update(coursePepper + normalizedId);
    return hash.digest('hex');
  }

  /**
   * Verify a student ID against a hashed key
   * @param coursePepper - Course salt
   * @param studentId - Raw student ID to verify
   * @param hashedKey - Stored hash to compare against
   * @returns boolean indicating if the ID matches
   */
  static verifyStudentId(coursePepper: string, studentId: string, hashedKey: string): boolean {
    const computedHash = this.createHashedStudentKey(coursePepper, studentId);
    return computedHash === hashedKey;
  }

  /**
   * Generate a random course pepper
   * Should be stored securely and never exposed to client
   */
  static generateCoursePepper(): string {
    return createHash('sha256')
      .update(Math.random().toString() + Date.now().toString())
      .digest('hex')
      .substring(0, 32); // 32 character salt
  }

  /**
   * Validate student ID format
   * Basic validation - can be customized per institution
   */
  static validateStudentId(studentId: string): boolean {
    // Example: Loyola student IDs might be 9 digits
    const normalized = studentId.trim();
    return /^\d{6,12}$/.test(normalized); // 6-12 digits
  }

  /**
   * Validate course code format
   */
  static validateCourseCode(courseCode: string): boolean {
    // Example: Course codes like "FINA 301", "BUSN 202"
    const normalized = courseCode.trim().toUpperCase();
    return /^[A-Z]{2,4}\s*\d{3}$/.test(normalized);
  }
}

/**
 * Session management for assessment attempts
 */
export class SessionManager {
  private static readonly SESSION_KEY = 'financial-literacy-session';

  static createSession(courseId: string, instrumentId: string, attemptType: 'pre' | 'post') {
    const session = {
      courseId,
      instrumentId,
      attemptType,
      startedAt: new Date().toISOString(),
      sessionId: createHash('sha256')
        .update(courseId + instrumentId + attemptType + Date.now())
        .digest('hex')
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    return session;
  }

  static getSession() {
    if (typeof window === 'undefined') return null;

    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  static clearSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  static isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    // Check if session is not older than 24 hours
    const sessionAge = Date.now() - new Date(session.startedAt).getTime();
    return sessionAge < 24 * 60 * 60 * 1000; // 24 hours
  }
}

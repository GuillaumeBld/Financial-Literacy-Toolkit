import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';
import { findCourseByName } from '@/lib/course-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseCode,
      studentId,
      email,
      password,
      demographic,
      financial_background,
      socioeconomic,
    } = body;

    // Validate required fields
    if (!courseCode || !studentId || !email || !password) {
      return NextResponse.json(
        { error: 'Course code, student ID, email, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Use transaction for all database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      // Supports both "QUINN 102" and "Financial Literacy" for backward compatibility
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Invalid course code');
      }

      // Create hashed student key (FERPA compliant)
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      // Hash password
      const hashedPassword = AuthUtils.hashPassword(password);

      // Find or create user
      let user = await client.query(
        'SELECT user_id, hashed_password FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        // Create new user with password
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key, hashed_password, sso_provider) VALUES ($1, $2, $3) RETURNING user_id',
          [hashedStudentKey, hashedPassword, 'hashed']
        );
        user = newUser;
      } else {
        // Update existing user's password if not set, or if onboarding is being redone
        if (!user.rows[0].hashed_password) {
          await client.query(
            'UPDATE users SET hashed_password = $1 WHERE user_id = $2',
            [hashedPassword, user.rows[0].user_id]
          );
        }
      }

      // Enroll user in course (regardless of whether user was created or updated)
      await client.query(
        'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [user.rows[0].user_id, courseData.course_id, 'student']
      );

      const userId = user.rows[0].user_id;

      // Check if profile already exists
      const existingProfile = await client.query(
        'SELECT profile_id FROM student_profiles WHERE user_id = $1 AND course_id = $2',
        [userId, courseData.course_id]
      );

      // Prepare profile data
      const profileData = {
        user_id: userId,
        course_id: courseData.course_id,
        email: email.trim().toLowerCase(), // Required email for password recovery
        // Baseline B1-B5 (Demographics)
        age_range: demographic?.age_range || null, // B3
        gender: demographic?.gender || null, // B1
        race_ethnicity: demographic?.race_ethnicity || null, // B2
        first_language: demographic?.first_language || null, // B4
        first_language_other: demographic?.first_language_other || null, // B4: Other
        work_experience: demographic?.work_experience || null, // B5
        // Baseline B6-B8 (Financial Background)
        // Note: PostgreSQL node-postgres driver automatically handles JSONB conversion
        // Pass array directly, driver will serialize to JSONB
        prior_financial_products: financial_background?.prior_financial_products || null, // B6: JSONB array
        self_rated_financial_knowledge: financial_background?.self_rated_financial_knowledge || null, // B7
        financial_stress_frequency: financial_background?.financial_stress_frequency || null, // B8
        // Additional socioeconomic data
        household_income: socioeconomic?.household_income || null,
        parental_education: socioeconomic?.parental_education || null,
        first_generation_college: socioeconomic?.first_generation_college ?? null,
        financial_aid_recipient: socioeconomic?.financial_aid_recipient ?? null,
        living_situation: socioeconomic?.living_situation || null,
        work_study: socioeconomic?.work_study ?? null,
      };

      if (existingProfile.rows && existingProfile.rows.length > 0) {
        // Update existing profile
        await client.query(
          `UPDATE student_profiles SET
            email = $1,
            age_range = $2,
            gender = $3,
            race_ethnicity = $4,
            first_language = $5,
            first_language_other = $6,
            work_experience = $7,
            prior_financial_products = $8,
            self_rated_financial_knowledge = $9,
            financial_stress_frequency = $10,
            household_income = $11,
            parental_education = $12,
            first_generation_college = $13,
            financial_aid_recipient = $14,
            living_situation = $15,
            work_study = $16,
            updated_at = NOW()
          WHERE user_id = $17 AND course_id = $18`,
          [
            profileData.email,
            profileData.age_range,
            profileData.gender,
            profileData.race_ethnicity,
            profileData.first_language,
            profileData.first_language_other,
            profileData.work_experience,
            profileData.prior_financial_products,
            profileData.self_rated_financial_knowledge,
            profileData.financial_stress_frequency,
            profileData.household_income,
            profileData.parental_education,
            profileData.first_generation_college,
            profileData.financial_aid_recipient,
            profileData.living_situation,
            profileData.work_study,
            userId,
            courseData.course_id,
          ]
        );
      } else {
        // Insert new profile
        await client.query(
          `INSERT INTO student_profiles (
            user_id, course_id, email, age_range, gender, race_ethnicity,
            first_language, first_language_other, work_experience,
            prior_financial_products, self_rated_financial_knowledge, financial_stress_frequency,
            household_income, parental_education,
            first_generation_college, financial_aid_recipient,
            living_situation, work_study
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
          [
            profileData.user_id,
            profileData.course_id,
            profileData.email,
            profileData.age_range,
            profileData.gender,
            profileData.race_ethnicity,
            profileData.first_language,
            profileData.first_language_other,
            profileData.work_experience,
            profileData.prior_financial_products,
            profileData.self_rated_financial_knowledge,
            profileData.financial_stress_frequency,
            profileData.household_income,
            profileData.parental_education,
            profileData.first_generation_college,
            profileData.financial_aid_recipient,
            profileData.living_situation,
            profileData.work_study,
          ]
        );
      }

      return {
        success: true,
        userId,
        courseId: courseData.course_id,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding data saved successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error saving onboarding data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}


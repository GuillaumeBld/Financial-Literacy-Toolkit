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
      research_consent, // boolean (true/false/null) - optional research consent
      research_consent_timestamp,
      research_consent_version,
      demographic,
      financial_background,
      financial_background_extended, // B9-B13: parental_education, first_generation_college, has_student_loan_debt, student_loan_interest_rate, student_loan_maturity
      socioeconomic, // Additional optional fields: household_income, financial_aid_recipient, living_situation, work_study
    } = body;

    // Validate required fields (password removed - no longer collecting passwords)
    if (!courseCode || !studentId) {
      return NextResponse.json(
        { error: 'Course code and student ID are required' },
        { status: 400 }
      );
    }

    // Password validation removed - no longer collecting passwords

    // Use transaction for all database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      // Look up course by name
      const courseData = await findCourseByName(
        (sql: string, params: any[]) => client.query(sql, params),
        courseCode as string
      );

      if (!courseData || !courseData.pepper) {
        throw new Error('Invalid course code');
      }

      // Create hashed student key (FERPA compliant) - used for linking pre/post assessments
      if (!studentId) {
        throw new Error('Student ID is required');
      }
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      // Password removed - no longer collecting passwords
      // Users are linked via hashed_student_key (Student ID + Course Code hash)

      // Find or create user (NO PASSWORD)
      let user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        // Create new user WITHOUT password (password-free authentication)
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, $2) RETURNING user_id',
          [hashedStudentKey, 'hashed'] // sso_provider = 'hashed' indicates hashed_student_key linking
        );
        user = newUser;
      }
      // No password update logic - passwords are not used

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
      // Create or update student profile
      const profileData = {
        user_id: userId,
        course_id: courseData.course_id,
        email: null, // Email not collected (password-free authentication via hashed student key)
        // Research consent (Step 0)
        research_consent: research_consent || null,
        research_consent_timestamp: research_consent_timestamp || null,
        research_consent_version: research_consent_version || null,
        // Baseline B1-B5 (Demographics)
        age_range: demographic?.age_range || null, // B3
        gender: demographic?.gender || null, // B1
        race_ethnicity: demographic?.race_ethnicity || null, // B2
        first_language: demographic?.first_language || null, // B4
        first_language_other: demographic?.first_language_other || null, // B4: Other
        work_experience: demographic?.work_experience || null, // B5
        // Baseline B6-B8 (Financial Background)
        // Explicitly stringify array for JSONB column
        prior_financial_products: financial_background?.prior_financial_products
          ? JSON.stringify(financial_background.prior_financial_products)
          : null, // B6: JSONB array
        self_rated_financial_knowledge: financial_background?.self_rated_financial_knowledge || null, // B7
        financial_stress_frequency: financial_background?.financial_stress_frequency || null, // B8
        // Baseline B9-B13 (Financial Background Extended)
        parental_education: financial_background_extended?.parental_education || null, // B9
        first_generation_college: financial_background_extended?.first_generation_college || null, // B10
        has_student_loan_debt: financial_background_extended?.has_student_loan_debt || null, // B11
        student_loan_interest_rate: financial_background_extended?.student_loan_interest_rate || null, // B12
        student_loan_maturity: financial_background_extended?.student_loan_maturity || null, // B13
        // Additional optional socioeconomic data
        household_income: socioeconomic?.household_income || null,
        financial_aid_recipient: socioeconomic?.financial_aid_recipient ?? null,
        living_situation: socioeconomic?.living_situation || null,
        work_study: socioeconomic?.work_study ?? null,
      };

      if (existingProfile.rows && existingProfile.rows.length > 0) {
        // Update existing profile
        await client.query(
          `UPDATE student_profiles SET
            email = $1,
            research_consent = $2,
            research_consent_timestamp = $3,
            research_consent_version = $4,
            age_range = $5,
            gender = $6,
            race_ethnicity = $7,
            first_language = $8,
            first_language_other = $9,
            work_experience = $10,
            prior_financial_products = $11,
            self_rated_financial_knowledge = $12,
            financial_stress_frequency = $13,
            household_income = $14,
            parental_education = $15,
            first_generation_college = $16,
            financial_aid_recipient = $17,
            has_student_loan_debt = $18,
            student_loan_interest_rate = $19,
            student_loan_maturity = $20,
            living_situation = $21,
            work_study = $22,
            updated_at = NOW()
          WHERE user_id = $23 AND course_id = $24`,
          [
            profileData.email,
            profileData.research_consent,
            profileData.research_consent_timestamp,
            profileData.research_consent_version,
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
            profileData.has_student_loan_debt,
            profileData.student_loan_interest_rate,
            profileData.student_loan_maturity,
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
            user_id, course_id, email, research_consent, research_consent_timestamp, research_consent_version,
            age_range, gender, race_ethnicity,
            first_language, first_language_other, work_experience,
            prior_financial_products, self_rated_financial_knowledge, financial_stress_frequency,
            household_income, parental_education,
            first_generation_college, financial_aid_recipient,
            has_student_loan_debt, student_loan_interest_rate, student_loan_maturity,
            living_situation, work_study
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            profileData.user_id,
            profileData.course_id,
            profileData.email,
            profileData.research_consent,
            profileData.research_consent_timestamp,
            profileData.research_consent_version,
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
            profileData.has_student_loan_debt,
            profileData.student_loan_interest_rate,
            profileData.student_loan_maturity,
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


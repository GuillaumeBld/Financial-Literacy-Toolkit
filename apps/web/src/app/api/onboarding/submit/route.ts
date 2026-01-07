import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { AuthUtils } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseCode,
      studentId,
      demographic,
      socioeconomic,
    } = body;

    // Validate required fields
    if (!courseCode || !studentId) {
      return NextResponse.json(
        { error: 'Course code and student ID are required' },
        { status: 400 }
      );
    }

    // Use transaction for all database operations
    const result = await transaction(async (client) => {
      // Get course information (including pepper for hashing)
      const course = await client.query(
        'SELECT course_id, pepper FROM courses WHERE name = $1 LIMIT 1',
        [courseCode.trim()]
      );

      if (!course.rows || course.rows.length === 0) {
        throw new Error('Invalid course code');
      }

      const courseData = course.rows[0];

      // Create hashed student key (FERPA compliant)
      const hashedStudentKey = AuthUtils.createHashedStudentKey(courseData.pepper, studentId);

      // Find or create user
      let user = await client.query(
        'SELECT user_id FROM users WHERE hashed_student_key = $1',
        [hashedStudentKey]
      );

      if (!user.rows || user.rows.length === 0) {
        // Create new user
        const newUser = await client.query(
          'INSERT INTO users (hashed_student_key, sso_provider) VALUES ($1, $2) RETURNING user_id',
          [hashedStudentKey, 'hashed']
        );
        user = newUser;

        // Enroll user in course
        await client.query(
          'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.rows[0].user_id, courseData.course_id, 'student']
        );
      } else {
        // Ensure enrollment exists
        await client.query(
          'INSERT INTO enrollments (user_id, course_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [user.rows[0].user_id, courseData.course_id, 'student']
        );
      }

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
        age: demographic?.age || null,
        gender: demographic?.gender || null,
        race_ethnicity: demographic?.race_ethnicity || null,
        household_income: socioeconomic?.household_income || null,
        parental_education: socioeconomic?.parental_education || null,
        employment_status: socioeconomic?.employment_status || null,
        first_generation_college: socioeconomic?.first_generation_college ?? null,
        financial_aid_recipient: socioeconomic?.financial_aid_recipient ?? null,
        living_situation: socioeconomic?.living_situation || null,
        work_study: socioeconomic?.work_study ?? null,
      };

      if (existingProfile.rows && existingProfile.rows.length > 0) {
        // Update existing profile
        await client.query(
          `UPDATE student_profiles SET
            age = $1,
            gender = $2,
            race_ethnicity = $3,
            household_income = $4,
            parental_education = $5,
            employment_status = $6,
            first_generation_college = $7,
            financial_aid_recipient = $8,
            living_situation = $9,
            work_study = $10,
            updated_at = NOW()
          WHERE user_id = $11 AND course_id = $12`,
          [
            profileData.age,
            profileData.gender,
            profileData.race_ethnicity,
            profileData.household_income,
            profileData.parental_education,
            profileData.employment_status,
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
            user_id, course_id, age, gender, race_ethnicity,
            household_income, parental_education, employment_status,
            first_generation_college, financial_aid_recipient,
            living_situation, work_study
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            profileData.user_id,
            profileData.course_id,
            profileData.age,
            profileData.gender,
            profileData.race_ethnicity,
            profileData.household_income,
            profileData.parental_education,
            profileData.employment_status,
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


import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';

// Simple password verification (REPLACE WITH BCRYPT IN PRODUCTION)
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  const hash = createHash('sha256').update(plainPassword).digest('hex');
  return hash === hashedPassword;
}

export async function POST(request: NextRequest) {
  console.log('=== INSTRUCTOR LOGIN START ===');
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find instructor by email
    const instructor = await queryOne<{
      instructor_id: string;
      email: string;
      hashed_password: string;
    }>(
      'SELECT instructor_id, email, hashed_password FROM instructors WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!instructor) {
      console.log('Instructor not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, instructor.hashed_password);
    
    if (!isValidPassword) {
      console.log('Invalid password for:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await query(
      'INSERT INTO instructor_sessions (instructor_id, token, expires_at) VALUES ($1, $2, $3)',
      [instructor.instructor_id, token, expiresAt.toISOString()]
    );

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      token,
      instructor: {
        id: instructor.instructor_id,
        email: instructor.email,
        name: instructor.email.split('@')[0]
      }
    });

  } catch (error) {
    console.error('=== INSTRUCTOR LOGIN ERROR ===', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { randomBytes } from 'crypto';

// Simple bcrypt-like password verification (you'll need to install bcryptjs)
// For now, using a simple hash comparison (REPLACE WITH BCRYPT IN PRODUCTION)
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(plainPassword).digest('hex');
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
    const { data: instructor, error: instructorError } = await supabase
      .from('instructors')
      .select('instructor_id, email, hashed_password, full_name, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (instructorError || !instructor) {
      console.log('Instructor not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!instructor.is_active) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
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

    const { error: sessionError } = await supabase
      .from('instructor_sessions')
      .insert({
        instructor_id: instructor.instructor_id,
        token,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Update last login
    await supabase
      .from('instructors')
      .update({ last_login_at: new Date().toISOString() })
      .eq('instructor_id', instructor.instructor_id);

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      token,
      instructor: {
        id: instructor.instructor_id,
        email: instructor.email,
        name: instructor.full_name
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

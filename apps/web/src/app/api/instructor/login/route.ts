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
      .select('id, email, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (instructorError || !instructor) {
      console.log('Instructor not found:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, instructor.password_hash);
    
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
        instructor_id: instructor.id,
        token_hash: token,
        expires_at: expiresAt.toISOString()
      });

    if (sessionError) {
      console.error('Failed to create session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Note: last_login_at column doesn't exist yet in database
    // Skipping last login update for now

    console.log('Login successful for:', email);

    return NextResponse.json({
      success: true,
      token,
      instructor: {
        id: instructor.id,
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

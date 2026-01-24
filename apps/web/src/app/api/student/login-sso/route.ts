import { NextRequest, NextResponse } from 'next/server';

// SSO login has been deprecated - using hashed student key authentication (no password required)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'SSO login has been deprecated. Please use standard login with course code and student ID.' },
    { status: 410 }
  );
}

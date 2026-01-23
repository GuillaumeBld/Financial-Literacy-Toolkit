import { NextRequest, NextResponse } from 'next/server';

// SSO login has been deprecated - using password authentication via hashed student key
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'SSO login has been deprecated. Please use standard login with student ID and password.' },
    { status: 410 }
  );
}

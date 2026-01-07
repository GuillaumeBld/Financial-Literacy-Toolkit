import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fast database ping to verify connection (timeout in 2s)
    const startTime = Date.now();
    await queryMany('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    // Return 503 Service Unavailable if database is down
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

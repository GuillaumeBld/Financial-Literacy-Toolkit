import { NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Readiness probe - checks if the service can handle requests
 * Includes database connectivity and critical dependency checks
 *
 * Used by external monitors (Uptime Kuma) to detect service degradation
 *
 * Returns:
 * - 200 OK: Service is ready to handle requests
 * - 503 Service Unavailable: Service is alive but not ready (DB down, etc.)
 */
export async function GET() {
  try {
    // Fast database ping to verify connection
    const startTime = Date.now();
    await queryMany('SELECT 1 as readiness_check');
    const dbResponseTime = Date.now() - startTime;

    // Service is ready
    return NextResponse.json({
      status: 'ready',
      service: 'financial-literacy-web',
      checks: {
        database: {
          status: 'connected',
          responseTime: `${dbResponseTime}ms`
        }
      },
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    // Service is alive but not ready (dependencies unavailable)
    return NextResponse.json({
      status: 'not_ready',
      service: 'financial-literacy-web',
      checks: {
        database: {
          status: 'disconnected',
          error: error instanceof Error ? error.message : String(error)
        }
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

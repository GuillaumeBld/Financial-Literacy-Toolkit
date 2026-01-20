import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Liveness probe - checks if the web process is alive
 * Used by Docker/Dokploy health checks for restart decisions
 *
 * IMPORTANT: Does NOT check database or external dependencies
 * to avoid restart loops when dependencies are down.
 *
 * For dependency checks, use /api/readyz instead.
 */
export async function GET() {
  // Simple liveness check - process is running and can respond
  return NextResponse.json({
    status: 'ok',
    service: 'financial-literacy-web',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const items = await queryMany<{
      item_id: string;
      stem: string;
      type: string;
      domain: string;
      options: any;
      key: string | null;
    }>(
      'SELECT item_id, stem, type, domain, options, key FROM items ORDER BY item_id'
      );

    return NextResponse.json({
      success: true,
      items,
      count: items.length
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

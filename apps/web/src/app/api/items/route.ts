import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { data: items, error } = await supabase
      .from('items')
      .select('item_id, stem, type, domain, options, key')
      .order('item_id');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch items', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items,
      count: items?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

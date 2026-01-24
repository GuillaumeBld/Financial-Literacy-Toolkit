import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';

// Mark as dynamic to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = (searchParams.get('kind') || 'all').toLowerCase();

    const columns = await queryMany<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'items'"
    );
    const columnSet = new Set(columns.map((c) => c.column_name));
    const hasIsActive = columnSet.has('is_active');
    const hasIsSdm = columnSet.has('is_sdm');
    const hasIsScored = columnSet.has('is_scored');
    const hasExternalItemId = columnSet.has('external_item_id');
    const hasAnchorItemId = columnSet.has('anchor_item_id');
    const hasVariantType = columnSet.has('variant_type');
    const hasTriggerCondition = columnSet.has('trigger_condition');
    const hasSubdomain = columnSet.has('subdomain');

    if (kind === 'sdm' && !hasIsSdm) {
      return NextResponse.json({
        success: true,
        items: [],
        count: 0,
      });
    }

    const where: string[] = [];
    if (hasIsActive) {
      where.push('is_active = true');
    }
    if (kind === 'anchor') {
      where.push('is_anchor = true');
    } else if (kind === 'sdm') {
      where.push('is_sdm = true');
    }

    const selectIsSdm = hasIsSdm ? 'is_sdm' : 'NULL::boolean as is_sdm';
    const selectIsScored = hasIsScored ? 'is_scored' : 'true::boolean as is_scored';
    const selectExternalItemId = hasExternalItemId ? 'external_item_id' : 'NULL::text as external_item_id';
    const selectAnchorItemId = hasAnchorItemId ? 'anchor_item_id' : 'NULL::uuid as anchor_item_id';
    const selectVariantType = hasVariantType ? 'variant_type' : 'NULL::text as variant_type';
    const selectTriggerCondition = hasTriggerCondition ? 'trigger_condition' : 'NULL::text as trigger_condition';
    const selectSubdomain = hasSubdomain ? 'subdomain' : 'NULL::text as subdomain';

    // Build ORDER BY clause based on item kind
    // Anchor questions should be ordered by external_item_id (1, 2, 3... 40)
    // SDM questions should be ordered by anchor_item_id then variant_type for consistency
    let orderBy = 'item_id';
    if (kind === 'anchor' && hasExternalItemId) {
      // Cast to integer for proper numeric sorting (1, 2, 3 not 1, 10, 11, 2...)
      orderBy = 'CAST(NULLIF(external_item_id, \'\') AS INTEGER) NULLS LAST, item_id';
    } else if (kind === 'sdm' && hasAnchorItemId) {
      orderBy = 'anchor_item_id, variant_type, item_id';
    }

    const items = await queryMany<{
      item_id: string;
      stem: string;
      type: string;
      domain: string;
      subdomain: string | null;
      options: any;
      key: string | null;
      is_anchor: boolean | null;
      is_sdm: boolean | null;
      is_scored: boolean | null;
      external_item_id: string | null;
      anchor_item_id: string | null;
      variant_type: string | null;
      trigger_condition: string | null;
    }>(
      `SELECT item_id, stem, type, domain, ${selectSubdomain}, options, key, is_anchor, ${selectIsSdm}, ${selectIsScored}, ${selectExternalItemId}, ${selectAnchorItemId}, ${selectVariantType}, ${selectTriggerCondition}
       FROM items
       ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${orderBy}`
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

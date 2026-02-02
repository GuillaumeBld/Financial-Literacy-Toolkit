/**
 * Pre-Launch Smoke Script
 *
 * Hits production endpoints with read-only checks to verify everything works.
 * Run: npx tsx scripts/pre-launch-smoke.ts
 * Or:  BASE_URL=https://your-domain.com npx tsx scripts/pre-launch-smoke.ts
 *
 * Exits with code 1 if any check fails.
 */

const BASE_URL = process.env.BASE_URL || 'https://fin-lit.loyola.dev';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function pass(label: string) {
  console.log(`  ✓ ${label}`);
  passed++;
}

function fail(label: string, reason?: string) {
  const msg = reason ? `${label} — ${reason}` : label;
  console.log(`  ✗ ${msg}`);
  failed++;
  failures.push(msg);
}

async function fetchJson(path: string, options?: RequestInit): Promise<{ status: number; headers: Headers; data: any; elapsed: number }> {
  const url = `${BASE_URL}${path}`;
  const start = Date.now();
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const elapsed = Date.now() - start;
  let data: any;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, headers: res.headers, data, elapsed };
}

// Cache items response for reuse across checks
let cachedItemsResponse: { status: number; headers: Headers; data: any; elapsed: number } | null = null;

async function getAnchorItems() {
  if (!cachedItemsResponse) {
    cachedItemsResponse = await fetchJson('/api/items?kind=anchor');
  }
  return cachedItemsResponse;
}

async function main() {
  console.log(`=== Pre-Launch Smoke Test ===`);
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Liveness
  console.log('[1] Liveness');
  try {
    const { status, data } = await fetchJson('/api/healthz');
    if (status === 200 && data?.status === 'ok') {
      pass('GET /api/healthz → 200, status=ok');
    } else {
      fail('Liveness', `status=${status}, data.status=${data?.status}`);
    }
  } catch (e: any) {
    fail('Liveness', e.message);
  }

  // 2. Readiness + DB
  console.log('\n[2] Readiness + DB');
  let readyzElapsed = 0;
  try {
    const { status, data, elapsed } = await fetchJson('/api/readyz');
    readyzElapsed = elapsed;
    if (status === 200 && data?.checks?.database?.status === 'connected') {
      pass('GET /api/readyz → 200, database connected');
    } else {
      fail('Readiness', `status=${status}, db=${data?.checks?.database?.status}`);
    }
  } catch (e: any) {
    fail('Readiness', e.message);
  }

  // 3. Anchor items count = 40
  console.log('\n[3] Anchor items');
  try {
    const { status, data } = await getAnchorItems();
    if (status === 200 && data?.count === 40) {
      pass(`GET /api/items?kind=anchor → count=${data.count}`);
    } else {
      fail('Anchor items', `status=${status}, count=${data?.count}`);
    }
  } catch (e: any) {
    fail('Anchor items', e.message);
  }

  // 4. SDM items count > 0
  console.log('\n[4] SDM items');
  try {
    const { status, data } = await fetchJson('/api/items?kind=sdm');
    if (status === 200 && data?.count > 0) {
      pass(`GET /api/items?kind=sdm → count=${data.count}`);
    } else {
      fail('SDM items', `status=${status}, count=${data?.count}`);
    }
  } catch (e: any) {
    fail('SDM items', e.message);
  }

  // 5. Course exists
  console.log('\n[5] Course validation');
  try {
    const { status, data } = await fetchJson('/api/courses/validate', {
      method: 'POST',
      body: JSON.stringify({ courseCode: 'FINA 301' }),
    });
    if (status === 200 && data?.valid === true) {
      pass('POST /api/courses/validate → valid=true');
    } else {
      fail('Course validation', `status=${status}, valid=${data?.valid}, error=${data?.error}`);
    }
  } catch (e: any) {
    fail('Course validation', e.message);
  }

  // 6. Rate limit headers
  console.log('\n[6] Rate limit headers');
  try {
    const { headers } = await getAnchorItems();
    const hasRateLimit = headers.has('x-ratelimit-limit') || headers.has('x-ratelimit-remaining') ||
                         headers.has('ratelimit-limit') || headers.has('ratelimit-remaining');
    if (hasRateLimit) {
      pass('Rate limit headers present');
    } else {
      fail('Rate limit headers', 'No x-ratelimit-* or ratelimit-* headers found');
    }
  } catch (e: any) {
    fail('Rate limit headers', e.message);
  }

  // 7. Q14 key fixed (key should be 'B', not 'B.')
  console.log('\n[7] Q14 key check');
  try {
    const { data } = await getAnchorItems();
    if (data?.items) {
      // Find Q14 by external_item_id or by position (14th item)
      const q14 = data.items.find((i: any) =>
        i.external_item_id === '14' || i.external_item_id === 14
      );
      if (q14) {
        if (q14.key === 'B') {
          pass('Q14 key = "B" (fixed)');
        } else {
          fail('Q14 key', `key="${q14.key}" (expected "B")`);
        }
      } else {
        // Try by position if external_item_id not exposed
        const items = data.items;
        if (items.length >= 14) {
          const item14 = items[13]; // 0-indexed
          if (item14.key === 'B') {
            pass('Q14 key = "B" (fixed, matched by position)');
          } else {
            fail('Q14 key', `item[13].key="${item14.key}" (expected "B")`);
          }
        } else {
          fail('Q14 key', 'Could not locate Q14 in items response');
        }
      }
    } else {
      fail('Q14 key', 'No items in response');
    }
  } catch (e: any) {
    fail('Q14 key', e.message);
  }

  // 8. Response time < 500ms
  console.log('\n[8] DB response time');
  try {
    if (readyzElapsed > 0) {
      if (readyzElapsed < 500) {
        pass(`/api/readyz responded in ${readyzElapsed}ms (< 500ms)`);
      } else {
        fail('DB response time', `${readyzElapsed}ms (threshold: 500ms)`);
      }
    } else {
      // Re-fetch if we didn't get timing from check 2
      const { elapsed } = await fetchJson('/api/readyz');
      if (elapsed < 500) {
        pass(`/api/readyz responded in ${elapsed}ms (< 500ms)`);
      } else {
        fail('DB response time', `${elapsed}ms (threshold: 500ms)`);
      }
    }
  } catch (e: any) {
    fail('DB response time', e.message);
  }

  // --- Summary ---
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    console.log('\n*** DO NOT LAUNCH ***\n');
    console.log('Failed checks:');
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  } else {
    console.log('\nAll checks passed. Ready for launch.');
  }
}

main().catch((err) => {
  console.error('Smoke test crashed:', err.message);
  console.log('\n*** DO NOT LAUNCH ***');
  process.exit(1);
});

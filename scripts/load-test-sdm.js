/**
 * k6 Load Test Script for SDM-10 Adaptive Testing
 *
 * Tests the SDM (Selective Diagnostic Module) functionality under load:
 * 1. SDM item bank retrieval (/api/items?kind=sdm)
 * 2. Full 50-question assessment submissions (40 anchors + 10 SDM)
 * 3. SDM selection performance (client-side algorithm validation via responses)
 *
 * Usage:
 *   k6 run scripts/load-test-sdm.js
 *   k6 run --env BASE_URL=https://financial-literacy.qualiaai.fr scripts/load-test-sdm.js
 *   k6 run --env VUS=100 --env DURATION=5m scripts/load-test-sdm.js
 *
 * Scenarios:
 *   - sdm_bank: Tests SDM item bank retrieval (high throughput)
 *   - full_assessment: Tests complete 50-question submissions (realistic flow)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const sdmLoadTime = new Trend('sdm_bank_load_time', true);
const anchorLoadTime = new Trend('anchor_load_time', true);
const fullSubmitTime = new Trend('full_50q_submit_time', true);
const sdmBankSize = new Counter('sdm_bank_items');
const cacheHits = new Counter('cache_hits');

// Configuration from environment
const BASE_URL = __ENV.BASE_URL || 'https://financial-literacy.qualiaai.fr';
const COURSE_CODE = __ENV.COURSE_CODE || 'SDM-LOAD-TEST';
const TARGET_VUS = parseInt(__ENV.VUS) || 200;
const DURATION = __ENV.DURATION || '5m';

// Test configuration - two scenarios
export const options = {
  scenarios: {
    // Scenario 1: SDM bank retrieval (high frequency, tests caching)
    sdm_bank: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: TARGET_VUS / 2 },
        { duration: DURATION, target: TARGET_VUS / 2 },
        { duration: '30s', target: 0 },
      ],
      exec: 'testSdmBank',
    },
    // Scenario 2: Full 50-question assessment (realistic flow)
    full_assessment: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: TARGET_VUS / 2 },
        { duration: DURATION, target: TARGET_VUS / 2 },
        { duration: '30s', target: 0 },
      ],
      exec: 'testFullAssessment',
      startTime: '10s', // Start slightly after sdm_bank
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<5000'],      // 95% under 5s
    http_req_failed: ['rate<0.05'],          // Less than 5% failures
    errors: ['rate<0.05'],                   // Custom error rate under 5%
    sdm_bank_load_time: ['p(95)<1000'],      // SDM bank p95 under 1s
    anchor_load_time: ['p(95)<1000'],        // Anchor load p95 under 1s
    full_50q_submit_time: ['p(95)<10000'],   // Full submission p95 under 10s
  },
};

// SDM variant types for realistic response generation
const VARIANT_TYPES = [
  'Lower_TF',
  'Lower_MCQ',
  'Same_MCQ',
  'Higher_MCQ',
  'Open_Confirm',
  'Open_Diagnose'
];

// Domains as per source of truth
const DOMAINS = [
  'Borrowing & Credit',
  'Risk Management',
  'Investment & Risk'
];

/**
 * Generate responses for anchor questions (Q1-Q40)
 * Includes varied correctness and confidence to trigger different SDM variants
 */
function generateAnchorResponses(items) {
  return items.map((item, idx) => {
    // Vary correctness: ~60% correct, ~30% incorrect, ~10% DNK pattern
    const roll = Math.random();
    let answer;
    if (item.options && item.options.length > 0) {
      if (roll < 0.6) {
        // Try to pick correct answer if key is available
        answer = item.key || item.options[0].id;
      } else if (roll < 0.9) {
        // Pick wrong answer
        const wrongOptions = item.options.filter(o => o.id !== item.key);
        answer = wrongOptions.length > 0
          ? wrongOptions[Math.floor(Math.random() * wrongOptions.length)].id
          : item.options[0].id;
      } else {
        // "Do not know" - pick last option or random
        answer = item.options[item.options.length - 1].id;
      }
    } else {
      answer = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    }

    // Vary confidence (1-3 scale as per source of truth)
    // Higher confidence for correct answers, lower for uncertain
    const confidence = roll < 0.4 ? 3 : (roll < 0.7 ? 2 : 1);

    return {
      itemId: item.item_id || item.external_item_id || `Q${idx + 1}`,
      answer,
      confidence,
    };
  });
}

/**
 * Generate responses for SDM questions (Q41-Q50)
 * Simulates the 10 adaptive items selected based on anchor performance
 */
function generateSdmResponses(sdmItems, anchorResponses) {
  // Select 10 SDM items based on simulated need scores
  // In real flow, this happens client-side; here we simulate the selection
  const selected = [];
  const domainCounts = {};
  const usedAnchors = new Set();

  // Shuffle SDM items for variety
  const shuffled = [...sdmItems].sort(() => Math.random() - 0.5);

  // Phase 1: Ensure domain minimums (2 per domain)
  for (const domain of DOMAINS) {
    const domainItems = shuffled.filter(item =>
      item.domain === domain && !usedAnchors.has(item.anchor_item_id)
    );
    for (const item of domainItems) {
      if ((domainCounts[domain] || 0) >= 2) break;
      if (selected.length >= 10) break;
      selected.push(item);
      usedAnchors.add(item.anchor_item_id);
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
  }

  // Phase 2: Fill remaining slots
  for (const item of shuffled) {
    if (selected.length >= 10) break;
    if (usedAnchors.has(item.anchor_item_id)) continue;
    selected.push(item);
    usedAnchors.add(item.anchor_item_id);
  }

  // Generate responses for selected items
  return selected.slice(0, 10).map((item, idx) => {
    const answer = item.options && item.options.length > 0
      ? item.options[Math.floor(Math.random() * item.options.length)].id
      : ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];

    return {
      itemId: item.item_id || `SDM-${idx + 1}`,
      answer,
      confidence: Math.floor(Math.random() * 3) + 1,
      isSDM: true,
      variantType: item.variant_type || 'Same_MCQ',
      anchorId: item.anchor_item_id,
    };
  });
}

/**
 * Scenario 1: Test SDM bank retrieval
 * Validates caching and throughput for SDM item bank
 */
export function testSdmBank() {
  group('SDM Bank Retrieval', function() {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/items?kind=sdm`, {
      tags: { name: 'SDMBank' },
    });
    sdmLoadTime.add(Date.now() - start);

    const success = check(res, {
      'SDM bank returns 200 or 429': (r) => r.status === 200 || r.status === 429,
      'SDM bank has items': (r) => {
        if (r.status === 429) return true; // Rate limited is OK
        try {
          const body = JSON.parse(r.body);
          return body.success && body.items && body.items.length > 0;
        } catch {
          return false;
        }
      },
    });

    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        sdmBankSize.add(body.items?.length || 0);
        if (body.cached) {
          cacheHits.add(1);
        }
      } catch {}
    }

    if (!success && res.status !== 429) {
      errorRate.add(1);
      console.log(`SDM bank failed: ${res.status} - ${res.body?.substring(0, 200)}`);
    } else {
      errorRate.add(0);
    }
  });

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s between requests
}

/**
 * Scenario 2: Test full 50-question assessment
 * Simulates complete assessment flow including SDM selection
 */
export function testFullAssessment() {
  const studentId = `sdm-test-vu${__VU}-iter${__ITER}-${Date.now()}`;

  group('Full Assessment Flow', function() {
    // Step 1: Load anchor questions
    let anchorItems = [];
    group('Load Anchors', function() {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/items?kind=anchor`, {
        tags: { name: 'LoadAnchors' },
      });
      anchorLoadTime.add(Date.now() - start);

      if (res.status === 200) {
        try {
          const body = JSON.parse(res.body);
          anchorItems = body.items || [];
          if (body.cached) cacheHits.add(1);
        } catch {}
      }

      check(res, {
        'anchors returns 200 or 429': (r) => r.status === 200 || r.status === 429,
      });
    });

    // Step 2: Load SDM bank
    let sdmItems = [];
    group('Load SDM Bank', function() {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/api/items?kind=sdm`, {
        tags: { name: 'LoadSDMBank' },
      });
      sdmLoadTime.add(Date.now() - start);

      if (res.status === 200) {
        try {
          const body = JSON.parse(res.body);
          sdmItems = body.items || [];
          if (body.cached) cacheHits.add(1);
        } catch {}
      }

      check(res, {
        'SDM bank returns 200 or 429': (r) => r.status === 200 || r.status === 429,
      });
    });

    // Simulate think time (student answering questions)
    sleep(Math.random() * 3 + 1); // 1-4 seconds

    // Step 3: Generate responses for all 50 questions
    const anchorResponses = generateAnchorResponses(anchorItems.length > 0 ? anchorItems :
      Array.from({length: 40}, (_, i) => ({ item_id: `Q${i+1}` }))
    );

    const sdmResponses = generateSdmResponses(
      sdmItems.length > 0 ? sdmItems : [],
      anchorResponses
    );

    // Combine all 50 responses
    const allResponses = [...anchorResponses, ...sdmResponses];

    // Step 4: Submit complete assessment
    group('Submit Full Assessment', function() {
      const payload = JSON.stringify({
        courseCode: COURSE_CODE,
        studentId: studentId,
        attemptType: 'pre',
        responses: allResponses,
        timeSpent: Math.floor(Math.random() * 2400) + 1200, // 20-60 min
        metadata: {
          tabSwitches: 0,
          loadTest: true,
          sdmTest: true,
          sdmItemCount: sdmResponses.length,
          totalQuestions: allResponses.length,
        },
      });

      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/assessment/submit`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
        tags: { name: 'SubmitFullAssessment' },
      });
      fullSubmitTime.add(Date.now() - start);

      const success = check(res, {
        'full submission returns 200/409/429': (r) =>
          r.status === 200 || r.status === 409 || r.status === 429,
        'submission under 10s': (r) => r.timings.duration < 10000,
      });

      if (!success) {
        errorRate.add(1);
        console.log(`Full submission failed [VU:${__VU}]: ${res.status} - ${res.body?.substring(0, 200)}`);
      } else {
        errorRate.add(0);
      }

      // Log slow submissions
      const duration = Date.now() - start;
      if (duration > 5000) {
        console.log(`Slow full submission [VU:${__VU}]: ${duration}ms`);
      }
    });
  });

  sleep(1); // Cooldown between iterations
}

/**
 * Default function - runs both scenarios if no specific exec
 */
export default function() {
  testSdmBank();
}

/**
 * Setup - verify API availability
 */
export function setup() {
  console.log(`
===========================================
SDM Load Test Starting
===========================================
Target URL: ${BASE_URL}
Course Code: ${COURSE_CODE}
Target VUs: ${TARGET_VUS}
Duration: ${DURATION}
===========================================
  `);

  // Verify APIs are reachable
  const healthRes = http.get(`${BASE_URL}/api/healthz`);
  if (healthRes.status !== 200) {
    console.warn(`Health check returned ${healthRes.status} - continuing anyway`);
  }

  // Verify SDM bank is available
  const sdmRes = http.get(`${BASE_URL}/api/items?kind=sdm`);
  if (sdmRes.status === 200) {
    try {
      const body = JSON.parse(sdmRes.body);
      console.log(`SDM bank available: ${body.items?.length || 0} items`);
    } catch {
      console.log('SDM bank response parse error');
    }
  } else {
    console.warn(`SDM bank check returned ${sdmRes.status}`);
  }

  return { startTime: Date.now() };
}

/**
 * Teardown - report results
 */
export function teardown(data) {
  const duration = Math.round((Date.now() - data.startTime) / 1000);
  console.log(`
===========================================
SDM Load Test Complete
===========================================
Total Duration: ${duration} seconds
===========================================
  `);
}

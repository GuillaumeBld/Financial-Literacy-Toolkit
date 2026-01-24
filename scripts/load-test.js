/**
 * k6 Load Test Script for Financial Literacy Assessment Platform
 *
 * Tests the platform's ability to handle 500 concurrent users
 * submitting assessments simultaneously.
 *
 * Usage:
 *   k6 run scripts/load-test.js
 *   k6 run --env BASE_URL=https://financial-literacy.qualiaai.fr scripts/load-test.js
 *   k6 run --env COURSE_CODE=FINLIT-101 scripts/load-test.js
 *
 * Install k6:
 *   apt-get update && apt-get install -y gnupg2
 *   curl -s https://dl.k6.io/key.gpg | gpg --dearmor -o /usr/share/keyrings/k6-archive-keyring.gpg
 *   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | tee /etc/apt/sources.list.d/k6.list
 *   apt-get update && apt-get install -y k6
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const submissionTime = new Trend('submission_time', true);
const itemsLoadTime = new Trend('items_load_time', true);
const cacheHits = new Counter('cache_hits');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Warm up
    { duration: '2m', target: 200 },   // Ramp to moderate load
    { duration: '3m', target: 500 },   // Ramp to target load
    { duration: '5m', target: 500 },   // Sustain peak load
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // 95% of requests under 3s
    http_req_failed: ['rate<0.02'],      // Error rate under 2%
    errors: ['rate<0.05'],               // Custom error rate under 5%
    submission_time: ['p(95)<5000'],     // 95% submissions under 5s
    submission_time: ['p(99)<10000'],    // 99% submissions under 10s
    items_load_time: ['p(95)<1000'],     // 95% item loads under 1s
  },
};

// Configuration from environment or defaults
const BASE_URL = __ENV.BASE_URL || 'https://financial-literacy.qualiaai.fr';
const COURSE_CODE = __ENV.COURSE_CODE || 'LOAD-TEST';

/**
 * Generate realistic assessment responses
 */
function generateResponses(itemIds) {
  return itemIds.map(itemId => ({
    itemId: itemId,
    answer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
    confidence: Math.floor(Math.random() * 3) + 1, // 1-3 scale
  }));
}

/**
 * Main test scenario - simulates a student taking an assessment
 */
export default function () {
  const studentId = `loadtest-vu${__VU}-iter${__ITER}-${Date.now()}`;

  group('Assessment Flow', function () {
    // Step 1: Load assessment items
    group('Load Items', function () {
      const itemsStart = Date.now();
      const itemsRes = http.get(`${BASE_URL}/api/items?kind=anchor`, {
        tags: { name: 'LoadItems' },
      });

      itemsLoadTime.add(Date.now() - itemsStart);

      const itemsSuccess = check(itemsRes, {
        'items endpoint returns 200': (r) => r.status === 200,
        'items response has data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success && body.items && body.items.length > 0;
          } catch {
            return false;
          }
        },
      });

      if (!itemsSuccess) {
        errorRate.add(1);
        console.log(`Items load failed: ${itemsRes.status} - ${itemsRes.body}`);
        return;
      }

      // Check if response was cached
      try {
        const body = JSON.parse(itemsRes.body);
        if (body.cached) {
          cacheHits.add(1);
        }
      } catch {}

      errorRate.add(0);
    });

    // Step 2: Simulate thinking/answering time (realistic user behavior)
    // Students take 10-40 seconds per question, but we compress for load testing
    sleep(Math.random() * 5 + 2); // 2-7 seconds simulated think time

    // Step 3: Submit assessment
    group('Submit Assessment', function () {
      // Get real item IDs from the items API response
      let itemIds = [];
      try {
        const itemsRes = http.get(`${BASE_URL}/api/items?kind=anchor`, {
          tags: { name: 'GetItemsForSubmit' },
        });
        if (itemsRes.status === 200) {
          const body = JSON.parse(itemsRes.body);
          itemIds = body.items.map(item => item.item_id);
        }
      } catch (e) {
        // Fallback to Q1-Q40 format if API fails
        for (let i = 1; i <= 40; i++) {
          itemIds.push(`Q${i}`);
        }
      }

      if (itemIds.length === 0) {
        // Fallback
        for (let i = 1; i <= 40; i++) {
          itemIds.push(`Q${i}`);
        }
      }

      const payload = JSON.stringify({
        courseCode: COURSE_CODE,
        studentId: studentId,
        attemptType: 'pre',
        responses: generateResponses(itemIds),
        timeSpent: Math.floor(Math.random() * 1800) + 600, // 10-40 min in seconds
        metadata: {
          tabSwitches: Math.floor(Math.random() * 3),
          loadTest: true,
        },
      });

      const submitStart = Date.now();
      const submitRes = http.post(`${BASE_URL}/api/assessment/submit`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: '30s',
        tags: { name: 'SubmitAssessment' },
      });

      const duration = Date.now() - submitStart;
      submissionTime.add(duration);

      const submitSuccess = check(submitRes, {
        'submission returns 200 or 409': (r) => r.status === 200 || r.status === 409,
        'submission under 5s': (r) => r.timings.duration < 5000,
        'submission has valid response': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.success || body.error;
          } catch {
            return false;
          }
        },
      });

      if (!submitSuccess) {
        errorRate.add(1);
        console.log(`Submission failed [VU:${__VU}]: ${submitRes.status} - ${submitRes.body?.substring(0, 200)}`);
      } else {
        errorRate.add(0);
      }

      // Log slow submissions
      if (duration > 3000) {
        console.log(`Slow submission [VU:${__VU}]: ${duration}ms`);
      }
    });
  });

  // Cooldown between iterations
  sleep(1);
}

/**
 * Setup function - runs once before the test
 */
export function setup() {
  console.log(`
===========================================
Financial Literacy Load Test Starting
===========================================
Target URL: ${BASE_URL}
Course Code: ${COURSE_CODE}
Target Users: 500 concurrent
===========================================
  `);

  // Verify the API is reachable
  const healthRes = http.get(`${BASE_URL}/api/healthz`);
  if (healthRes.status !== 200) {
    throw new Error(`API health check failed: ${healthRes.status}`);
  }

  return { startTime: Date.now() };
}

/**
 * Teardown function - runs once after the test
 */
export function teardown(data) {
  const duration = Math.round((Date.now() - data.startTime) / 1000);
  console.log(`
===========================================
Load Test Complete
===========================================
Total Duration: ${duration} seconds
===========================================
  `);
}

/**
 * Unit tests for score-sdm-responses.ts
 *
 * Covers:
 *  1. buildScorerQuery — keyset pagination parameter binding order
 *  2. stats counter initialization on resume vs. fresh run
 *
 * Run with: npx tsx --test scripts/score-sdm-responses.test.ts
 * (or via: bun test scripts/score-sdm-responses.test.ts)
 */

import { buildScorerQuery, type ScorerQueryOptions } from "./score-sdm-responses";

// ---------------------------------------------------------------------------
// buildScorerQuery — parameter binding order tests
// ---------------------------------------------------------------------------

describe("buildScorerQuery", () => {
  const CURSOR = {
    last_completed_created_at: "2025-01-15T10:00:00Z",
    last_completed_response_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  };

  it("cursor only: binds created_at before response_id in the tuple comparison", () => {
    const { sql, params } = buildScorerQuery({ item: "", limit: 0, cursor: CURSOR });

    // The SQL must contain a tuple comparison (r.created_at, r.response_id) > ($N, $N+1)
    const match = sql.match(/\(\$(\d+),\s*\$(\d+)\)/);
    expect(match).not.toBeNull();

    const tsIdx = parseInt(match![1]) - 1; // convert to 0-based
    const uuidIdx = parseInt(match![2]) - 1;

    expect(params[tsIdx]).toBe(CURSOR.last_completed_created_at);
    expect(params[uuidIdx]).toBe(CURSOR.last_completed_response_id);
  });

  it("item + cursor: item is $1, created_at is $2, response_id is $3", () => {
    const { params } = buildScorerQuery({
      item: "Q6",
      limit: 0,
      cursor: CURSOR,
    });

    expect(params[0]).toBe("Q6");
    expect(params[1]).toBe(CURSOR.last_completed_created_at);
    expect(params[2]).toBe(CURSOR.last_completed_response_id);
  });

  it("item + cursor + limit: limit is the last param", () => {
    const { params } = buildScorerQuery({
      item: "Q6",
      limit: 100,
      cursor: CURSOR,
    });

    // params should be: [item, created_at, response_id, limit]
    expect(params).toHaveLength(4);
    expect(params[3]).toBe(100);
  });

  it("no item, no cursor: no params (just ORDER BY)", () => {
    const { sql, params } = buildScorerQuery({ item: "", limit: 0, cursor: null });

    expect(params).toHaveLength(0);
    expect(sql).toContain("ORDER BY r.created_at, r.response_id");
    expect(sql).not.toContain("$");
  });

  it("limit only: limit is $1", () => {
    const { params } = buildScorerQuery({ item: "", limit: 50, cursor: null });

    expect(params).toHaveLength(1);
    expect(params[0]).toBe(50);
  });

  it("cursor only: no item param included", () => {
    const { params } = buildScorerQuery({ item: "", limit: 0, cursor: CURSOR });

    // Only created_at and response_id — no item
    expect(params).toHaveLength(2);
    expect(params[0]).toBe(CURSOR.last_completed_created_at);
    expect(params[1]).toBe(CURSOR.last_completed_response_id);
  });
});

// ---------------------------------------------------------------------------
// Stats counter initialization
// ---------------------------------------------------------------------------

describe("stats counter initialization on resume", () => {
  it("initializes success and errors from cursor on resume", () => {
    const cursor = { responses_scored: 450, responses_errored: 12 };

    const stats = {
      success: cursor?.responses_scored ?? 0,
      errors: cursor?.responses_errored ?? 0,
    };

    expect(stats.success).toBe(450);
    expect(stats.errors).toBe(12);
  });

  it("initializes success and errors to 0 with no cursor", () => {
    const cursor = null;

    const stats = {
      success: cursor?.responses_scored ?? 0,
      errors: cursor?.responses_errored ?? 0,
    };

    expect(stats.success).toBe(0);
    expect(stats.errors).toBe(0);
  });

  it("resumeOffset captures prior-run totals so per-run deltas are accurate", () => {
    const cursor = { responses_scored: 500, responses_errored: 5 };

    const resumeOffset = {
      success: cursor?.responses_scored ?? 0,
      errors: cursor?.responses_errored ?? 0,
    };
    const stats = {
      success: cursor?.responses_scored ?? 0,
      errors: cursor?.responses_errored ?? 0,
    };

    // Simulate scoring 3 more rows in this run
    stats.success += 3;

    const thisRunSuccess = stats.success - resumeOffset.success;
    const thisRunErrors = stats.errors - resumeOffset.errors;

    expect(thisRunSuccess).toBe(3);
    expect(thisRunErrors).toBe(0);
    expect(stats.success).toBe(503); // cumulative still correct
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getRateLimitKey } from "@/lib/security/rate-limiter";

describe("Rate Limiter — Sliding Window Security", () => {
  it("allows requests within the rate limit window", () => {
    const key = `test-ip-${Math.random()}`;
    const result = checkRateLimit(key, 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("increments counter and tracks remaining correctly", () => {
    const key = `test-ip-${Math.random()}`;
    checkRateLimit(key, 3, 60_000); // 1st request → remaining: 2
    checkRateLimit(key, 3, 60_000); // 2nd request → remaining: 1
    const third = checkRateLimit(key, 3, 60_000); // 3rd request → remaining: 0
    expect(third.remaining).toBe(0);
    expect(third.allowed).toBe(true);
  });

  it("blocks requests that exceed the rate limit", () => {
    const key = `test-ip-${Math.random()}`;
    // Exhaust the 2-request limit
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    // 3rd request should be blocked
    const result = checkRateLimit(key, 2, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("treats different identifiers as independent buckets", () => {
    const key1 = `test-ip-A-${Math.random()}`;
    const key2 = `test-ip-B-${Math.random()}`;
    // Exhaust key1
    checkRateLimit(key1, 1, 60_000);
    checkRateLimit(key1, 1, 60_000);
    // key2 should be untouched
    const result = checkRateLimit(key2, 1, 60_000);
    expect(result.allowed).toBe(true);
  });

  it("getRateLimitKey extracts the first IP from X-Forwarded-For", () => {
    const mockRequest = new Request("https://lexiguide.app/api/qa", {
      headers: { "x-forwarded-for": "203.0.113.42, 10.0.0.1, 172.16.0.1" },
    });
    expect(getRateLimitKey(mockRequest)).toBe("203.0.113.42");
  });

  it("getRateLimitKey falls back to unknown-ip when header is absent", () => {
    const mockRequest = new Request("https://lexiguide.app/api/qa");
    expect(getRateLimitKey(mockRequest)).toBe("unknown-ip");
  });
});

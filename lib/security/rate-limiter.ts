/**
 * In-memory sliding-window rate limiter.
 * Allows N requests per IP per window without external dependencies.
 * Production deployments should replace with Redis or Upstash for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the periodic cleanup timer to prune stale entries.
 * Safe to call multiple times — only one timer runs at a time.
 * Returns a stop function for cleanup in test environments.
 */
export function startCleanup(intervalMs = 60_000): () => void {
  if (cleanupInterval !== null) return () => stopCleanup();

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now - entry.windowStart > intervalMs) {
        store.delete(key);
      }
    });
  }, intervalMs);

  // Allow the timer to be garbage-collected if the process is idle (Node.js only)
  if (typeof cleanupInterval === "object" && cleanupInterval !== null && "unref" in cleanupInterval) {
    (cleanupInterval as NodeJS.Timeout).unref();
  }

  return () => stopCleanup();
}

/**
 * Stops and clears the cleanup interval.
 * Useful in test teardown to prevent open handle warnings.
 */
export function stopCleanup(): void {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Auto-start in non-test environments
if (process.env.NODE_ENV !== "test") {
  startCleanup();
}

/**
 * Checks whether a given identifier (e.g. IP address) has exceeded the rate limit.
 *
 * @param identifier  - A unique key per requester (e.g. request IP or user ID)
 * @param maxRequests - Maximum allowed requests per window (default: 30)
 * @param windowMs    - Duration of the sliding window in milliseconds (default: 60 000 ms)
 * @returns { allowed: boolean; remaining: number }
 */
export function checkRateLimit(
  identifier: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now - entry.windowStart >= windowMs) {
    // Start a new window
    store.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Resets the rate limit store — for use in tests only.
 */
export function resetRateLimitStore(): void {
  store.clear();
}

/**
 * Extracts a stable rate-limit key from a Next.js request.
 * Uses the X-Forwarded-For header for reverse-proxy environments (Vercel, Cloudflare),
 * falling back to a generic sentinel to avoid crashing in dev mode.
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = (request.headers as Headers).get("x-forwarded-for");
  if (forwarded) {
    // Forwarded header may contain a comma-separated chain — use the first (client) IP
    return forwarded.split(",")[0].trim();
  }
  return "unknown-ip";
}

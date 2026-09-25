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

/** Periodically prune stale entries to prevent unbounded memory growth */
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now - entry.windowStart > 60_000) {
      store.delete(key);
    }
  });
}, 60_000);

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

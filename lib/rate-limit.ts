/**
 * 簡易記憶體版速率限制（單機）。
 * 正式環境若多機請改用 Redis（Upstash 等）。
 *
 * 用法：
 *   const r = checkLoginRateLimit(ip);
 *   if (!r.ok) return 429 with retryAfter
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 5 * 60 * 1000; // 5 分鐘
const MAX_ATTEMPTS = 10; // 同 IP / 5 分鐘最多嘗試

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function checkLoginRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > MAX_ATTEMPTS) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: MAX_ATTEMPTS - b.count };
}

/** 登入成功時呼叫，重置該 IP 的計數 */
export function resetLoginRateLimit(key: string) {
  buckets.delete(key);
}

export function clientKeyFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;
  return "unknown";
}

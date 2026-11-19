const hits = new Map<string, { count: number; resetAt: number }>();

/** Sliding window: 60s. Mutating routes use a tighter bucket via `rateLimitMutating`. */
const WINDOW_MS = 60_000;
const MAX_READ = 180;
const MAX_MUTATE = 60;

function allow(key: string, max: number): boolean {
  const now = Date.now();
  const row = hits.get(key);
  if (!row || row.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (row.count >= max) return false;
  row.count += 1;
  return true;
}

/** Default IP bucket (reads + unknown). */
export function rateLimit(key: string): boolean {
  return allow(`r:${key}`, MAX_READ);
}

/** Tighter bucket for POST mutating API (intent, join, settings, rematch, pin). */
export function rateLimitMutating(key: string): boolean {
  return allow(`m:${key}`, MAX_MUTATE);
}

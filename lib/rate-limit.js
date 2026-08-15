const buckets = new Map();

function allow(key, limit = 8, windowMs = 10000) {
  const now = Date.now();
  const bucketKey = String(key || 'unknown');
  const current = buckets.get(bucketKey) || { count: 0, resetAt: now + windowMs };
  if (current.resetAt <= now) {
    current.count = 0;
    current.resetAt = now + windowMs;
  }
  if (current.count >= limit) {
    buckets.set(bucketKey, current);
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, current.resetAt - now) };
  }
  current.count += 1;
  buckets.set(bucketKey, current);
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfterMs: 0 };
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.resetAt <= now) buckets.delete(key);
}
const timer = setInterval(cleanup, 60000);
timer.unref?.();
module.exports = { allow, cleanup };

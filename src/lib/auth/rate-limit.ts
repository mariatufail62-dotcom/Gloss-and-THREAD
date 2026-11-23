import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by PostgreSQL so it works across
 * multiple server instances. Returns true when the action is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  try {
    const row = await db.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt < now) {
      await db.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      });
      return true;
    }
    if (row.count >= limit) return false;
    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch (err) {
    console.error("[rate-limit] failure", err);
    return true; // fail open rather than locking out editors on a DB hiccup
  }
}

export async function clearRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { purgeExpiredSessions } from "@/lib/auth/session";
import { revalidateArticle } from "@/lib/revalidate";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = env.cronSecret;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Promotes scheduled articles whose time has come, refreshes their caches and
 * cleans expired sessions / rate-limit rows. Call every 5–15 minutes with
 * `Authorization: Bearer $CRON_SECRET` (e.g. Vercel Cron or any scheduler).
 */
async function run(req: Request) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const due = await db.article.findMany({
    where: { status: "SCHEDULED", publishedAt: { lte: new Date() } },
    select: { id: true, slug: true, title: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
  });
  for (const a of due) {
    await db.article.update({ where: { id: a.id }, data: { status: "PUBLISHED" } });
    await db.activityLog.create({
      data: { action: "article.publish.scheduled", entityType: "Article", entityId: a.id, summary: `Scheduled publish: ${a.title}` },
    });
    revalidateArticle(a);
  }
  await purgeExpiredSessions();
  await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });

  return Response.json({ published: due.length }, { headers: { "Cache-Control": "no-store" } });
}

export const GET = run;
export const POST = run;

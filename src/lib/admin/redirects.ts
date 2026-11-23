import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { normalizePath } from "@/lib/site";

type Tx = Prisma.TransactionClient;

/**
 * Records a permanent redirect when a public URL changes, collapsing chains
 * (A→B then B→C becomes A→C and B→C) and removing anything that would loop.
 */
export async function recordPathChange(tx: Tx, fromRaw: string, toRaw: string, note: string) {
  const from = normalizePath(fromRaw);
  const to = normalizePath(toRaw);
  if (from === to) return;
  // The new URL is live now: it must not redirect anywhere.
  await tx.redirect.deleteMany({ where: { fromPath: to } });
  // Point older redirects straight at the new destination.
  await tx.redirect.updateMany({ where: { toPath: from }, data: { toPath: to } });
  await tx.redirect.upsert({
    where: { fromPath: from },
    update: { toPath: to, permanent: true, note },
    create: { fromPath: from, toPath: to, permanent: true, note },
  });
}

import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "gt_session";
const SESSION_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const h = await headers();
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt, userAgent: h.get("user-agent")?.slice(0, 300) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  authorId: string | null;
};

/** Resolves the current user from the session cookie (memoized per request). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  const { id, email, name, role, authorId } = session.user;
  return { id, email, name, role, authorId };
});

const rank: Record<Role, number> = { CONTRIBUTOR: 1, EDITOR: 2, ADMIN: 3 };

export function hasRole(user: SessionUser | null, min: Role): boolean {
  return !!user && rank[user.role] >= rank[min];
}

/** Use at the top of every admin page and server action. */
export async function requireUser(min: Role = "CONTRIBUTOR"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login/");
  if (!hasRole(user, min)) redirect("/admin/?denied=1");
  return user;
}

export async function purgeExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

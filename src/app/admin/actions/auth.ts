"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth/session";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { clearRateLimit, rateLimit } from "@/lib/auth/rate-limit";
import { fail, ok, type ActionState } from "@/lib/admin/forms";

// Comparing against a throwaway hash when the email is unknown keeps response
// timing similar, so valid accounts cannot be enumerated.
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(24).toString("hex"));
  return dummyHash;
}

async function ip() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return fail("Enter your email and password.");
  const { email, password } = parsed.data;

  const clientIp = await ip();
  const ipKey = `login-ip:${clientIp}`;
  const emailKey = `login-email:${email}`;
  const allowed = (await rateLimit(ipKey, 20, 900)) && (await rateLimit(emailKey, 6, 900));
  if (!allowed) return fail("Too many sign-in attempts. Please wait 15 minutes and try again.");

  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !valid || !user.isActive) return fail("That email and password combination is not correct.");

  await clearRateLimit(emailKey);
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await db.activityLog.create({
    data: { userId: user.id, action: "auth.login", entityType: "User", entityId: user.id, summary: `${user.name} signed in` },
  });

  const next = String(fd.get("next") ?? "");
  redirect(next.startsWith("/admin/") && !next.startsWith("/admin/login") && !next.includes("//") ? next : "/admin/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login/");
}

export async function changePasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (!(await rateLimit(`pwchange:${me.id}`, 5, 900))) return fail("Too many attempts. Try again in 15 minutes.");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(current, user.passwordHash))) return fail("Your current password is not correct.");
  const problem = passwordProblem(next);
  if (problem) return fail(problem);
  if (next !== confirm) return fail("The new passwords do not match.");
  await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(next) } });
  await db.activityLog.create({
    data: { userId: me.id, action: "user.password", entityType: "User", entityId: me.id, summary: `${me.name} changed their password` },
  });
  return ok("Password updated.");
}

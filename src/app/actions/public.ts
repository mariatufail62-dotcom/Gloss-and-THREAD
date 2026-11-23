"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/auth/rate-limit";
import { subscribe } from "@/lib/newsletter";

export type FormState = { ok: boolean; message: string; errors?: Record<string, string> } | null;

async function clientKey() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);

export async function subscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("company")) return { ok: false, message: "Something went wrong. Please try again." }; // honeypot
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  if (!(await rateLimit(`newsletter:${await clientKey()}`, 5, 3600)))
    return { ok: false, message: "Too many attempts. Please try again later." };

  const result = await subscribe(parsed.data);
  if (!result.ok) return { ok: false, message: result.error };

  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    update: { status: result.status, provider: result.provider, providerId: result.providerId },
    create: {
      email: parsed.data,
      status: result.status,
      provider: result.provider,
      providerId: result.providerId,
      source: String(formData.get("source") ?? "site").slice(0, 60),
    },
  });

  return {
    ok: true,
    message:
      result.status === "PENDING"
        ? "Almost done — check your inbox to confirm your subscription."
        : "You're subscribed. Thank you for reading Gloss & Thread.",
  };
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(120),
  email: emailSchema,
  topic: z.enum(["GENERAL", "CORRECTION", "EDITORIAL", "ADVERTISING", "PRIVACY"]),
  subject: z.string().trim().max(200).optional(),
  pageUrl: z.string().trim().max(500).optional(),
  message: z.string().trim().min(10, "Please write a little more detail.").max(5000),
});

export async function contactAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("company")) return { ok: false, message: "Something went wrong. Please try again." };
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    topic: formData.get("topic") || "GENERAL",
    subject: formData.get("subject") || undefined,
    pageUrl: formData.get("pageUrl") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Please check the highlighted fields.", errors };
  }
  if (!(await rateLimit(`contact:${await clientKey()}`, 5, 3600)))
    return { ok: false, message: "Too many messages from this connection. Please try again later." };

  await db.contactMessage.create({ data: parsed.data });
  return { ok: true, message: "Thank you — your message has reached our editors. We read every note." };
}

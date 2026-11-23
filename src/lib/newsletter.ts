import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Newsletter provider integration. Subscriptions are only ever reported as
 * successful when the provider's API confirms them. With no provider
 * configured, the signup form is not rendered at all.
 */

export type SubscribeResult =
  | { ok: true; status: "SUBSCRIBED" | "PENDING"; providerId?: string; provider: string }
  | { ok: false; error: string };

export function newsletterProvider(): "buttondown" | "mailchimp" | null {
  const n = env.newsletter;
  if (n.provider === "buttondown" && n.buttondownApiKey) return "buttondown";
  if (n.provider === "mailchimp" && n.mailchimpApiKey && n.mailchimpAudienceId) return "mailchimp";
  return null;
}

export function isNewsletterConfigured(): boolean {
  return newsletterProvider() !== null;
}

export async function subscribe(email: string): Promise<SubscribeResult> {
  const provider = newsletterProvider();
  if (!provider) return { ok: false, error: "Newsletter signups are not open yet." };
  try {
    return provider === "buttondown" ? await buttondown(email) : await mailchimp(email);
  } catch (err) {
    console.error(`[newsletter] ${provider} request failed`, err);
    return { ok: false, error: "We couldn't reach our newsletter service. Please try again later." };
  }
}

async function buttondown(email: string): Promise<SubscribeResult> {
  const res = await fetch("https://api.buttondown.com/v1/subscribers", {
    method: "POST",
    headers: { Authorization: `Token ${env.newsletter.buttondownApiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email_address: email, tags: ["website"] }),
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 201 || res.status === 200) {
    const body = (await res.json().catch(() => ({}))) as { id?: string; type?: string };
    return {
      ok: true,
      provider: "buttondown",
      providerId: body.id,
      status: body.type === "regular" ? "SUBSCRIBED" : "PENDING",
    };
  }
  const text = await res.text().catch(() => "");
  if (res.status === 400 && /already/i.test(text)) return { ok: true, provider: "buttondown", status: "SUBSCRIBED" };
  console.error("[newsletter] buttondown error", res.status, text.slice(0, 300));
  return { ok: false, error: "That email address couldn't be subscribed. Please check it and try again." };
}

async function mailchimp(email: string): Promise<SubscribeResult> {
  const key = env.newsletter.mailchimpApiKey!;
  const dc = key.split("-")[1];
  if (!dc) return { ok: false, error: "Newsletter service is misconfigured." };
  const hash = createHash("md5").update(email.toLowerCase()).digest("hex");
  const status = env.newsletter.mailchimpDoubleOptIn ? "pending" : "subscribed";
  const res = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${env.newsletter.mailchimpAudienceId}/members/${hash}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email_address: email, status_if_new: status }),
    signal: AbortSignal.timeout(8000),
  });
  if (res.ok) {
    const body = (await res.json().catch(() => ({}))) as { id?: string; status?: string };
    return {
      ok: true,
      provider: "mailchimp",
      providerId: body.id,
      status: body.status === "subscribed" ? "SUBSCRIBED" : "PENDING",
    };
  }
  console.error("[newsletter] mailchimp error", res.status, (await res.text().catch(() => "")).slice(0, 300));
  return { ok: false, error: "That email address couldn't be subscribed. Please check it and try again." };
}

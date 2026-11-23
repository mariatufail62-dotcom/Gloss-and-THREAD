"use client";

import { useActionState } from "react";
import { contactAction, type FormState } from "@/app/actions/public";

const TOPICS = [
  { value: "GENERAL", label: "General feedback" },
  { value: "CORRECTION", label: "Correction request" },
  { value: "EDITORIAL", label: "Story idea / editorial" },
  { value: "ADVERTISING", label: "Advertising" },
  { value: "PRIVACY", label: "Privacy request" },
];

export function ContactForm({ defaultTopic = "GENERAL" }: { defaultTopic?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(contactAction, null);

  if (state?.ok) {
    return (
      <div role="status" className="border border-line bg-paper-2 px-6 py-10 text-center">
        <p className="font-serif text-2xl">Message sent</p>
        <p className="mt-3 text-[0.9375rem] text-muted">{state.message}</p>
      </div>
    );
  }

  const err = (k: string) => state?.errors?.[k];
  const fieldCls = (k: string) => `field ${err(k) ? "border-rose-dark" : ""}`;

  return (
    <form action={action} className="space-y-6" noValidate>
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Company <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {state && !state.ok && (
        <p role="alert" className="border-l-2 border-rose-dark bg-rose-wash px-4 py-3 text-[0.875rem] text-rose-dark">
          {state.message}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" id="name" error={err("name")}>
          <input id="name" name="name" autoComplete="name" required className={fieldCls("name")} />
        </Field>
        <Field label="Email address" id="email" error={err("email")}>
          <input id="email" name="email" type="email" autoComplete="email" required className={fieldCls("email")} />
        </Field>
      </div>
      <Field label="Topic" id="topic" error={err("topic")}>
        <select id="topic" name="topic" defaultValue={TOPICS.some((t) => t.value === defaultTopic) ? defaultTopic : "GENERAL"} className={fieldCls("topic")}>
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Page URL (for corrections — optional)" id="pageUrl" error={err("pageUrl")}>
        <input id="pageUrl" name="pageUrl" type="url" inputMode="url" placeholder="https://" className={fieldCls("pageUrl")} />
      </Field>
      <Field label="Message" id="message" error={err("message")}>
        <textarea id="message" name="message" rows={7} required className={fieldCls("message")} />
      </Field>
      <button type="submit" disabled={pending} className="btn-dark disabled:opacity-60">
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label mb-2 block text-muted">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-[0.8125rem] text-rose-dark" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

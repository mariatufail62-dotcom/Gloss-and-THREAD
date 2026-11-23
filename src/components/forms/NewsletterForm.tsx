"use client";

import { useActionState } from "react";
import { subscribeAction, type FormState } from "@/app/actions/public";

export function NewsletterForm({ source, tone = "dark" }: { source: string; tone?: "dark" | "light" }) {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeAction, null);
  const dark = tone === "dark";

  if (state?.ok) {
    return (
      <p role="status" className={`text-[0.9375rem] ${dark ? "text-white" : "text-ink"}`}>
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="w-full" noValidate>
      <input type="hidden" name="source" value={source} />
      <div aria-hidden className="absolute -left-[9999px]" >
        <label>
          Company <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`nl-${source}`} className="sr-only">
          Email address
        </label>
        <input
          id={`nl-${source}`}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-describedby={state && !state.ok ? `nl-${source}-err` : undefined}
          className={`min-h-12 flex-1 border px-4 text-[0.9375rem] focus:outline-none ${
            dark
              ? "border-white/30 bg-transparent text-white placeholder:text-white/55 focus:border-white"
              : "border-line bg-white text-ink placeholder:text-muted focus:border-ink"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`btn min-h-12 ${dark ? "bg-white text-ink hover:bg-rose-wash" : "bg-ink text-white hover:bg-rose-dark"} disabled:opacity-60`}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {state && !state.ok && (
        <p id={`nl-${source}-err`} role="alert" className={`mt-3 text-[0.875rem] ${dark ? "text-rose-wash" : "text-rose-dark"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

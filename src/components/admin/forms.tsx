"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/admin/forms";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "dark",
  name,
  value,
  className = "",
  confirm,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "dark" | "outline" | "danger" | "link";
  name?: string;
  value?: string;
  className?: string;
  confirm?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "dark"
      ? "btn-dark"
      : variant === "outline"
        ? "btn-outline"
        : variant === "danger"
          ? "btn border border-rose-dark text-rose-dark hover:bg-rose-dark hover:text-white"
          : "text-[0.8125rem] font-semibold underline underline-offset-2 hover:text-rose-dark";
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={`${cls} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state && !state.ok) ref.current?.focus();
  }, [state]);
  if (!state) return null;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={state.ok ? "status" : "alert"}
      className={`border px-4 py-3 text-[0.875rem] outline-none ${
        state.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-rose/40 bg-rose-wash text-rose-dark"
      }`}
    >
      <p className="font-medium">{state.message}</p>
      {state.details && state.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {state.details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {state.errors && Object.keys(state.errors).length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {Object.entries(state.errors).map(([k, v]) => (
            <li key={k}>
              <span className="font-semibold">{k}</span>: {v}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Generic CMS form: runs a server action, shows the result, keeps fields.
 * Children may include any inputs and <SubmitButton>s.
 */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess,
  encType,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  encType?: "multipart/form-data";
}) {
  const [state, formAction] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={formRef} action={formAction} className={className} encType={encType}>
      <div className="mb-4 empty:hidden">
        <FormMessage state={state} />
      </div>
      {children}
    </form>
  );
}

/** Small one-button form for row actions (delete, toggle, restore). */
export function InlineAction({
  action,
  fields,
  label,
  pendingLabel,
  confirm,
  variant = "link",
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  pendingLabel?: string;
  confirm?: string;
  variant?: "dark" | "outline" | "danger" | "link";
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton variant={variant} confirm={confirm} pendingLabel={pendingLabel ?? "…"}>
        {label}
      </SubmitButton>
      {state && !state.ok && <span className="text-[0.75rem] text-rose-dark">{state.message}</span>}
    </form>
  );
}

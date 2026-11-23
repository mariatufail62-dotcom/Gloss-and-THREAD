import type { ZodError } from "zod";

/** Shared result shape for every CMS server action used with useActionState. */
export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Extra details (e.g. blocking SEO checks) shown under the message. */
  details?: string[];
  /** Monotonic stamp so the client can tell two identical results apart. */
  at?: number;
} | null;

export function ok(message: string, extra: Partial<NonNullable<ActionState>> = {}): ActionState {
  return { ok: true, message, at: Date.now(), ...extra };
}

export function fail(message: string, extra: Partial<NonNullable<ActionState>> = {}): ActionState {
  return { ok: false, message, at: Date.now(), ...extra };
}

export function zodFail(err: ZodError, message = "Please fix the highlighted fields."): ActionState {
  const errors: Record<string, string> = {};
  for (const i of err.issues) errors[i.path.join(".") || "_"] ??= i.message;
  return fail(message, { errors });
}

/** FormData helpers: trimmed strings, with empty → undefined. */
export function str(fd: FormData, name: string): string | undefined {
  const v = fd.get(name);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

export function bool(fd: FormData, name: string): boolean {
  const v = fd.get(name);
  return v === "on" || v === "true" || v === "1";
}

export function int(fd: FormData, name: string, fallback: number): number {
  const v = Number(str(fd, name));
  return Number.isFinite(v) ? Math.trunc(v) : fallback;
}

/** "Label | https://url" per line → [{label, url}] */
export function parseLabeledLinks(raw: string | undefined): { label: string; url: string }[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, ...rest] = l.split("|");
      return { label: label.trim(), url: rest.join("|").trim() };
    });
}

export function formatLabeledLinks(v: unknown, labelKey: "label" | "title" = "label"): string {
  if (!Array.isArray(v)) return "";
  return v
    .filter((x) => x && typeof x === "object")
    .map((x) => `${(x as Record<string, string>)[labelKey] ?? ""} | ${(x as Record<string, string>).url ?? ""}`)
    .join("\n");
}

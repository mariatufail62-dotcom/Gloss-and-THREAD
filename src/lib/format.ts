import { DISPLAY_TIMEZONE } from "@/lib/site";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIMEZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

const shortFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIMEZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return dateFmt.format(new Date(d));
}

export function formatShortDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  return shortFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  return dateTimeFmt.format(new Date(d));
}

export function isoDate(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  return new Date(d).toISOString();
}

export function formatPrice(cents: number | null | undefined, currency = "USD"): string | null {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Show an "Updated" date only when it is a meaningful, later editorial update. */
export function meaningfulUpdate(published?: Date | null, updated?: Date | null): Date | null {
  if (!published || !updated) return null;
  return updated.getTime() - published.getTime() > 1000 * 60 * 60 * 24 ? updated : null;
}

/** Formats a Date for <input type="datetime-local"> in the display timezone. */
export function toDateTimeLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DISPLAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** Parses a datetime-local value as wall-clock time in the display timezone. */
export function fromDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  // Start from UTC guess, then correct by the zone offset at that instant.
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const asZone = new Date(guess.toLocaleString("en-US", { timeZone: DISPLAY_TIMEZONE }));
  const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() + (asUtc.getTime() - asZone.getTime()));
}

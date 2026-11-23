import "server-only";

/** Server-only environment access. Never import this from a client component. */
function read(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

export const env = {
  databaseUrl: read("DATABASE_URL"),
  uploadDir: read("UPLOAD_DIR") ?? "./storage/uploads",
  cronSecret: read("CRON_SECRET"),
  newsletter: {
    provider: (read("NEWSLETTER_PROVIDER") ?? "").toLowerCase() as "" | "buttondown" | "mailchimp",
    buttondownApiKey: read("BUTTONDOWN_API_KEY"),
    mailchimpApiKey: read("MAILCHIMP_API_KEY"),
    mailchimpAudienceId: read("MAILCHIMP_AUDIENCE_ID"),
    mailchimpDoubleOptIn: read("MAILCHIMP_DOUBLE_OPT_IN") !== "false",
  },
  isProduction: process.env.NODE_ENV === "production",
};

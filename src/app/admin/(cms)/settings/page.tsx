import { requireUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/settings";
import { isNewsletterConfigured, newsletterProvider } from "@/lib/newsletter";
import { saveSettingsAction } from "@/app/admin/actions/site";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { Card, Checkbox, Field, Notice, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Site settings" };

export default async function Settings() {
  await requireUser("ADMIN");
  const [general, newsletter, ads, affiliate] = await Promise.all([getSetting("general"), getSetting("newsletter"), getSetting("ads"), getSetting("affiliate")]);
  const provider = newsletterProvider();
  const ga = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <PageHeader title="Site settings" description="Navigation is managed under Categories & nav. Secrets (API keys, database) live in environment variables, never here." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Publication details">
          <ActionForm action={saveSettingsAction} className="space-y-4">
            <input type="hidden" name="group" value="general" />
            <Field label="Legal business name" htmlFor="businessName" hint="Shown on About, Contact and policy pages. Leave empty until confirmed.">
              <input id="businessName" name="businessName" defaultValue={general.businessName} maxLength={200} className="field" />
            </Field>
            <Field label="Business mailing address" htmlFor="businessAddress"><textarea id="businessAddress" name="businessAddress" defaultValue={general.businessAddress} rows={2} maxLength={500} className="field" /></Field>
            <Field label="Public contact email" htmlFor="contactEmail"><input id="contactEmail" name="contactEmail" type="email" defaultValue={general.contactEmail} maxLength={200} className="field" /></Field>
            <Field label="Social accounts" htmlFor="socialLinks" hint="Official accounts only, one per line: Instagram | https://instagram.com/…">
              <textarea id="socialLinks" name="socialLinks" defaultValue={general.socialLinks.map((s) => `${s.label} | ${s.url}`).join("\n")} rows={4} className="field font-mono text-[0.8125rem]" />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Newsletter">
          <div className="mb-4">
            {isNewsletterConfigured() ? (
              <Notice tone="green">Connected to {provider}. Signups are confirmed by the provider before success is shown.</Notice>
            ) : (
              <Notice tone="amber">No provider configured. Set NEWSLETTER_PROVIDER plus its API key in the environment. Until then, signup forms are hidden — nothing is simulated.</Notice>
            )}
          </div>
          <ActionForm action={saveSettingsAction} className="space-y-4">
            <input type="hidden" name="group" value="newsletter" />
            <Field label="Heading" htmlFor="heading"><input id="heading" name="heading" defaultValue={newsletter.heading} maxLength={120} className="field" /></Field>
            <Field label="Description" htmlFor="nl-description"><textarea id="nl-description" name="description" defaultValue={newsletter.description} rows={3} maxLength={400} className="field" /></Field>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Affiliate disclosure">
          <ActionForm action={saveSettingsAction} className="space-y-4">
            <input type="hidden" name="group" value="affiliate" />
            <Field label="Short disclosure" htmlFor="disclosureShort" hint="Shown at the top of articles with affiliate links and in product modules.">
              <textarea id="disclosureShort" name="disclosureShort" defaultValue={affiliate.disclosureShort} rows={3} maxLength={400} className="field" />
            </Field>
            <Field label="Additional disclosure text" htmlFor="disclosureLong" hint="Appended to the Affiliate Disclosure page, e.g. the programs you actually participate in.">
              <textarea id="disclosureLong" name="disclosureLong" defaultValue={affiliate.disclosureLong} rows={5} maxLength={4000} className="field" />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Advertising">
          <div className="mb-4">
            <Notice tone={ads.enabled ? "green" : "neutral"}>
              {ads.enabled ? "Ads are enabled. Reserved slots render where an ad unit ID is set." : "Ads are disabled. No ad code loads and no empty ad boxes are shown."}
            </Notice>
          </div>
          <ActionForm action={saveSettingsAction} className="space-y-4">
            <input type="hidden" name="group" value="ads" />
            <Checkbox name="enabled" label="Enable ads (only after your ad account is approved)" defaultChecked={ads.enabled} />
            <Field label="Provider" htmlFor="provider">
              <select id="provider" name="provider" defaultValue={ads.provider} className="field">
                <option value="none">None</option>
                <option value="adsense">Google AdSense</option>
              </select>
            </Field>
            <Field label="AdSense publisher ID" htmlFor="adsenseClientId"><input id="adsenseClientId" name="adsenseClientId" defaultValue={ads.adsenseClientId} placeholder="ca-pub-0000000000000000" className="field font-mono text-[0.8125rem]" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["articleIntro", "Below article intro"],
                  ["articleMid", "Mid-article (long reads)"],
                  ["sidebar", "Desktop sidebar"],
                  ["betweenSections", "Between homepage sections"],
                  ["belowRelated", "Below related stories"],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={`${l} — slot ID`} htmlFor={`slot_${k}`}>
                  <input id={`slot_${k}`} name={`slot_${k}`} defaultValue={ads.slots[k]} maxLength={40} className="field font-mono text-[0.8125rem]" />
                </Field>
              ))}
            </div>
            <Field label="Minimum words for a mid-article ad" htmlFor="minWordsForMidArticle"><input id="minWordsForMidArticle" name="minWordsForMidArticle" type="number" min={300} max={5000} defaultValue={ads.minWordsForMidArticle} className="field" /></Field>
            <Field label="ads.txt contents" htmlFor="adsTxt" hint="Served at /ads.txt. Paste exactly what your ad provider gives you.">
              <textarea id="adsTxt" name="adsTxt" defaultValue={ads.adsTxt} rows={3} maxLength={5000} className="field font-mono text-[0.75rem]" />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </ActionForm>
        </Card>

        <Card title="Integrations (environment)">
          <ul className="space-y-2 text-[0.875rem]">
            <li>Google Analytics 4: {ga ? <span className="font-mono">{ga}</span> : <span className="text-muted">not configured (NEXT_PUBLIC_GA_MEASUREMENT_ID)</span>}</li>
            <li>Search Console verification: {process.env.GOOGLE_SITE_VERIFICATION ? "meta tag set" : <span className="text-muted">not configured (GOOGLE_SITE_VERIFICATION)</span>}</li>
            <li>Site URL: <span className="font-mono">{process.env.SITE_URL ?? "not set — defaults to localhost"}</span></li>
            <li>Scheduled publishing cron: {process.env.CRON_SECRET ? "secret set" : <span className="text-muted">CRON_SECRET not set</span>}</li>
          </ul>
        </Card>
      </div>
    </>
  );
}

import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";

/** Typed site settings stored in the SiteSetting table, with safe defaults. */

const url = z.string().url().max(500);

export const generalSettingsSchema = z.object({
  socialLinks: z
    .array(z.object({ label: z.string().min(1).max(40), url }))
    .max(10)
    .default([]),
  contactEmail: z.string().max(200).default(""),
  businessName: z.string().max(200).default(""),
  businessAddress: z.string().max(500).default(""),
});

export const homepageSettingsSchema = z.object({
  sectionOrder: z
    .array(z.enum(["latest", "nails", "outfits", "shoes", "beautyHair", "accessories", "editorsPicks", "popular", "newsletter"]))
    .default(["latest", "nails", "outfits", "shoes", "beautyHair", "accessories", "editorsPicks", "popular", "newsletter"]),
});

export const adSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.enum(["none", "adsense"]).default("none"),
  adsenseClientId: z
    .string()
    .regex(/^(ca-pub-\d{10,20})?$/, "Expected ca-pub-XXXXXXXXXXXXXXXX")
    .default(""),
  slots: z
    .object({
      articleIntro: z.string().max(40).default(""),
      articleMid: z.string().max(40).default(""),
      sidebar: z.string().max(40).default(""),
      betweenSections: z.string().max(40).default(""),
      belowRelated: z.string().max(40).default(""),
    })
    .default({ articleIntro: "", articleMid: "", sidebar: "", betweenSections: "", belowRelated: "" }),
  minWordsForMidArticle: z.number().int().min(300).max(5000).default(900),
  adsTxt: z.string().max(5000).default(""),
});

export const affiliateSettingsSchema = z.object({
  disclosureShort: z
    .string()
    .max(400)
    .default(
      "Gloss & Thread may earn a commission when you buy through links on this page. Our editors choose products independently."
    ),
  disclosureLong: z.string().max(4000).default(""),
});

export const newsletterSettingsSchema = z.object({
  heading: z.string().max(120).default("The Gloss & Thread Letter"),
  description: z
    .string()
    .max(400)
    .default("New stories on outfits, nails, shoes and beauty, sent when we publish something worth your time."),
});

const schemas = {
  general: generalSettingsSchema,
  homepage: homepageSettingsSchema,
  ads: adSettingsSchema,
  affiliate: affiliateSettingsSchema,
  newsletter: newsletterSettingsSchema,
} as const;

export type SettingsKey = keyof typeof schemas;
export type SettingsValue<K extends SettingsKey> = z.infer<(typeof schemas)[K]>;

export const getSetting = cache(async <K extends SettingsKey>(key: K): Promise<SettingsValue<K>> => {
  const schema = schemas[key];
  try {
    const row = await db.siteSetting.findUnique({ where: { key } });
    const parsed = schema.safeParse(row?.value ?? {});
    if (parsed.success) return parsed.data as SettingsValue<K>;
  } catch (err) {
    console.error(`[settings] failed to load "${key}"`, err);
  }
  return schema.parse({}) as SettingsValue<K>;
});

export async function saveSetting<K extends SettingsKey>(key: K, value: unknown): Promise<SettingsValue<K>> {
  const data = schemas[key].parse(value) as SettingsValue<K>;
  await db.siteSetting.upsert({
    where: { key },
    update: { value: data as object },
    create: { key, value: data as object },
  });
  return data;
}

export function settingsSchema<K extends SettingsKey>(key: K) {
  return schemas[key];
}

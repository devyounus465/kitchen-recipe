import "server-only";
import { cache } from "react";
import { db, siteSettings } from "@/db";

/** CMS-editable settings with safe defaults (Admin → Settings). */
type Settings = {
  tagline: string;
  footerAbout: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  contactEmail: string;
  social: { Facebook: string; Instagram: string; Pinterest: string; TikTok: string; YouTube: string };
  /** "links" = hold reviews containing links (default); "all" = every review needs approval; "none" = publish immediately. */
  reviewModeration: "links" | "all" | "none";
};
const DEFAULT_SETTINGS: Settings = {
  tagline: "Recipes, reviews & cooking inspiration from home cooks",
  footerAbout: "Recipes, reviews and cooking inspiration from home cooks like you.",
  newsletterTitle: "Get our best recipes delivered",
  newsletterSubtitle: "Sign up for the Simmerly Daily Dish newsletter.",
  contactEmail: "",
  social: { Facebook: "", Instagram: "", Pinterest: "", TikTok: "", YouTube: "" },
  reviewModeration: "links",
};

export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const rows = await db.select().from(siteSettings);
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...stored, social: { ...DEFAULT_SETTINGS.social, ...(stored.social ?? {}) } };
  } catch { return DEFAULT_SETTINGS; }
});

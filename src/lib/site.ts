export const SITE = {
  name: "Simmerly",
  tagline: "Recipes, reviews & cooking inspiration from home cooks",
  url: process.env.SITE_URL || "http://localhost:3000",
  /** Social profile URLs shown in the footer. Leave empty ("") to hide an icon. */
  social: {
    Facebook: process.env.SOCIAL_FACEBOOK || "",
    Instagram: process.env.SOCIAL_INSTAGRAM || "",
    Pinterest: process.env.SOCIAL_PINTEREST || "",
    TikTok: process.env.SOCIAL_TIKTOK || "",
    YouTube: process.env.SOCIAL_YOUTUBE || "",
  } as Record<string, string>,
};
export const DIETS = [
  ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["gluten-free", "Gluten-Free"],
  ["dairy-free", "Dairy-Free"], ["low-carb", "Low-Carb"], ["keto", "Keto"],
] as const;
export const TIME_FILTERS = [[15, "15 minutes or less"], [30, "30 minutes or less"], [45, "45 minutes or less"], [60, "1 hour or less"]] as const;

export const SITE = {
  name: "Simmerly",
  tagline: "Recipes, reviews & cooking inspiration from home cooks",
  url: process.env.SITE_URL || "http://localhost:3000",
  social: ["facebook", "instagram", "pinterest", "tiktok", "youtube"],
};
export const DIETS = [
  ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["gluten-free", "Gluten-Free"],
  ["dairy-free", "Dairy-Free"], ["low-carb", "Low-Carb"], ["keto", "Keto"],
] as const;
export const TIME_FILTERS = [[15, "15 minutes or less"], [30, "30 minutes or less"], [45, "45 minutes or less"], [60, "1 hour or less"]] as const;

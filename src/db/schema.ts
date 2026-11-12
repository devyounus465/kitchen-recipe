import {
  pgTable, serial, text, integer, boolean, timestamp, jsonb, real, primaryKey, index, uniqueIndex, varchar,
} from "drizzle-orm/pg-core";

export type Ingredient = { qty: number | null; unit: string; item: string; note?: string };
export type Step = { text: string; image?: string };
export type Nutrition = {
  calories?: number; fat?: number; saturatedFat?: number; cholesterol?: number; sodium?: number;
  carbs?: number; fiber?: number; sugar?: number; protein?: number;
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  bio: text("bio").default(""),
  avatarUrl: text("avatar_url"),
  location: varchar("location", { length: 120 }),
  role: varchar("role", { length: 20 }).notNull().default("user"), // user | contributor | editor | admin
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | banned
  isStaff: boolean("is_staff").notNull().default(false), // shown as editorial author
  title: varchar("title", { length: 120 }), // e.g. "Senior Food Editor"
  newsletter: boolean("newsletter").notNull().default(false),
  /** Bumped on password change/reset/ban to invalidate existing sessions. */
  sessionVersion: integer("session_version").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").default(""),
  parentId: integer("parent_id"),
  imageUrl: text("image_url"),
  showInNav: boolean("show_in_nav").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url"),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft | pending | published | rejected
  rejectReason: text("reject_reason"),
  prepMin: integer("prep_min").default(0),
  cookMin: integer("cook_min").default(0),
  additionalMin: integer("additional_min").default(0),
  totalMin: integer("total_min").default(0),
  servings: integer("servings").notNull().default(4),
  yieldText: varchar("yield_text", { length: 120 }),
  ingredients: jsonb("ingredients").$type<Ingredient[]>().notNull().default([]),
  steps: jsonb("steps").$type<Step[]>().notNull().default([]),
  nutrition: jsonb("nutrition").$type<Nutrition>(),
  notes: text("notes"),
  diets: text("diets").array().notNull().default([]),
  cuisine: varchar("cuisine", { length: 60 }),
  ratingAvg: real("rating_avg").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),
  photoCount: integer("photo_count").notNull().default(0),
  saveCount: integer("save_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("recipes_status_idx").on(t.status), index("recipes_rating_idx").on(t.ratingAvg)]);

export const recipeCategories = pgTable("recipe_categories", {
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.recipeId, t.categoryId] })]);

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  body: text("body").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("approved"), // pending | approved | rejected
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("reviews_user_recipe").on(t.userId, t.recipeId), index("reviews_recipe_idx").on(t.recipeId)]);

export const reviewHelpful = pgTable("review_helpful", {
  reviewId: integer("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.reviewId, t.userId] })]);

export const recipePhotos = pgTable("recipe_photos", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption").default(""),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedRecipes = pgTable("saved_recipes", {
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.recipeId] })]);

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 160 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url"),
  isEditorial: boolean("is_editorial").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(false),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const collectionRecipes = pgTable("collection_recipes", {
  collectionId: integer("collection_id").notNull().references(() => collections.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.collectionId, t.recipeId] })]);

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  kind: varchar("kind", { length: 20 }).notNull().default("article"), // article | guide | news
  title: varchar("title", { length: 220 }).notNull(),
  dek: text("dek").default(""),
  body: text("body").notNull().default(""), // markdown-lite
  heroUrl: text("hero_url"),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  relatedRecipeIds: integer("related_recipe_ids").array().notNull().default([]),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").default(""),
  videoUrl: text("video_url"), // mp4 url or YouTube/Vimeo url
  thumbnailUrl: text("thumbnail_url"),
  durationSec: integer("duration_sec").default(0),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type SectionConfig = {
  recipeIds?: number[]; categorySlug?: string; collectionSlug?: string; articleIds?: number[];
  limit?: number; sort?: "latest" | "rating" | "popular"; subtitle?: string;
};
export const homepageSections = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 40 }).notNull(), // hero | recipe_grid | recipe_row | category_tiles | article_list | video_row | collection_feature | newsletter
  title: varchar("title", { length: 160 }).notNull(),
  config: jsonb("config").$type<SectionConfig>().notNull().default({}),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
});

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull().default(""),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mime: varchar("mime", { length: 80 }).notNull(),
  size: integer("size").notNull().default(0),
  alt: text("alt").default(""),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  handled: boolean("handled").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailOutbox = pgTable("email_outbox", {
  id: serial("id").primaryKey(),
  to: varchar("to", { length: 255 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

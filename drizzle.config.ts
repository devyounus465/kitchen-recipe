import { defineConfig } from "drizzle-kit";
import "./scripts/env";
export default defineConfig({ schema: "./src/db/schema.ts", dialect: "postgresql", dbCredentials: { url: process.env.DATABASE_URL! } });

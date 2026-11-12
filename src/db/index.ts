import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };
const serverless = !!(process.env.VERCEL || process.env.NETLIFY);
// Serverless: one connection per instance and no prepared statements (works with poolers like Neon's).
const client = g.__pg ?? postgres(process.env.DATABASE_URL!, serverless ? { max: 1, prepare: false, idle_timeout: 20 } : { max: 10 });
if (process.env.NODE_ENV !== "production") g.__pg = client;
export const db = drizzle(client, { schema });
export * from "./schema";

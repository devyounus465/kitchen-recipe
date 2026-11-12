// One-command local setup: `npm run local`
// Starts a portable PostgreSQL (downloaded by npm, no install needed), creates the
// schema, seeds demo content on first run, then launches the Next.js dev server.
// Data is kept in ./.pgdata between runs. Delete that folder to start fresh.
import EmbeddedPostgres from "embedded-postgres";
import postgres from "postgres";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.LOCAL_PG_PORT || 54329);
const DATA_DIR = path.resolve(".pgdata");
const DB_URL = `postgres://simmerly:simmerly@127.0.0.1:${PORT}/simmerly`;

// Everything launched from here uses the embedded database (overrides .env).
process.env.DATABASE_URL = DB_URL;
process.env.AUTH_SECRET ||= "local-dev-secret-change-me-in-production-0123456789";
process.env.SITE_URL ||= "http://localhost:3000";
process.env.UPLOAD_DIR ||= "./uploads";

const log = (m: string) => console.log(`\x1b[38;5;166m[simmerly]\x1b[0m ${m}`);
const run = (cmd: string) => new Promise<void>((resolve, reject) => {
  const p = spawn(cmd, { shell: true, stdio: "inherit", env: process.env });
  p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`"${cmd}" exited with code ${code}`))));
});

const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR, port: PORT, user: "simmerly", password: "simmerly", persistent: true,
  createPostgresUser: isRoot, onLog: () => {}, onError: (e) => console.error(String(e)),
});

let stopping = false;
let web: ReturnType<typeof spawn> | null = null;
async function shutdown(code = 0) {
  if (stopping) return; stopping = true;
  if (web && web.exitCode === null) { try { web.kill("SIGINT"); } catch { /* gone */ } }
  log("Stopping database…");
  try { await pg.stop(); } catch { /* already stopped */ }
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

try {
  const fresh = !fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (fresh) { log("First run: creating local database (takes ~20s)…"); await pg.initialise(); }
  await pg.start();
  log(`Database running on port ${PORT}`);
  try { await pg.createDatabase("simmerly"); } catch { /* exists */ }

  log("Applying schema…");
  await run("npx drizzle-kit push --force");
  await run("npx tsx scripts/post-migrate.ts");

  const sql = postgres(DB_URL, { max: 1, onnotice: () => {} });
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM categories`;
  await sql.end();
  if (n === 0) { log("Loading demo content…"); await run("npx tsx scripts/seed.ts"); }

  log("Starting website → http://localhost:3000   (admin: admin@simmerly.test / Admin123!)");
  log("Press Ctrl+C to stop.");
  web = spawn("npx next dev -p 3000", { shell: true, stdio: "inherit", env: process.env });
  web.on("exit", (code) => shutdown(code ?? 0));
} catch (e) {
  console.error("\n✖ Local setup failed:", (e as Error).message);
  if (/EADDRINUSE|already in use/i.test(String(e))) console.error(`  Port ${PORT} is busy. Try: set LOCAL_PG_PORT=54330 && npm run local`);
  if (/administrative|root/i.test(String(e))) console.error("  PostgreSQL can't run from an Administrator terminal. Open a normal (non-admin) terminal and retry.");
  await shutdown(1);
}

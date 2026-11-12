// Beginner-friendly setup for an installed PostgreSQL: `npm run setup`
// Asks for the postgres password, creates the "simmerly" database, writes .env,
// creates the tables and loads demo content. Safe to run more than once.
import postgres from "postgres";
import readline from "node:readline";
import crypto from "node:crypto";
import fs from "node:fs";
import { spawn } from "node:child_process";

const c = { o: "\x1b[38;5;166m", g: "\x1b[32m", r: "\x1b[31m", b: "\x1b[1m", x: "\x1b[0m" };
const say = (m: string) => console.log(`${c.o}[setup]${c.x} ${m}`);
const fail = (m: string) => console.log(`${c.r}✖ ${m}${c.x}`);

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const rlAny = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      rlAny._writeToOutput = (s: string) => { if (s.includes(q)) rlAny.output.write(s); else if (s.includes("\n") || s.includes("\r")) rlAny.output.write("\n"); else rlAny.output.write("*"); };
    }
    rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
  });
}
const run = (cmd: string, env: NodeJS.ProcessEnv) => new Promise<void>((resolve, reject) => {
  const p = spawn(cmd, { shell: true, stdio: "inherit", env });
  p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`"${cmd}" failed (exit code ${code})`))));
});

console.log(`\n${c.b}Simmerly setup${c.x} — connects to the PostgreSQL installed on this computer.\n`);

const port = (await ask("PostgreSQL port (press Enter for 5432): ")) || "5432";
const user = (await ask("PostgreSQL username (press Enter for postgres): ")) || "postgres";
let password = "";
let admin: ReturnType<typeof postgres> | null = null;

for (let attempt = 1; attempt <= 3 && !admin; attempt++) {
  password = await ask(`Password for "${user}" (the one you chose when installing PostgreSQL): `, true);
  const conn = postgres({ host: "127.0.0.1", port: Number(port), user, password, database: "postgres", max: 1, connect_timeout: 8, onnotice: () => {} });
  try { await conn`SELECT 1`; admin = conn; say(`${c.g}Connected to PostgreSQL ✓${c.x}`); }
  catch (e) {
    await conn.end({ timeout: 1 }).catch(() => {});
    const err = e as { code?: string; message?: string; errors?: { code?: string }[] };
    const code = err.code || err.errors?.[0]?.code;
    if (code === "28P01") fail("Wrong password. Try again (it's the password from the PostgreSQL installer).");
    else if (code === "ECONNREFUSED" || code === "ETIMEDOUT") {
      fail(`Can't reach PostgreSQL on port ${port}.`);
      console.log("  It may not be running. Press Win+R, type services.msc, find 'postgresql-x64-…', right-click → Start.");
      console.log("  If you chose a different port during installation, run npm run setup again and enter that port.");
      process.exit(1);
    } else { fail(`Connection error: ${err.message || code}`); process.exit(1); }
  }
}
if (!admin) { fail("Too many wrong passwords. If you forgot it, reinstall PostgreSQL or reset the password."); process.exit(1); }

const exists = await admin`SELECT 1 FROM pg_database WHERE datname = 'simmerly'`;
if (!exists.length) { await admin.unsafe("CREATE DATABASE simmerly"); say(`${c.g}Created database "simmerly" ✓${c.x}`); }
else say("Database \"simmerly\" already exists ✓");
await admin.end();

const url = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:${port}/simmerly`;
let envText = fs.existsSync(".env") ? fs.readFileSync(".env", "utf8").replace(/\r\n/g, "\n") : "";
const setVar = (k: string, v: string, keep = false) => {
  const re = new RegExp(`^${k}=.*$`, "m");
  if (re.test(envText)) { if (!keep) envText = envText.replace(re, `${k}=${v}`); }
  else envText += (envText && !envText.endsWith("\n") ? "\n" : "") + `${k}=${v}\n`;
};
setVar("DATABASE_URL", url);
setVar("AUTH_SECRET", crypto.randomBytes(32).toString("hex"), true);
setVar("UPLOAD_DIR", "./uploads", true);
setVar("SITE_URL", "http://localhost:3000", true);
fs.writeFileSync(".env", envText);
say(`${c.g}Saved settings to .env ✓${c.x}`);

const env = { ...process.env, DATABASE_URL: url };
try {
  say("Creating tables…");
  await run("npx drizzle-kit push --force", env);
  await run("npx tsx scripts/post-migrate.ts", env);
  const db = postgres(url, { max: 1, onnotice: () => {} });
  const [{ n }] = await db`SELECT count(*)::int AS n FROM categories`;
  await db.end();
  if (n === 0) { say("Loading demo recipes…"); await run("npx tsx scripts/seed.ts", env); }
  else say("Demo content already loaded ✓ (run npm run db:seed to reset it)");
} catch (e) { fail((e as Error).message); process.exit(1); }

console.log(`\n${c.g}${c.b}All set!${c.x} Start the website with:\n\n    ${c.b}npm run dev${c.x}\n\nthen open http://localhost:3000   (admin: admin@simmerly.test / Admin123!)\n`);

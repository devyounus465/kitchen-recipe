// Create (or promote) an administrator account. Use this for a real launch instead of demo seed data.
//   npm run create-admin                         → asks for email, name and password
//   ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npm run create-admin   (non-interactive)
import "./env";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import readline from "node:readline";

function ask(q: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const r = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
      r._writeToOutput = (s: string) => { if (s.includes(q)) r.output.write(s); else if (/[\r\n]/.test(s)) r.output.write("\n"); else r.output.write("*"); };
    }
    rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
  });
}

const email = (process.env.ADMIN_EMAIL || (await ask("Admin email: "))).toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error("✖ Invalid email."); process.exit(1); }
const nonInteractive = !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
const name = process.env.ADMIN_NAME || (nonInteractive ? "" : await ask("Display name (Enter for 'Site Admin'): ")) || "Site Admin";
const password = process.env.ADMIN_PASSWORD || (await ask("Password (min 12 characters): ", true));
if (password.length < 12 || password.length > 128) { console.error("✖ Password must be 12–128 characters."); process.exit(1); }

const sql = postgres(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
const passwordHash = await bcrypt.hash(password, 12);
const base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 30) || "admin";
let username = base; let n = 1;
while ((await sql`SELECT 1 FROM users WHERE username = ${username} AND email <> ${email}`).length) username = `${base}${++n}`;
const [u] = await sql`
  INSERT INTO users (email, password_hash, name, username, role, status)
  VALUES (${email}, ${passwordHash}, ${name}, ${username}, 'admin', 'active')
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', status = 'active',
    session_version = users.session_version + 1
  RETURNING id, (xmax = 0) AS created`;
console.log(`✓ ${u.created ? "Created" : "Updated"} administrator ${email}. Log in at /admin.`);
await sql.end();

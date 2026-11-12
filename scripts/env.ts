// Minimal .env loader for CLI scripts (drizzle-kit, seed, import).
// Handles Windows CRLF line endings, BOM, comments, `export`, and quoted values.
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.cwd(), ".env");
if (fs.existsSync(file)) {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}
if (!process.env.DATABASE_URL) {
  console.error(
    "\n✖ DATABASE_URL is not set.\n" +
    `  Create a .env file in ${process.cwd()} (copy .env.example; on Windows CMD: copy .env.example .env)\n` +
    "  and make sure it contains: DATABASE_URL=postgres://simmerly:simmerly@localhost:5432/simmerly\n"
  );
  process.exit(1);
}

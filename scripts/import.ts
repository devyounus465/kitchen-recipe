// Bulk content import. Usage: npm run import -- content.json   (format: see scripts/sample-import.json)
import "./env";
import fs from "node:fs";
import { importContent } from "../src/lib/importer";

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error("usage: npm run import -- content.json"); process.exit(1); }
const report = await importContent(JSON.parse(fs.readFileSync(file, "utf8")));
console.log(`Imported ${report.created}, skipped ${report.skipped} (already exist).`);
if (report.errors.length) { console.log("Notes/errors:\n- " + report.errors.join("\n- ")); }
process.exit(report.errors.length && !report.created && !report.skipped ? 1 : 0);

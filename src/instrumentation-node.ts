// Fail fast on unsafe production configuration instead of discovering it on the first login.
if (process.env.NODE_ENV === "production") {
  const problems: string[] = [];
  const secret = process.env.AUTH_SECRET || "";
  if (secret.length < 32 || /change-me|dev-only/i.test(secret)) problems.push("AUTH_SECRET must be a unique random value of 32+ characters (openssl rand -hex 32).");
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL is not set.");
  if (!process.env.SITE_URL) console.warn("[config] SITE_URL is not set; links in emails will point to http://localhost:3000.");
  if (problems.length) {
    console.error("\n✖ Refusing to start — unsafe production configuration:\n  - " + problems.join("\n  - ") + "\n");
    process.exit(1);
  }
}
export {};

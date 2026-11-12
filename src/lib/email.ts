import "server-only";
import nodemailer from "nodemailer";
import { db, emailOutbox } from "@/db";
import { SITE } from "@/lib/site";

/**
 * Email adapter. Every email is recorded in the outbox (Admin → Email outbox).
 * When SMTP_HOST is configured it is also delivered via SMTP, e.g. Hostinger:
 *   SMTP_HOST=smtp.hostinger.com SMTP_PORT=465 SMTP_USER=no-reply@yourdomain.com SMTP_PASS=…
 */
const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

export async function sendEmail(to: string, subject: string, body: string) {
  await db.insert(emailOutbox).values({ to, subject, body });
  if (!transport) {
    if (process.env.NODE_ENV !== "production") console.log(`[email:dev] to=${to} subject=${subject}\n${body}`);
    else console.warn(`[email] SMTP is not configured; "${subject}" was only stored in the outbox.`);
    return;
  }
  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || `${SITE.name} <${process.env.SMTP_USER}>`, to, subject, text: body });
  } catch (e) {
    // Never let an email failure break the user's action (registration, reset request…).
    console.error(`[email] delivery failed to ${to}: ${(e as Error).message}`);
  }
}

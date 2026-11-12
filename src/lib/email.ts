import "server-only";
import { db, emailOutbox } from "@/db";
/** Email adapter: writes to the outbox table (visible in Admin → Email outbox) and logs.
 *  Production: add an SMTP/Resend transport here. */
export async function sendEmail(to: string, subject: string, body: string) {
  await db.insert(emailOutbox).values({ to, subject, body });
  console.log(`[email] to=${to} subject=${subject}\n${body}`);
}

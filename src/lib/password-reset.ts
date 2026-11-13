import "server-only";
import crypto from "node:crypto";
import { db, passwordResets } from "@/db";
import { sendEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

/** Issues a single-use, 1-hour (or longer for invitations) reset link and emails it. Only the token hash is stored. */
export async function issuePasswordReset(user: { id: number; email: string; name: string }, opts: { invite?: boolean } = {}) {
  const token = crypto.randomBytes(32).toString("hex");
  const hours = opts.invite ? 72 : 1;
  await db.insert(passwordResets).values({ userId: user.id, tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + hours * 3600_000) });
  const link = `${SITE.url}/account/reset-password/?token=${token}`;
  if (opts.invite) await sendEmail(user.email, `You've been invited to ${SITE.name}`, `Hi ${user.name},\n\nAn account has been created for you on ${SITE.name}. Choose your password here (link valid for ${hours} hours):\n${link}\n`);
  else await sendEmail(user.email, "Reset your password", `Hi ${user.name},\n\nReset your password (link valid for ${hours} hour):\n${link}\n\nIf you didn't request this, ignore this email.`);
}

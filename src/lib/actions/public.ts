"use server";
import { z } from "zod";
import { db, newsletterSubscribers, contactMessages } from "@/db";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export type FormState = { ok?: boolean; error?: string; message?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

export async function subscribeNewsletter(_: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!z.string().email().max(255).safeParse(email).success) return { error: "Please enter a valid email address." };
  if (!rateLimit(`newsletter:${await clientIp()}`, 5)) return { error: "Too many sign-ups from your network. Please try again later." };
  await db.insert(newsletterSubscribers).values({ email }).onConflictDoNothing();
  return { ok: true, message: "You're subscribed! Watch your inbox for our best recipes." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120), email: z.string().trim().email("Please enter a valid email.").max(255),
  subject: z.string().trim().min(3, "Please add a subject.").max(200), message: z.string().trim().min(10, "Message must be at least 10 characters.").max(5000, "Message is too long (max 5,000 characters)."),
});
export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get("website")) return { ok: true, message: "Thanks!" }; // honeypot
  if (!rateLimit(`contact:${await clientIp()}`, 5)) return { error: "You've sent several messages recently. Please try again later." };
  const p = contactSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "Please fix the errors below.", fieldErrors: Object.fromEntries(p.error.issues.map((i) => [i.path[0], i.message])) };
  await db.insert(contactMessages).values(p.data);
  return { ok: true, message: "Thanks for reaching out! Our team will reply within 2 business days." };
}

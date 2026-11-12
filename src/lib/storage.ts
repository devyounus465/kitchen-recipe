import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { put } from "@vercel/blob";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4" };
const MAX_BYTES = 4 * 1024 * 1024; // stays under Vercel's 4.5MB request limit
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
/** On serverless hosts (Vercel/Netlify) the local disk is temporary, so files go to Vercel Blob. */
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const serverless = !!(process.env.VERCEL || process.env.NETLIFY);

/** Storage adapter: Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise local disk (UPLOAD_DIR). */
export async function saveFile(file: File): Promise<{ url: string; filename: string; mime: string; size: number }> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Unsupported file type. Use JPG, PNG, WebP, GIF or MP4.");
  if (file.type === "video/mp4" && serverless) throw new Error("Video uploads aren't supported on this hosting. Paste a YouTube, Vimeo or MP4 link instead.");
  if (file.size > (file.type === "video/mp4" ? MAX_VIDEO_BYTES : MAX_BYTES)) throw new Error(file.type === "video/mp4" ? "Video is too large (max 60MB)." : "Image is too large (max 4MB). Please resize it and try again.");
  if (serverless && !useBlob) throw new Error("File uploads need storage: connect Vercel Blob (sets BLOB_READ_WRITE_TOKEN) and redeploy.");
  const buf = Buffer.from(await file.arrayBuffer());
  // magic-byte check for images
  const sig = buf.subarray(0, 12).toString("hex");
  const ok = file.type === "video/mp4" ? buf.subarray(4, 8).toString() === "ftyp"
    : sig.startsWith("ffd8ff") || sig.startsWith("89504e47") || sig.startsWith("47494638") || (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP");
  if (!ok) throw new Error("File content does not match its type.");
  const d = new Date(); const sub = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const name = crypto.randomBytes(12).toString("hex") + ext;
  if (useBlob) {
    const blob = await put(`uploads/${sub}/${name}`, buf, { access: "public", contentType: file.type, addRandomSuffix: false });
    return { url: blob.url, filename: file.name, mime: file.type, size: file.size };
  }
  await fs.mkdir(path.join(UPLOAD_DIR, sub), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, sub, name), buf);
  return { url: `/media/${sub}/${name}`, filename: file.name, mime: file.type, size: file.size };
}

import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "video/mp4": ".mp4" };
export const MAX_BYTES = 8 * 1024 * 1024;

/** Local-disk storage adapter. Swap for S3/R2 by re-implementing saveFile(). */
export async function saveFile(file: File): Promise<{ url: string; filename: string; mime: string; size: number }> {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("Unsupported file type. Use JPG, PNG, WebP, GIF or MP4.");
  if (file.size > (file.type === "video/mp4" ? 60 * 1024 * 1024 : MAX_BYTES)) throw new Error("File is too large.");
  const buf = Buffer.from(await file.arrayBuffer());
  // magic-byte check for images
  const sig = buf.subarray(0, 12).toString("hex");
  const ok = file.type === "video/mp4" ? buf.subarray(4, 8).toString() === "ftyp"
    : sig.startsWith("ffd8ff") || sig.startsWith("89504e47") || sig.startsWith("47494638") || (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP");
  if (!ok) throw new Error("File content does not match its type.");
  const d = new Date(); const sub = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const name = crypto.randomBytes(12).toString("hex") + ext;
  await fs.mkdir(path.join(UPLOAD_DIR, sub), { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, sub, name), buf);
  return { url: `/media/${sub}/${name}`, filename: file.name, mime: file.type, size: file.size };
}

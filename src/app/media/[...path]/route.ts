import fs from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/storage";
const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4" };
export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const p = (await params).path.join("/");
  const full = path.resolve(UPLOAD_DIR, p);
  if (!full.startsWith(UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const buf = await fs.readFile(full);
    return new Response(new Uint8Array(buf), { headers: { "content-type": TYPES[path.extname(full)] || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" } });
  } catch { return new Response("Not found", { status: 404 }); }
}

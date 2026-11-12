/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
// Hosts allowed to submit forms (Server Actions) when the site is reached through a
// tunnel or proxy (e.g. a free Cloudflare/ngrok demo link). Add more via ALLOWED_ORIGINS.
const allowedOrigins = [
  "localhost:3000", "*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt",
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
];
export default {
  output: process.env.STANDALONE ? "standalone" : undefined,
  poweredByHeader: false,
  trailingSlash: true,
  experimental: { serverActions: { bodySizeLimit: "10mb", allowedOrigins } },
  allowedDevOrigins: ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt"],
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};

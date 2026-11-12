/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";
const isPublicHttps = (process.env.SITE_URL || "").startsWith("https://");

// Content-Security-Policy: blocks injected third-party scripts, plugins, foreign framing and
// form posts to other sites. Next.js needs inline scripts for hydration ('unsafe-inline');
// 'unsafe-eval' only in development for fast refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isPublicHttps ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Hosts allowed to submit forms (Server Actions) besides the site's own origin.
// Free tunnel domains (Cloudflare/ngrok demo links) are only allowed when the site is NOT
// deployed on a public https domain, so production never accepts them.
const tunnelHosts = ["*.trycloudflare.com", "*.ngrok-free.app", "*.ngrok.app", "*.loca.lt"];
const allowedOrigins = [
  ...(isPublicHttps ? [] : ["localhost:3000", ...tunnelHosts]),
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
];

export default {
  output: process.env.STANDALONE ? "standalone" : undefined,
  poweredByHeader: false,
  trailingSlash: true,
  experimental: { serverActions: { bodySizeLimit: "10mb", allowedOrigins } },
  allowedDevOrigins: tunnelHosts,
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};

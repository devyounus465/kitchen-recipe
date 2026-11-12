/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];
export default {
  output: process.env.STANDALONE ? "standalone" : undefined,
  poweredByHeader: false,
  trailingSlash: true,
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};

import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#ce4620", dark: "#a83a1a", light: "#fbeee9" },
        ink: "#111111", body: "#262626", muted: "#595959", rule: "#e6e6e6", tint: "#f5f5f5",
        admin: { bg: "#f6f7f9", side: "#0f1115", card: "#ffffff", line: "#e7e9ee" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      maxWidth: { site: "1200px" },
      boxShadow: { card: "0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.08)", pop: "0 12px 32px rgba(0,0,0,.14)" },
    },
  },
  plugins: [],
} satisfies Config;

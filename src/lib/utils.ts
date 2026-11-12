export function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
}
export function parseQty(s: string): number | null {
  s = s.trim(); if (!s) return null;
  let total = 0;
  for (const part of s.split(/\s+/)) {
    if (part.includes("/")) { const [a, b] = part.split("/").map(Number); if (!b) return null; total += a / b; }
    else { const n = Number(part); if (Number.isNaN(n)) return null; total += n; }
  }
  return total;
}
const FRACS: [number, string][] = [[1/8,"⅛"],[1/4,"¼"],[1/3,"⅓"],[3/8,"⅜"],[1/2,"½"],[5/8,"⅝"],[2/3,"⅔"],[3/4,"¾"],[7/8,"⅞"]];
export function formatQty(n: number | null): string {
  if (n == null) return "";
  const whole = Math.floor(n + 1e-9); const frac = n - whole;
  if (frac < 0.04) return String(whole);
  if (frac > 0.96) return String(whole + 1);
  let best = FRACS[0]; for (const f of FRACS) if (Math.abs(f[0] - frac) < Math.abs(best[0] - frac)) best = f;
  if (Math.abs(best[0] - frac) > 0.06) return (Math.round(n * 100) / 100).toString();
  return whole ? `${whole} ${best[1]}` : best[1];
}
export function formatMinutes(m?: number | null) {
  if (!m) return "";
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  return [d && `${d} day${d > 1 ? "s" : ""}`, h && `${h} hr${h > 1 ? "s" : ""}`, mm && `${mm} min${mm > 1 ? "s" : ""}`].filter(Boolean).join(" ");
}
export function formatDate(d?: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
export function compact(n: number) { return n.toLocaleString("en-US"); }
export function cn(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }
export const recipeUrl = (r: { id: number; slug: string }) => `/recipe/${r.id}/${r.slug}/`;
export const categoryUrl = (c: { id: number; slug: string }) => `/recipes/${c.id}/${c.slug}/`;
export const articleUrl = (a: { slug: string }) => `/article/${a.slug}/`;
export const videoUrl = (v: { id: number; slug: string }) => `/video/${v.id}/${v.slug}/`;
export const cookUrl = (u: { username: string }) => `/cook/${u.username}/`;
export function initials(name: string) { return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(); }

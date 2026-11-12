import { initials, cn } from "@/lib/utils";
const COLORS = ["#ce4620", "#2f6f4f", "#3a5a8c", "#8c3a6b", "#a5761f", "#4a4a4a"];
export function Avatar({ name, url, size = 40, className }: { name: string; url?: string | null; size?: number; className?: string }) {
  const color = COLORS[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt="" width={size} height={size} className={cn("rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  return <span aria-hidden className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white", className)} style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>{initials(name)}</span>;
}

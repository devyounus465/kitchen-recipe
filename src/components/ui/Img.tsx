"use client";
import { useEffect, useRef, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

/** Image with graceful fallback (keeps layout if a remote photo is unavailable). */
export function Img({ src, alt, className, w, eager }: { src?: string | null; alt: string; className?: string; w?: number; eager?: boolean }) {
  const [err, setErr] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // catch images that failed before hydration (onError would not fire)
  useEffect(() => { const el = ref.current; if (el && el.complete && el.naturalWidth === 0) setErr(true); }, [src]);
  let url = src || "";
  if (url && w && url.includes("images.unsplash.com")) url = url.replace(/([?&])w=\d+/, `$1w=${w}`);
  if (!url || err) return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-[#f3e2d9] to-[#e9cbbb] text-brand/70", className)} role="img" aria-label={alt}>
      <UtensilsCrossed className="h-1/4 max-h-12 w-1/4 max-w-12" strokeWidth={1.5} />
    </div>
  );
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={url} alt={alt} className={cn("object-cover", className)} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setErr(true)} />;
}

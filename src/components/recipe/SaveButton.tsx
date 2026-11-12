"use client";
import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SaveButton({ recipeId, initial, variant = "icon", loggedIn }: { recipeId: number; initial: boolean; variant?: "icon" | "button"; loggedIn: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter(); const path = usePathname();
  function toggle(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (!loggedIn) { router.push(`/account/login?next=${encodeURIComponent(path)}&reason=save`); return; }
    const next = !saved; setSaved(next);
    start(async () => {
      const res = await fetch("/api/save/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ recipeId, saved: next }) });
      if (!res.ok) { setSaved(!next); setToast("Something went wrong. Try again."); }
      else setToast(next ? "Saved to My Recipes" : "Removed from My Recipes");
      setTimeout(() => setToast(null), 2200);
    });
  }
  const label = saved ? "Saved" : "Save";
  return (
    <>
      {variant === "icon" ? (
        <button onClick={toggle} aria-pressed={saved} aria-label={saved ? "Remove from saved recipes" : "Save recipe"}
          className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-card transition hover:scale-110", saved ? "text-brand" : "text-ink")}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-[18px] w-[18px]", saved && "fill-brand")} />}
        </button>
      ) : (
        <button onClick={toggle} aria-pressed={saved} className={cn("btn h-11 border-2 px-5 text-[14px]", saved ? "border-brand bg-brand text-white hover:bg-brand-dark" : "border-ink text-ink hover:bg-ink hover:text-white")}>
          <Heart className={cn("h-4 w-4", saved && "fill-white")} /> {label}
        </button>
      )}
      {toast && <div role="status" className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-[15px] font-semibold text-white shadow-pop">{toast}</div>}
    </>
  );
}

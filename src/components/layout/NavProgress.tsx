"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Thin top progress bar while a page navigation is in flight (loading state, brief §6). */
export function NavProgress() {
  const pathname = usePathname(); const search = useSearchParams();
  const [width, setWidth] = useState(0); const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const start = () => {
      if (timer.current) clearInterval(timer.current);
      setVisible(true); setWidth(8);
      timer.current = setInterval(() => setWidth((w) => (w < 85 ? w + (90 - w) * 0.08 : w)), 200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      start();
    };
    const onSubmit = (e: SubmitEvent) => { const f = e.target as HTMLFormElement; if (!e.defaultPrevented && f.method.toLowerCase() === "get") start(); };
    document.addEventListener("click", onClick, true); document.addEventListener("submit", onSubmit);
    window.addEventListener("simmerly:navstart", start);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit); window.removeEventListener("simmerly:navstart", start); };
  }, []);

  useEffect(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setWidth(100);
    const t = setTimeout(() => { setVisible(false); setWidth(0); }, 250);
    return () => clearTimeout(t);
  }, [pathname, search]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div className="h-full bg-brand shadow-[0_0_8px_rgba(206,70,32,.6)] transition-[width,opacity] duration-200 ease-out" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} />
    </div>
  );
}

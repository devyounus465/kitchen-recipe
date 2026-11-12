import { cn } from "@/lib/utils";
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 select-none", className)} aria-label="Simmerly home">
      <svg viewBox="0 0 32 32" className="h-[1.15em] w-[1.15em]" aria-hidden>
        <path d="M5 15h22v3a9 9 0 0 1-9 9h-4a9 9 0 0 1-9-9z" fill="#ce4620" />
        <path d="M3 15h26" stroke="#ce4620" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M11 11c0-2 2-2 2-4M16 11c0-2 2-2 2-4M21 11c0-2 2-2 2-4" stroke={light ? "#fff" : "#ce4620"} strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
      <span className={cn("font-extrabold lowercase tracking-[-0.03em]", light ? "text-white" : "text-brand")}>simmerly</span>
    </span>
  );
}

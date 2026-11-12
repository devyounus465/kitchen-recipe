import { cn } from "@/lib/utils";
export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[1px]", className)} aria-label={`Rated ${value.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        const pct = fill >= 0.75 ? 100 : fill >= 0.25 ? 50 : 0;
        const gid = `g${i}-${pct}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <defs><linearGradient id={gid}><stop offset={`${pct}%`} stopColor="#ce4620" /><stop offset={`${pct}%`} stopColor="#fff" /></linearGradient></defs>
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill={`url(#${gid})`} stroke="#ce4620" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

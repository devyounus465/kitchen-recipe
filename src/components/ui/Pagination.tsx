import Link from "next/link";
import { cn } from "@/lib/utils";
export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 2);
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} className="btn-ghost h-10 px-4 text-[13px]">Previous</Link>}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-2">{i > 0 && nums[i - 1] !== n - 1 && <span className="text-muted">…</span>}
          <Link href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-bold", n === page ? "bg-ink text-white" : "text-ink hover:bg-tint")}>{n}</Link></span>
      ))}
      {page < pages && <Link href={href(page + 1)} className="btn-ghost h-10 px-4 text-[13px]">Next</Link>}
    </nav>
  );
}

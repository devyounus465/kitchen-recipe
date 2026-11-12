import Link from "next/link";
import { ChevronRight } from "lucide-react";
export function Breadcrumbs({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-print mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] font-bold uppercase tracking-[0.06em]">
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-brand" aria-hidden />}
            <Link href={it.href} className="text-ink underline-offset-4 hover:text-brand hover:underline">{it.label}</Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

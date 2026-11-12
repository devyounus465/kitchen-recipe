import Link from "next/link";
import { cn } from "@/lib/utils";
export function PageHeader({ title, sub, actions, crumb }: { title: string; sub?: string; actions?: React.ReactNode; crumb?: { href: string; label: string } }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>{crumb && <Link href={crumb.href} className="text-[13px] font-semibold text-[#6b7385] hover:text-brand">← {crumb.label}</Link>}
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#0f1115]">{title}</h1>{sub && <p className="mt-0.5 text-[14px] text-[#6b7385]">{sub}</p>}</div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
export function Card({ children, className, title, action, pad = true }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode; pad?: boolean }) {
  return (
    <section className={cn("rounded-xl border border-admin-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.04)]", className)}>
      {title && <div className="flex items-center justify-between border-b border-admin-line px-5 py-3.5"><h2 className="text-[15px] font-semibold text-[#0f1115]">{title}</h2>{action}</div>}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}
const abtn = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[14px] font-semibold transition disabled:opacity-50";
export const abtnPrimary = cn(abtn, "bg-[#0f1115] text-white hover:bg-[#2a2f3a]");
export const abtnBrand = cn(abtn, "bg-brand text-white hover:bg-brand-dark");
export const abtnGhost = cn(abtn, "border border-admin-line bg-white text-[#1d2433] hover:bg-[#f3f4f7]");
export const abtnDanger = cn(abtn, "border border-red-200 bg-white text-red-700 hover:bg-red-50");
export const ainput = "w-full rounded-lg border border-[#d6d9e0] bg-white px-3 py-2 text-[14px] text-[#0f1115] placeholder:text-[#9aa1b0] focus:border-[#0f1115] focus:outline-none focus:ring-2 focus:ring-brand/20";
export const alabel = "mb-1 block text-[13px] font-semibold text-[#3b4252]";
export function Badge({ s }: { s: string }) {
  const map: Record<string, string> = { published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    pending: "bg-amber-50 text-amber-800 ring-amber-600/25", draft: "bg-slate-50 text-slate-600 ring-slate-500/20", rejected: "bg-red-50 text-red-700 ring-red-600/20", banned: "bg-red-50 text-red-700 ring-red-600/20",
    admin: "bg-violet-50 text-violet-700 ring-violet-600/20", editor: "bg-sky-50 text-sky-700 ring-sky-600/20", contributor: "bg-orange-50 text-orange-700 ring-orange-600/20", user: "bg-slate-50 text-slate-600 ring-slate-500/20" };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold capitalize ring-1 ring-inset", map[s] || map.draft)}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{s}</span>;
}
export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto"><table className="w-full text-left text-[14px]">
      <thead><tr className="border-b border-admin-line bg-[#fafbfc] text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6b7385]">{head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-2.5">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-admin-line">{children}</tbody></table>
      {empty && <div className="px-4 py-14 text-center text-[14px] text-[#6b7385]">Nothing here yet.</div>}</div>
  );
}
export function Saved({ show, text = "Changes saved." }: { show?: boolean; text?: string }) { return show ? <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[14px] font-medium text-emerald-800">{text}</div> : null; }

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, UtensilsCrossed, ShieldCheck, FolderTree, Library, Newspaper, Clapperboard, Users, MessageSquareText, Image as ImageIcon, LayoutTemplate, FileText, Inbox, Mail, ExternalLink, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Overview", items: [["/admin", "Dashboard", LayoutDashboard]] },
  { group: "Content", items: [["/admin/recipes", "Recipes", UtensilsCrossed], ["/admin/categories", "Categories", FolderTree], ["/admin/collections", "Collections", Library], ["/admin/articles", "Articles & Guides", Newspaper], ["/admin/videos", "Videos", Clapperboard], ["/admin/media", "Media Library", ImageIcon]] },
  { group: "Community", items: [["/admin/moderation", "Moderation", ShieldCheck], ["/admin/reviews", "Ratings & Reviews", MessageSquareText], ["/admin/users", "Users & Authors", Users]] },
  { group: "Site", items: [["/admin/homepage", "Homepage", LayoutTemplate], ["/admin/pages", "Pages & SEO", FileText], ["/admin/messages", "Messages", Inbox], ["/admin/outbox", "Email Outbox", Mail]] },
] as const;

export function AdminSidebar({ counts, user }: { counts: Record<string, number>; user: { name: string; role: string } }) {
  const path = usePathname(); const [open, setOpen] = useState(false);
  const isActive = (h: string) => (h === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(h));
  const body = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 px-5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-[15px] font-black text-white">S</span><div><div className="text-[15px] font-extrabold leading-none text-white">simmerly</div><div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">Studio CMS</div></div></div>
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((g) => (
          <div key={g.group} className="mt-5"><div className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">{g.group}</div>
            {g.items.map(([href, label, Icon]) => {
              const c = counts[href]; const active = isActive(href);
              return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition", active ? "bg-white/[.08] text-white shadow-[inset_2px_0_0_#ce4620]" : "text-white/65 hover:bg-white/[.05] hover:text-white")}>
                <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand" : "text-white/45 group-hover:text-white/80")} strokeWidth={1.8} /><span className="flex-1">{label}</span>{c ? <span className="rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{c}</span> : null}</Link>;
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4"><Link href="/" className="flex items-center gap-2 text-[13px] font-semibold text-white/60 hover:text-white"><ExternalLink className="h-4 w-4" />View live site</Link>
        <div className="mt-3 flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[12px] font-bold text-white">{user.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span><div className="min-w-0"><div className="truncate text-[13px] font-semibold text-white">{user.name}</div><div className="text-[11px] uppercase tracking-[0.1em] text-white/45">{user.role}</div></div></div></div>
    </div>
  );
  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed left-3 top-3 z-40 rounded-lg bg-admin-side p-2 text-white lg:hidden" aria-label="Open admin menu"><Menu className="h-5 w-5" /></button>
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] bg-admin-side lg:block">{body}</aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-[260px] bg-admin-side"><button onClick={() => setOpen(false)} className="absolute right-3 top-4 text-white" aria-label="Close"><X className="h-5 w-5" /></button>{body}</aside></div>}
    </>
  );
}

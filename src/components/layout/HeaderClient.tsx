"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X, Heart, ChevronDown, User, LogOut, LayoutDashboard, Settings, ChevronRight } from "lucide-react";
import { Logo } from "./Logo";
import type { NavItem } from "./nav";
import { cn } from "@/lib/utils";

type U = { name: string; username: string; staff: boolean } | null;

function SearchBox({ compact, autoFocus, onDone }: { compact?: boolean; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter(); const [q, setQ] = useState("");
  return (
    <form role="search" action="/search/" onSubmit={(e) => { e.preventDefault(); router.push(`/search/?q=${encodeURIComponent(q.trim())}`); onDone?.(); }}
      className={cn("flex items-center overflow-hidden rounded-full border border-[#8a8a8a] bg-white focus-within:border-ink focus-within:ring-2 focus-within:ring-brand/25", compact ? "h-10" : "h-11")}>
      <label htmlFor={compact ? "q2" : "q1"} className="sr-only">Search recipes</label>
      <input id={compact ? "q2" : "q1"} name="q" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus} autoComplete="off"
        placeholder="Find a recipe or ingredient" className="h-full min-w-0 flex-1 bg-transparent pl-5 pr-2 text-[16px] text-ink placeholder:text-[#6b6b6b] focus:outline-none" />
      <button type="submit" aria-label="Search" className="mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark"><Search className="h-4 w-4" strokeWidth={2.5} /></button>
    </form>
  );
}

function AccountMenu({ user }: { user: NonNullable<U> }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.06em] text-ink hover:text-brand">
        <User className="h-[18px] w-[18px]" /> <span className="hidden xl:inline">{user.name.split(" ")[0]}</span> <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-lg border border-rule bg-white py-2 shadow-pop">
          <div className="border-b border-rule px-4 pb-2 pt-1 text-[14px]"><div className="font-bold text-ink">{user.name}</div><div className="text-muted">@{user.username}</div></div>
          {[["/account/my-recipes/", "My Recipes", Heart], [`/cook/${user.username}/`, "My Profile", User], ["/account/activity/", "My Activity", ChevronRight], ["/account/submit-recipe/", "Submit a Recipe", ChevronRight], ["/account/settings/", "Account Settings", Settings]].map(([href, label, Icon]) => {
            const I = Icon as typeof Heart;
            return <Link key={href as string} href={href as string} onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[15px] text-ink hover:bg-tint hover:text-brand"><I className="h-4 w-4" />{label as string}</Link>;
          })}
          {user.staff && <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2 text-[15px] font-semibold text-brand hover:bg-tint"><LayoutDashboard className="h-4 w-4" />Admin Dashboard</Link>}
          <form action="/api/auth/logout/" method="post" className="mt-1 border-t border-rule pt-1"><button className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[15px] text-ink hover:bg-tint"><LogOut className="h-4 w-4" />Log Out</button></form>
        </div>
      )}
    </div>
  );
}

export function HeaderClient({ items, user }: { items: NavItem[]; user: U }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const path = usePathname();
  useEffect(() => { setOpenIdx(null); setMobile(false); setSearchOpen(false); }, [path]);
  useEffect(() => { const f = () => setStuck(window.scrollY > 140); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => { document.body.style.overflow = mobile ? "hidden" : ""; }, [mobile]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpenIdx(null); setMobile(false); setSearchOpen(false); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const enter = (i: number) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpenIdx(i), 90); };
  const leave = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpenIdx(null), 150); };

  const navRow = (
    <ul className="flex items-stretch justify-center" onMouseLeave={leave}>
      {items.map((it, i) => (
        <li key={it.label} onMouseEnter={() => enter(i)} className="static">
          <Link href={it.href} onFocus={() => setOpenIdx(i)} aria-expanded={openIdx === i} aria-haspopup="true"
            className={cn("relative flex h-full items-center whitespace-nowrap px-3 py-3.5 text-[14px] font-bold uppercase tracking-[0.08em] text-ink xl:px-4", openIdx === i && "text-brand")}>
            {it.label}
            <span className={cn("absolute inset-x-3 bottom-0 h-[3px] bg-brand transition-transform duration-200 xl:inset-x-4", openIdx === i ? "scale-x-100" : "scale-x-0")} />
          </Link>
          {openIdx === i && (
            <div className="absolute inset-x-0 top-full z-40 border-t border-rule bg-white shadow-[0_18px_30px_-12px_rgba(0,0,0,.18)]" onMouseEnter={() => enter(i)}>
              <div className="container-site flex gap-10 py-8">
                <div className="w-56 shrink-0 border-r border-rule pr-8">
                  <div className="text-[28px] font-extrabold leading-tight text-ink">{it.label}</div>
                  <Link href={it.feature?.href || it.href} className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold uppercase tracking-[0.06em] text-brand hover:underline">{it.feature?.label || `All ${it.label}`} <ChevronRight className="h-4 w-4" /></Link>
                </div>
                <ul className="grid flex-1 grid-cols-3 gap-x-8 gap-y-3">
                  {it.children.map((c) => <li key={c.label}><Link href={c.href} className="text-[17px] font-semibold text-ink underline-offset-4 hover:text-brand hover:underline">{c.label}</Link></li>)}
                </ul>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <header className="no-print relative z-50">
      {/* main header */}
      <div className="border-b border-rule bg-white">
        <div className="container-site flex h-[72px] items-center gap-4 lg:h-[84px]">
          <button className="-ml-2 p-2 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-6 w-6 text-ink" /></button>
          <Link href="/" className="text-[30px] lg:text-[38px]"><Logo /></Link>
          <div className="ml-6 hidden max-w-[420px] flex-1 lg:block"><SearchBox /></div>
          <div className="ml-auto flex items-center gap-5">
            <button className="p-1 lg:hidden" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search className="h-6 w-6 text-ink" /></button>
            <Link href="/account/my-recipes/" className="hidden items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.06em] text-ink hover:text-brand sm:flex" aria-label="My saved recipes"><Heart className="h-[18px] w-[18px]" /><span className="hidden xl:inline">Saved</span></Link>
            {user ? <AccountMenu user={user} /> : <Link href="/account/login/" className="hidden text-[14px] font-bold uppercase tracking-[0.06em] text-ink hover:text-brand sm:block">Log In</Link>}
            <Link href="/collections/" className="hidden rounded-full border-2 border-brand px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.06em] text-brand transition hover:bg-brand hover:text-white xl:block">Collections</Link>
          </div>
        </div>
        {searchOpen && <div className="container-site pb-4 lg:hidden"><SearchBox autoFocus compact onDone={() => setSearchOpen(false)} /></div>}
        <nav aria-label="Main" className="hidden border-t border-rule lg:block">{navRow}</nav>
      </div>

      {/* sticky compact header on scroll (mirrors reference behavior) */}
      <div className={cn("fixed inset-x-0 top-0 z-50 border-b border-rule bg-white shadow-[0_2px_10px_rgba(0,0,0,.08)] transition-transform duration-300", stuck ? "translate-y-0" : "-translate-y-full")} aria-hidden={!stuck}>
        <div className="container-site flex h-[60px] items-center gap-3">
          <button className="-ml-2 p-2 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu" tabIndex={stuck ? 0 : -1}><Menu className="h-6 w-6" /></button>
          <Link href="/" className="text-[26px]" tabIndex={stuck ? 0 : -1}><Logo /></Link>
          <nav className="hidden flex-1 xl:block [&_a]:px-2.5 [&_a]:py-[18px] [&_a]:text-[13px]">{stuck && navRow}</nav>
          <div className="ml-auto w-[240px] max-w-[50vw] xl:ml-0 xl:w-[220px]"><SearchBox compact /></div>
        </div>
      </div>

      {/* mobile drawer */}
      <div className={cn("fixed inset-0 z-[60] lg:hidden", mobile ? "visible" : "invisible")} aria-hidden={!mobile}>
        <div className={cn("absolute inset-0 bg-black/50 transition-opacity", mobile ? "opacity-100" : "opacity-0")} onClick={() => setMobile(false)} />
        <div role="dialog" aria-modal="true" aria-label="Menu" className={cn("absolute inset-y-0 left-0 flex w-[88%] max-w-[380px] flex-col bg-white transition-transform duration-300", mobile ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-16 items-center justify-between border-b border-rule px-4">
            <Link href="/" className="text-[28px]"><Logo /></Link>
            <button onClick={() => setMobile(false)} aria-label="Close menu" className="p-2"><X className="h-6 w-6" /></button>
          </div>
          <div className="p-4"><SearchBox compact onDone={() => setMobile(false)} /></div>
          <ul className="flex-1 overflow-y-auto px-4">
            {items.map((it, i) => (
              <li key={it.label} className="border-b border-rule">
                <button onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i} className="flex w-full items-center justify-between py-4 text-left text-[16px] font-bold uppercase tracking-[0.06em] text-ink">
                  {it.label}<ChevronDown className={cn("h-5 w-5 text-brand transition", expanded === i && "rotate-180")} />
                </button>
                {expanded === i && (
                  <ul className="pb-3 pl-2">
                    <li><Link href={it.href} className="block py-2 text-[16px] font-bold text-brand">All {it.label}</Link></li>
                    {it.children.map((c) => <li key={c.label}><Link href={c.href} className="block py-2 text-[16px] text-ink">{c.label}</Link></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="border-t border-rule p-4">
            {user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account/my-recipes/" className="btn-ghost px-3 text-[13px]">My Recipes</Link>
                <Link href="/account/settings/" className="btn-ghost px-3 text-[13px]">Settings</Link>
                {user.staff && <Link href="/admin" className="btn-ghost col-span-2 text-[13px]">Admin Dashboard</Link>}
                <form action="/api/auth/logout/" method="post" className="col-span-2"><button className="btn-outline w-full text-[13px]">Log Out</button></form>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2"><Link href="/account/login/" className="btn-outline text-[13px]">Log In</Link><Link href="/account/register/" className="btn-primary text-[13px]">Sign Up</Link></div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

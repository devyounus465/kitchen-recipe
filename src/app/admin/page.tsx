import Link from "next/link";
import { sql } from "drizzle-orm";
import { ArrowUpRight, UtensilsCrossed, Users, MessageSquareText, Star, Heart, ShieldAlert } from "lucide-react";
import { db } from "@/db";
import { getUser } from "@/lib/auth";
import { PageHeader, Card, Badge, abtnBrand, abtnGhost } from "@/components/admin/ui";
import { DailyBars } from "@/components/admin/Charts";
import { Img } from "@/components/ui/Img";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const u = await getUser();
  const [k] = await db.execute<Record<string, number>>(sql`SELECT
    (SELECT count(*)::int FROM recipes WHERE status='published') recipes,
    (SELECT count(*)::int FROM recipes WHERE status='published' AND published_at > now() - interval '30 days') recipes30,
    (SELECT count(*)::int FROM users) users, (SELECT count(*)::int FROM users WHERE created_at > now() - interval '30 days') users30,
    (SELECT count(*)::int FROM reviews WHERE status='approved') reviews, (SELECT count(*)::int FROM reviews WHERE created_at > now() - interval '30 days') reviews30,
    (SELECT COALESCE(round(avg(rating)::numeric,2),0)::float FROM reviews WHERE status='approved') avg,
    (SELECT count(*)::int FROM saved_recipes) saves, (SELECT count(*)::int FROM saved_recipes WHERE created_at > now() - interval '30 days') saves30,
    (SELECT count(*)::int FROM recipes WHERE status='pending') pr, (SELECT count(*)::int FROM reviews WHERE status='pending') prv, (SELECT count(*)::int FROM recipe_photos WHERE status='pending') pp,
    (SELECT count(*)::int FROM newsletter_subscribers) subs`);
  const daily = [...await db.execute<{ day: string; n: number }>(sql`SELECT to_char(d, 'YYYY-MM-DD') AS day, (SELECT count(*)::int FROM reviews r WHERE r.created_at::date = d::date) n FROM generate_series(current_date - 29, current_date, interval '1 day') d ORDER BY d`)];
  const topCats = [...await db.execute<{ name: string; n: number }>(sql`SELECT c.name, count(*)::int n FROM recipe_categories rc JOIN categories c ON c.id=rc.category_id JOIN recipes r ON r.id=rc.recipe_id WHERE r.status='published' AND c.parent_id IS NOT NULL GROUP BY c.name ORDER BY n DESC LIMIT 7`)];
  const topRecipes = [...await db.execute<{ id: number; title: string; image_url: string; view_count: number; rating_avg: number; save_count: number }>(sql`SELECT id, title, image_url, view_count, rating_avg, save_count FROM recipes WHERE status='published' ORDER BY view_count DESC LIMIT 6`)];
  const recent = [...await db.execute<{ id: number; rating: number; body: string; status: string; created_at: Date; name: string; title: string }>(sql`SELECT rv.id, rv.rating, rv.body, rv.status, rv.created_at, u.name, r.title FROM reviews rv JOIN users u ON u.id=rv.user_id JOIN recipes r ON r.id=rv.recipe_id ORDER BY rv.created_at DESC LIMIT 6`)];
  const pending = k.pr + k.prv + k.pp; const catMax = Math.max(1, ...topCats.map((c) => c.n));
  const kpis = [
    { l: "Published recipes", v: k.recipes, d: `+${k.recipes30} in 30 days`, I: UtensilsCrossed, h: "/admin/recipes" },
    { l: "Registered users", v: k.users, d: `+${k.users30} in 30 days`, I: Users, h: "/admin/users" },
    { l: "Ratings & reviews", v: k.reviews, d: `+${k.reviews30} in 30 days`, I: MessageSquareText, h: "/admin/reviews" },
    { l: "Average rating", v: k.avg.toFixed(2), d: "across approved reviews", I: Star, h: "/admin/reviews" },
    { l: "Recipe saves", v: k.saves, d: `+${k.saves30} in 30 days`, I: Heart, h: "/admin/recipes?sort=saves" },
    { l: "Awaiting moderation", v: pending, d: `${k.pr} recipes · ${k.prv} reviews · ${k.pp} photos`, I: ShieldAlert, h: "/admin/moderation", alert: pending > 0 },
  ];
  return (
    <>
      <PageHeader title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${u?.name.split(" ")[0]}`} sub="Here's what's happening across Simmerly today."
        actions={<><Link href="/admin/recipes/new" className={abtnBrand}>+ New recipe</Link><Link href="/admin/articles/new" className={abtnGhost}>New article</Link></>} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ l, v, d, I, h, alert }) => (
          <Link key={l} href={h} className={`group rounded-xl border bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition hover:-translate-y-0.5 hover:shadow-md ${alert ? "border-brand/40" : "border-admin-line"}`}>
            <div className="flex items-center justify-between"><span className={`flex h-8 w-8 items-center justify-center rounded-lg ${alert ? "bg-brand text-white" : "bg-[#f3f4f7] text-[#3b4252]"}`}><I className="h-4 w-4" /></span><ArrowUpRight className="h-4 w-4 text-[#c3c7d0] transition group-hover:text-[#0f1115]" /></div>
            <div className="mt-3 text-[28px] font-bold tabular-nums leading-none tracking-[-0.02em] text-[#0f1115]">{typeof v === "number" ? v.toLocaleString() : v}</div>
            <div className="mt-1 text-[13px] font-medium text-[#3b4252]">{l}</div><div className="mt-0.5 text-[12px] text-[#8a91a0]">{d}</div>
          </Link>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Reviews per day · last 30 days" action={<span className="text-[12px] text-[#8a91a0]">{k.reviews30} total</span>}><DailyBars data={daily} label="reviews" /></Card>
        <Card title="Recipes by category" action={<Link href="/admin/categories" className="text-[12px] font-semibold text-brand">Manage</Link>}>
          <ul className="space-y-3">{topCats.map((c) => (
            <li key={c.name} className="text-[13px]" title={`${c.name}: ${c.n} recipes`}><div className="mb-1 flex justify-between"><span className="font-medium text-[#1d2433]">{c.name}</span><span className="tabular-nums text-[#6b7385]">{c.n}</span></div>
              <div className="h-2 rounded-full bg-[#f1f2f5]"><div className="h-full rounded-r-[4px] rounded-l-full bg-brand" style={{ width: `${(c.n / catMax) * 100}%` }} /></div></li>
          ))}</ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Most viewed recipes" pad={false} action={<Link href="/admin/recipes" className="text-[12px] font-semibold text-brand">All recipes</Link>}>
          <ul className="divide-y divide-admin-line">{topRecipes.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3"><span className="w-4 text-[12px] font-semibold tabular-nums text-[#9aa1b0]">{i + 1}</span><Img src={r.image_url} alt="" w={120} className="h-10 w-12 rounded-md" />
              <Link href={`/admin/recipes/${r.id}`} className="min-w-0 flex-1 truncate text-[14px] font-medium text-[#0f1115] hover:text-brand">{r.title}</Link>
              <span className="text-[12px] tabular-nums text-[#6b7385]">{r.view_count.toLocaleString()} views</span><span className="hidden text-[12px] tabular-nums text-[#6b7385] sm:inline">★ {r.rating_avg.toFixed(1)}</span></li>
          ))}</ul>
        </Card>
        <Card title="Latest reviews" pad={false} action={<Link href="/admin/reviews" className="text-[12px] font-semibold text-brand">Manage reviews</Link>}>
          <ul className="divide-y divide-admin-line">{recent.map((r) => (
            <li key={r.id} className="px-5 py-3"><div className="flex items-center justify-between gap-2 text-[13px]"><span><b className="text-[#0f1115]">{r.name}</b> <span className="text-[#6b7385]">on</span> <span className="font-medium">{r.title}</span></span><Badge s={r.status} /></div>
              <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[#8a91a0]"><span className="text-brand">{"★".repeat(r.rating)}<span className="text-[#d6d9e0]">{"★".repeat(5 - r.rating)}</span></span>{formatDate(r.created_at)}</div>
              {r.body && <p className="mt-1 line-clamp-1 text-[13px] text-[#3b4252]">{r.body}</p>}</li>
          ))}</ul>
        </Card>
      </div>
      <p className="mt-6 text-[12px] text-[#8a91a0]">{k.subs} newsletter subscribers · Data refreshes on every page load.</p>
    </>
  );
}

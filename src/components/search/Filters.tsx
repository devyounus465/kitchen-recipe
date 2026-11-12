"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { DIETS, TIME_FILTERS } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Filters({ categories, mode }: { categories: { slug: string; name: string }[]; mode: "mobile" | "desktop" }) {
  const sp = useSearchParams(); const router = useRouter(); const [open, setOpen] = useState(false);
  const [ing, setIng] = useState(sp.get("ingredient") || ""); const [ex, setEx] = useState(sp.get("exclude") || "");
  const diets = sp.getAll("diet");
  function update(mut: (q: URLSearchParams) => void) { const q = new URLSearchParams(sp.toString()); q.delete("page"); mut(q); router.push(`/search/?${q}`); }
  const active = ["ingredient", "exclude", "maxTime", "diet", "category"].some((k) => sp.get(k));
  const body = (
    <div className="space-y-7">
      <form onSubmit={(e) => { e.preventDefault(); update((q) => { ing ? q.set("ingredient", ing) : q.delete("ingredient"); ex ? q.set("exclude", ex) : q.delete("exclude"); }); setOpen(false); }}>
        <fieldset><legend className="mb-2 text-[15px] font-bold uppercase tracking-[0.06em] text-ink">Ingredients</legend>
          <label className="text-[14px] text-muted" htmlFor="f-ing">Include (comma separated)</label>
          <input id="f-ing" className="input mt-1" value={ing} onChange={(e) => setIng(e.target.value)} placeholder="e.g. chicken, garlic" />
          <label className="mt-3 block text-[14px] text-muted" htmlFor="f-ex">Exclude</label>
          <input id="f-ex" className="input mt-1" value={ex} onChange={(e) => setEx(e.target.value)} placeholder="e.g. mushrooms" />
          <button className="btn-primary mt-3 h-10 w-full text-[13px]">Apply</button>
        </fieldset>
      </form>
      <fieldset><legend className="mb-2 text-[15px] font-bold uppercase tracking-[0.06em] text-ink">Total Time</legend>
        {TIME_FILTERS.map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[16px]"><input type="radio" name="time" className="h-4 w-4 accent-brand" checked={sp.get("maxTime") === String(v)} onChange={() => update((q) => q.set("maxTime", String(v)))} />{l}</label>
        ))}
        {sp.get("maxTime") && <button onClick={() => update((q) => q.delete("maxTime"))} className="mt-1 text-[14px] font-semibold text-brand underline">Any time</button>}
      </fieldset>
      <fieldset><legend className="mb-2 text-[15px] font-bold uppercase tracking-[0.06em] text-ink">Dietary</legend>
        {DIETS.map(([v, l]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[16px]"><input type="checkbox" className="h-4 w-4 accent-brand" checked={diets.includes(v)} onChange={() => update((q) => { const cur = q.getAll("diet"); q.delete("diet"); (cur.includes(v) ? cur.filter((d) => d !== v) : [...cur, v]).forEach((d) => q.append("diet", d)); })} />{l}</label>
        ))}
      </fieldset>
      <fieldset><legend className="mb-2 text-[15px] font-bold uppercase tracking-[0.06em] text-ink">Category</legend>
        <select className="input" value={sp.get("category") || ""} onChange={(e) => update((q) => (e.target.value ? q.set("category", e.target.value) : q.delete("category")))}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </fieldset>
      {active && <button onClick={() => { setIng(""); setEx(""); router.push(`/search/?${sp.get("q") ? `q=${encodeURIComponent(sp.get("q")!)}` : ""}`); }} className="btn-outline h-10 w-full text-[13px]">Clear all filters</button>}
    </div>
  );
  if (mode === "desktop") return <aside>{body}</aside>;
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline h-10 text-[13px] lg:hidden"><SlidersHorizontal className="h-4 w-4" />Filters{active && <span className="ml-1 h-2 w-2 rounded-full bg-brand" />}</button>
      <div className={cn("fixed inset-0 z-[70] lg:hidden", open ? "" : "hidden")}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5"><div className="mb-5 flex items-center justify-between"><span className="text-[22px] font-extrabold">Filters</span><button onClick={() => setOpen(false)} aria-label="Close filters"><X className="h-6 w-6" /></button></div>{body}</div>
      </div>
    </>
  );
}
export function SortSelect({ value }: { value: string }) {
  const sp = useSearchParams(); const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[15px]"><span className="hidden sm:inline">Sort by</span>
      <select value={value} onChange={(e) => { const q = new URLSearchParams(sp.toString()); q.set("sort", e.target.value); q.delete("page"); router.push(`/search/?${q}`); }} className="input h-10 w-auto py-1">
        <option value="relevance">Relevance</option><option value="rating">Top rated</option><option value="newest">Newest</option><option value="popular">Most popular</option>
      </select>
    </label>
  );
}

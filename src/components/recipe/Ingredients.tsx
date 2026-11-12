"use client";
import { useState } from "react";
import type { Ingredient } from "@/db/schema";
import { formatQty, cn } from "@/lib/utils";

export function Ingredients({ items, servings, yieldText }: { items: Ingredient[]; servings: number; yieldText?: string | null }) {
  const [mult, setMult] = useState(1);
  const [custom, setCustom] = useState(String(servings));
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const setServ = (v: string) => { setCustom(v); const n = Number(v); if (n > 0 && n < 1000) setMult(n / servings); };
  return (
    <section id="ingredients" className="mt-10">
      <h2 className="text-[28px] font-extrabold">Ingredients</h2>
      <div className="no-print mt-4 rounded-lg border border-rule bg-tint/60 p-4">
        <div className="text-[15px] font-semibold text-ink">Original recipe (1X) yields {servings} servings</div>
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Scale recipe">
          {[0.5, 1, 2].map((m) => (
            <button key={m} onClick={() => { setMult(m); setCustom(String(Math.round(servings * m))); }} aria-pressed={mult === m}
              className={cn("h-10 min-w-[64px] rounded-md border-2 px-3 text-[15px] font-bold transition", mult === m ? "border-brand bg-brand text-white" : "border-[#b3b3b3] bg-white text-ink hover:border-ink")}>
              {m === 0.5 ? "½x" : `${m}x`}
            </button>
          ))}
          <label className="ml-2 flex items-center gap-2 text-[15px] text-ink">Servings
            <input type="number" min={1} max={999} value={custom} onChange={(e) => setServ(e.target.value)} className="input h-10 w-20 py-1" aria-label="Custom servings" />
          </label>
        </div>
        {mult !== 1 && <p className="mt-2 text-[14px] text-muted">Recipe scaled to {Math.round(servings * mult * 10) / 10} servings. Cooking times may vary.</p>}
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((it, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="no-print mt-1.5 h-5 w-5 shrink-0 accent-brand" checked={checked.has(i)} onChange={() => { const s = new Set(checked); s.has(i) ? s.delete(i) : s.add(i); setChecked(s); }} />
              <span className={cn("text-[18px] leading-snug", checked.has(i) && "text-muted line-through")}>
                {it.qty != null && <span className="font-bold">{formatQty(it.qty * mult)} </span>}
                {it.unit && <span className="font-bold">{it.unit} </span>}
                {it.item}{it.note && <span className="text-muted">, {it.note}</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {yieldText && <p className="mt-4 text-[15px] text-muted">Yield: {yieldText}</p>}
    </section>
  );
}

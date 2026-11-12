"use client";
import { useState } from "react";
import type { Nutrition as N } from "@/db/schema";
import { ChevronDown } from "lucide-react";
export function Nutrition({ n, servings }: { n: N; servings: number }) {
  const [open, setOpen] = useState(false);
  const rows: [string, number | undefined, string, number?][] = [
    ["Total Fat", n.fat, "g", 78], ["Saturated Fat", n.saturatedFat, "g", 20], ["Cholesterol", n.cholesterol, "mg", 300], ["Sodium", n.sodium, "mg", 2300],
    ["Total Carbohydrate", n.carbs, "g", 275], ["Dietary Fiber", n.fiber, "g", 28], ["Total Sugars", n.sugar, "g"], ["Protein", n.protein, "g", 50],
  ];
  return (
    <section id="nutrition" className="mt-12">
      <h2 className="text-[28px] font-extrabold">Nutrition Facts <span className="text-[16px] font-normal text-muted">(per serving)</span></h2>
      <table className="mt-4 w-full max-w-lg text-center">
        <tbody><tr className="border-y border-rule">
          {[["Calories", n.calories, ""], ["Fat", n.fat, "g"], ["Carbs", n.carbs, "g"], ["Protein", n.protein, "g"]].map(([l, v, u]) => (
            <td key={l as string} className="py-3"><div className="text-[24px] font-extrabold text-ink">{v ?? "–"}{u}</div><div className="text-[14px] text-muted">{l}</div></td>
          ))}
        </tr></tbody>
      </table>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="no-print mt-4 flex items-center gap-1 text-[15px] font-bold uppercase tracking-[0.06em] text-ink hover:text-brand">
        {open ? "Hide" : "Show"} Full Nutrition Label <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-4 max-w-sm border-2 border-ink p-3">
          <div className="border-b-8 border-ink pb-1 text-[32px] font-black leading-none text-ink">Nutrition Facts</div>
          <div className="border-b border-ink py-1 text-[15px]">Servings Per Recipe {servings}</div>
          <div className="flex items-end justify-between border-b-4 border-ink py-1"><span className="text-[22px] font-black text-ink">Calories</span><span className="text-[32px] font-black text-ink">{n.calories}</span></div>
          <div className="border-b border-ink py-0.5 text-right text-[13px] font-bold">% Daily Value *</div>
          {rows.map(([l, v, u, dv]) => v != null && (
            <div key={l} className="flex justify-between border-b border-[#999] py-1 text-[15px]"><span><b className={l.startsWith("Total") || ["Cholesterol", "Sodium", "Protein"].includes(l) ? "" : "pl-4 font-normal"}>{l}</b> {v}{u}</span>{dv && <b>{Math.round((v / dv) * 100)}%</b>}</div>
          ))}
          <p className="pt-2 text-[12px] leading-snug text-muted">* Percent Daily Values are based on a 2,000 calorie diet. Nutrient information is estimated and may vary.</p>
        </div>
      )}
    </section>
  );
}

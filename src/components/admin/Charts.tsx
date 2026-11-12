"use client";
import { useState } from "react";
/** Single-series daily bar chart. Thin bars, 4px rounded data-end, 2px gaps, recessive grid, hover tooltip + table fallback. */
export function DailyBars({ data, label }: { data: { day: string; n: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.n)); const nice = Math.ceil(max / 4) * 4 || 4;
  const ticks = [0, nice / 2, nice];
  const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <figure>
      <div className="relative h-[200px] pl-8">
        {ticks.map((t) => <div key={t} className="absolute left-8 right-0 border-t border-dashed border-[#eceef2]" style={{ bottom: `${(t / nice) * 100}%` }}><span className="absolute -left-8 -top-2 w-6 text-right text-[11px] tabular-nums text-[#9aa1b0]">{t}</span></div>)}
        <div className="absolute inset-0 left-8 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
          {data.map((d, i) => (
            <div key={d.day} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
              <div className="w-full rounded-t-[4px] transition-colors" style={{ height: `${(d.n / nice) * 100}%`, minHeight: d.n ? 2 : 0, background: hover === i ? "#a83a1a" : "#ce4620" }} />
              {hover === i && <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#0f1115] px-2.5 py-1.5 text-[12px] text-white shadow-lg"><div className="text-white/60">{fmt(d.day)}</div><div className="font-semibold tabular-nums">{d.n} {label}</div></div>}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between pl-8 text-[11px] text-[#9aa1b0]"><span>{fmt(data[0].day)}</span><span>{fmt(data[Math.floor(data.length / 2)].day)}</span><span>{fmt(data[data.length - 1].day)}</span></div>
      <details className="mt-3 text-[12px] text-[#6b7385]"><summary className="cursor-pointer select-none">View as table</summary>
        <table className="mt-2 w-full max-w-xs"><tbody>{data.filter((d) => d.n).map((d) => <tr key={d.day}><td>{fmt(d.day)}</td><td className="text-right tabular-nums">{d.n}</td></tr>)}</tbody></table></details>
    </figure>
  );
}

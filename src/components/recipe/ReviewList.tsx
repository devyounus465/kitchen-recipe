"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ThumbsUp } from "lucide-react";
import Link from "next/link";
import { toggleHelpful } from "@/lib/actions/community";
import { Stars } from "@/components/ui/Stars";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate, cn } from "@/lib/utils";

type Rv = { id: number; rating: number; body: string; helpfulCount: number; createdAt: Date; userName: string; username: string; votedHelpful: boolean };

function Helpful({ r }: { r: Rv }) {
  const [count, setCount] = useState(r.helpfulCount); const [voted, setVoted] = useState(r.votedHelpful); const [p, start] = useTransition();
  const router = useRouter(); const path = usePathname();
  return (
    <button disabled={p} onClick={() => start(async () => { const res = await toggleHelpful(r.id); if (res.needLogin) router.push(`/account/login?next=${encodeURIComponent(path)}`); else if (res.ok) { setCount(res.count!); setVoted(!!res.voted); } })}
      aria-pressed={voted} className={cn("mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[14px] font-semibold transition", voted ? "border-brand bg-brand-light text-brand" : "border-rule text-muted hover:border-ink hover:text-ink")}>
      <ThumbsUp className={cn("h-4 w-4", voted && "fill-brand")} /> Helpful ({count})
    </button>
  );
}

export function ReviewList({ reviews, sort }: { reviews: Rv[]; sort: string }) {
  const router = useRouter(); const sp = useSearchParams(); const path = usePathname();
  const [limit, setLimit] = useState(6);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
        <span className="text-[17px] font-bold text-ink">{reviews.length} Review{reviews.length === 1 ? "" : "s"}</span>
        <label className="flex items-center gap-2 text-[15px]">Sort by
          <select value={sort} onChange={(e) => { const q = new URLSearchParams(sp.toString()); q.set("sort", e.target.value); router.replace(`${path}?${q}#reviews`, { scroll: false }); }} className="input h-10 w-auto py-1">
            <option value="helpful">Most helpful</option><option value="newest">Newest</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option>
          </select>
        </label>
      </div>
      {!reviews.length && <p className="py-8 text-muted">No reviews yet. Be the first to share your thoughts!</p>}
      <ul>
        {reviews.slice(0, limit).map((r) => (
          <li key={r.id} className="border-b border-rule py-6">
            <div className="flex items-center gap-3">
              <Avatar name={r.userName} size={40} />
              <div><Link href={`/cook/${r.username}/`} className="font-bold text-ink hover:text-brand hover:underline">{r.userName}</Link>
                <div className="flex items-center gap-2 text-[14px] text-muted"><Stars value={r.rating} size={14} />{formatDate(r.createdAt)}</div></div>
            </div>
            {r.body && <p className="mt-3 text-[17px] leading-relaxed">{r.body}</p>}
            <Helpful r={r} />
          </li>
        ))}
      </ul>
      {limit < reviews.length && <button onClick={() => setLimit(limit + 10)} className="btn-outline mt-6">Load more reviews</button>}
    </div>
  );
}

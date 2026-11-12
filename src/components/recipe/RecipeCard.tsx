import Link from "next/link";
import { Img } from "@/components/ui/Img";
import { Stars } from "@/components/ui/Stars";
import { SaveButton } from "./SaveButton";
import { compact, recipeUrl, cn } from "@/lib/utils";
import type { Card } from "@/lib/queries";

export function RecipeCard({ r, saved = false, loggedIn = false, size = "md", showTag = true }: { r: Card; saved?: boolean; loggedIn?: boolean; size?: "md" | "lg" | "sm"; showTag?: boolean }) {
  return (
    <article className="group relative flex flex-col">
      <Link href={recipeUrl(r)} className="flex flex-col focus:outline-none">
        <div className={cn("relative overflow-hidden bg-tint", size === "lg" ? "aspect-[4/3]" : "aspect-[4/3]")}>
          <Img src={r.imageUrl} alt={r.title} w={size === "lg" ? 1000 : 600} className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]" />
        </div>
        <div className="pt-3">
          {showTag && r.tag && <div className="eyebrow mb-1 text-[12px]">{r.tag}</div>}
          <h3 className={cn("font-extrabold leading-snug text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline", size === "lg" ? "text-[24px]" : size === "sm" ? "text-[16px]" : "text-[18px]")}>{r.title}</h3>
          {r.ratingCount > 0 && (
            <div className="mt-1.5 flex items-center gap-2 text-[14px] text-muted">
              <Stars value={r.ratingAvg} size={14} />
              <span>{compact(r.ratingCount)} Ratings</span>
            </div>
          )}
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5"><SaveButton recipeId={r.id} initial={saved} loggedIn={loggedIn} /></div>
    </article>
  );
}

export function CardGrid({ cards, saved, loggedIn, cols = 4 }: { cards: Card[]; saved?: Set<number>; loggedIn?: boolean; cols?: 3 | 4 }) {
  if (!cards.length) return <EmptyState title="No recipes found" body="Try a different search or browse our categories." />;
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6", cols === 4 ? "lg:grid-cols-4 md:grid-cols-3" : "md:grid-cols-3")}>
      {cards.map((r) => <RecipeCard key={r.id} r={r} saved={saved?.has(r.id)} loggedIn={loggedIn} />)}
    </div>
  );
}
export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-rule bg-tint/60 px-6 py-14 text-center">
      <p className="text-[22px] font-extrabold text-ink">{title}</p>
      {body && <p className="mt-2 text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

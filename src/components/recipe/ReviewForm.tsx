"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReview } from "@/lib/actions/community";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus } from "@/components/ui/FormStatus";
import { cn } from "@/lib/utils";

const LABELS = ["", "Couldn't eat it", "Didn't like it", "It was OK", "Liked it", "Loved it!"];
export function ReviewForm({ recipeId, loggedIn, existing, path }: { recipeId: number; loggedIn: boolean; existing?: { rating: number; body: string } | null; path: string }) {
  const [state, action] = useActionState(submitReview, null);
  const [rating, setRating] = useState(existing?.rating ?? 0); const [hover, setHover] = useState(0);
  if (!loggedIn) return (
    <div className="rounded-lg border border-rule bg-tint/60 p-5"><p className="text-[17px] font-bold text-ink">Made this recipe? Tell us what you think.</p>
      <Link href={`/account/login?next=${encodeURIComponent(path + "#reviews")}`} className="btn-primary mt-3">Log in to rate & review</Link></div>
  );
  if (state?.ok) return <FormStatus state={state} />;
  const shown = hover || rating;
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="rounded-lg border border-rule p-5" id="review-form">
      <input type="hidden" name="recipeId" value={recipeId} /><input type="hidden" name="rating" value={rating} />
      <p className="label">{existing ? "Update your rating" : "Your rating"} <span className="text-red-700">*</span></p>
      <div className="flex items-center gap-3" onMouseLeave={() => setHover(0)}>
        <div className="flex" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((i) => (
            <button type="button" key={i} role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? "s" : ""}`} onMouseEnter={() => setHover(i)} onClick={() => setRating(i)} className="p-0.5">
              <svg width="32" height="32" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill={i <= shown ? "#ce4620" : "#fff"} stroke="#ce4620" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            </button>
          ))}
        </div>
        <span className="text-[15px] font-semibold text-muted">{LABELS[shown]}</span>
      </div>
      <label htmlFor="rv-body" className="label mt-4">Your review <span className="font-normal text-muted">(optional)</span></label>
      <textarea id="rv-body" name="body" rows={4} maxLength={3000} defaultValue={existing?.body} placeholder="What did you think about this recipe? Did you make any changes or notes?" className="input" />
      <div className="mt-3"><FormStatus state={state} /></div>
      <SubmitButton className={cn("mt-3", !rating && "opacity-60")} pendingText="Submitting…">{existing ? "Update Review" : "Submit"}</SubmitButton>
    </form>
  );
}

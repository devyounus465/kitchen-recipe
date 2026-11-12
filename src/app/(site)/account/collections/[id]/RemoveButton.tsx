"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleInCollection } from "@/lib/actions/account";
export function RemoveFromCollection({ collectionId, recipeId }: { collectionId: number; recipeId: number }) {
  const [p, start] = useTransition(); const router = useRouter();
  return <button disabled={p} onClick={() => start(async () => { await toggleInCollection(collectionId, recipeId, false); router.refresh(); })} className="mt-2 text-[14px] font-semibold text-muted underline hover:text-red-700">{p ? "Removing…" : "Remove"}</button>;
}

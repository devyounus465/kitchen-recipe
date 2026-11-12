"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Camera, X } from "lucide-react";
import { uploadRecipePhoto } from "@/lib/actions/community";
import { Img } from "@/components/ui/Img";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus } from "@/components/ui/FormStatus";

type P = { id: number; url: string; caption: string | null; userName: string };
export function PhotoStrip({ title, photos, recipeId, loggedIn, path }: { title: string; photos: P[]; recipeId: number; loggedIn: boolean; path: string }) {
  const [open, setOpen] = useState(false); const [lightbox, setLightbox] = useState<P | null>(null);
  const [state, action] = useActionState(uploadRecipePhoto, null);
  return (
    <section id="photos" className="mt-12">
      <div className="flex items-center justify-between"><h2 className="text-[28px] font-extrabold">Photos of {title}</h2>
        {loggedIn ? <button onClick={() => setOpen(!open)} className="btn-ghost h-10 px-4 text-[13px]"><Camera className="h-4 w-4" />Add Photo</button>
          : <Link href={`/account/login?next=${encodeURIComponent(path + "#photos")}`} className="btn-ghost h-10 px-4 text-[13px]"><Camera className="h-4 w-4" />Add Photo</Link>}
      </div>
      {open && (state?.ok ? <div className="mt-4"><FormStatus state={state} /></div> : (
        <form action={action} onReset={(e) => e.preventDefault()} className="mt-4 grid gap-3 rounded-lg border border-rule p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="recipeId" value={recipeId} />
          <div><label className="label" htmlFor="ph">Photo (JPG, PNG, WebP · max 4MB)</label><input id="ph" name="photo" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => { const f = e.target.files?.[0]; if (f && f.size > 4 * 1024 * 1024) { alert("This photo is larger than 4MB. Please choose a smaller image."); e.target.value = ""; } }} className="block w-full text-[15px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-bold file:text-white" /></div>
          <div><label className="label" htmlFor="cap">Caption</label><input id="cap" name="caption" maxLength={300} className="input" placeholder="Optional" /></div>
          <SubmitButton pendingText="Uploading…">Upload</SubmitButton>
          <div className="sm:col-span-3"><FormStatus state={state} /></div>
        </form>
      ))}
      {photos.length ? (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {photos.map((p) => <button key={p.id} onClick={() => setLightbox(p)} className="aspect-square w-36 shrink-0 overflow-hidden rounded md:w-44"><Img src={p.url} alt={p.caption || `Photo by ${p.userName}`} w={400} className="h-full w-full hover:scale-105" /></button>)}
        </div>
      ) : <p className="mt-3 text-muted">No community photos yet — made it? Share yours!</p>}
      {lightbox && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)} role="dialog" aria-modal="true">
          <button className="absolute right-4 top-4 text-white" aria-label="Close"><X className="h-8 w-8" /></button>
          <figure className="max-w-3xl" onClick={(e) => e.stopPropagation()}><Img src={lightbox.url} alt={lightbox.caption || ""} w={1400} className="max-h-[80vh] w-full object-contain" />
            <figcaption className="mt-2 text-white">{lightbox.caption} <span className="text-white/70">— {lightbox.userName}</span></figcaption></figure>
        </div>
      )}
    </section>
  );
}

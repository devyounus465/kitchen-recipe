"use client";
import { useActionState, useState } from "react";
import { saveRecipe } from "@/lib/actions/account";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus, FieldError } from "@/components/ui/FormStatus";
import { DIETS } from "@/lib/site";
import { Img } from "@/components/ui/Img";

export type RecipeFormData = {
  id?: number; title?: string; description?: string; imageUrl?: string | null; prepMin?: number | null; cookMin?: number | null; additionalMin?: number | null; servings?: number; yieldText?: string | null;
  ingredientsText?: string; stepsText?: string; notes?: string | null; cuisine?: string | null; diets?: string[]; categoryIds?: number[]; status?: string;
  slug?: string; seoTitle?: string | null; seoDescription?: string | null; authorId?: number | null; nutrition?: Record<string, number | undefined> | null;
};
type Cat = { id: number; name: string; parent: string };
export function RecipeForm({ r = {}, cats, admin, authors }: { r?: RecipeFormData; cats: Cat[]; admin?: boolean; authors?: { id: number; name: string }[] }) {
  const [state, action] = useActionState(saveRecipe, null);
  const [preview, setPreview] = useState<string | null>(r.imageUrl ?? null);
  const groups = [...new Set(cats.map((c) => c.parent))];
  const sect = "rounded-xl border border-rule bg-white p-5 sm:p-6";
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-6" encType="multipart/form-data" noValidate>
      {r.id && <input type="hidden" name="id" value={r.id} />}{admin && <input type="hidden" name="from" value="admin" />}<input type="hidden" name="categoriesTouched" value="1" />
      <FormStatus state={state} />
      <section className={sect}><h2 className="mb-4 text-[20px] font-extrabold">Basics</h2>
        <div className="space-y-4">
          <div><label className="label" htmlFor="rf-title">Recipe title *</label><input id="rf-title" name="title" defaultValue={r.title} className="input" /><FieldError state={state} name="title" /></div>
          <div><label className="label" htmlFor="rf-desc">Description *</label><textarea id="rf-desc" name="description" rows={3} defaultValue={r.description} className="input" placeholder="What makes this recipe special?" /><FieldError state={state} name="description" /></div>
          <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
            <Img src={preview} alt="Recipe photo preview" w={400} className="aspect-[4/3] w-full rounded-lg" />
            <div><label className="label" htmlFor="rf-img">Photo</label><input id="rf-img" name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} className="block text-[15px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-bold file:text-white" />
              <p className="mt-1 text-[13px] text-muted">JPG, PNG or WebP, up to 8MB. Landscape photos work best.</p><FieldError state={state} name="image" />
              {admin && <><label className="label mt-3" htmlFor="rf-imgurl">…or image URL</label><input id="rf-imgurl" name="imageUrlText" defaultValue={r.imageUrl || ""} className="input" placeholder="https://… or /media/…" /></>}</div>
          </div>
        </div>
      </section>
      <section className={sect}><h2 className="mb-4 text-[20px] font-extrabold">Times & Servings</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {([["prepMin", "Prep (min)", r.prepMin], ["cookMin", "Cook (min)", r.cookMin], ["additionalMin", "Additional (min)", r.additionalMin], ["servings", "Servings *", r.servings ?? 4]] as [string, string, number | null | undefined][]).map(([n, l, v]) => <div key={n}><label className="label" htmlFor={`rf-${n}`}>{l}</label><input id={`rf-${n}`} name={n} type="number" min={0} defaultValue={v ?? 0} className="input" /><FieldError state={state} name={n} /></div>)}
          <div className="col-span-2 sm:col-span-1"><label className="label" htmlFor="rf-yield">Yield</label><input id="rf-yield" name="yieldText" defaultValue={r.yieldText || ""} placeholder="e.g. 24 cookies" className="input" /></div>
        </div>
      </section>
      <section className={sect}><h2 className="mb-1 text-[20px] font-extrabold">Ingredients *</h2><p className="mb-3 text-[14px] text-muted">One per line, e.g. <code className="rounded bg-tint px-1">1 1/2 cups all-purpose flour, sifted</code>. Quantities are scaled automatically.</p>
        <textarea name="ingredients" rows={10} defaultValue={r.ingredientsText} className="input font-mono text-[15px]" /><FieldError state={state} name="ingredients" /></section>
      <section className={sect}><h2 className="mb-1 text-[20px] font-extrabold">Directions *</h2><p className="mb-3 text-[14px] text-muted">One step per line.</p>
        <textarea name="steps" rows={10} defaultValue={r.stepsText} className="input" /><FieldError state={state} name="steps" />
        <label className="label mt-4" htmlFor="rf-notes">Cook&apos;s note</label><textarea id="rf-notes" name="notes" rows={2} defaultValue={r.notes || ""} className="input" /></section>
      <section className={sect}><h2 className="mb-4 text-[20px] font-extrabold">Categories & Diet</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{groups.map((g) => (
          <fieldset key={g}><legend className="mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-brand">{g}</legend>
            {cats.filter((c) => c.parent === g).map((c) => <label key={c.id} className="flex items-center gap-2 py-0.5 text-[15px]"><input type="checkbox" name="categories" value={c.id} defaultChecked={r.categoryIds?.includes(c.id)} className="h-4 w-4 accent-brand" />{c.name}</label>)}</fieldset>
        ))}</div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <fieldset><legend className="mb-1 text-[13px] font-bold uppercase tracking-[0.06em] text-brand">Dietary</legend><div className="flex flex-wrap gap-x-4">{DIETS.map(([v, l]) => <label key={v} className="flex items-center gap-2 py-0.5 text-[15px]"><input type="checkbox" name="diets" value={v} defaultChecked={r.diets?.includes(v)} className="h-4 w-4 accent-brand" />{l}</label>)}</div></fieldset>
          <div><label className="label" htmlFor="rf-cu">Cuisine</label><input id="rf-cu" name="cuisine" defaultValue={r.cuisine || ""} className="input" placeholder="e.g. Italian" /></div>
        </div>
      </section>
      {admin && (
        <>
          <section className={sect}><h2 className="mb-4 text-[20px] font-extrabold">Nutrition (per serving)</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{["calories", "fat", "saturatedFat", "carbs", "fiber", "sugar", "protein", "sodium", "cholesterol"].map((k) => <div key={k}><label className="label text-[13px] capitalize" htmlFor={`n-${k}`}>{k.replace(/([A-Z])/g, " $1")}</label><input id={`n-${k}`} name={k} type="number" min={0} defaultValue={r.nutrition?.[k] ?? ""} className="input" /></div>)}</div></section>
          <section className={sect}><h2 className="mb-4 text-[20px] font-extrabold">SEO & Publishing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="rf-slug">URL slug</label><input id="rf-slug" name="slug" defaultValue={r.slug} className="input" placeholder="auto from title" /></div>
              <div><label className="label" htmlFor="rf-status">Status</label><select id="rf-status" name="status" defaultValue={r.status || "draft"} className="input">{["draft", "pending", "published", "rejected"].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div><label className="label" htmlFor="rf-seot">SEO title</label><input id="rf-seot" name="seoTitle" defaultValue={r.seoTitle || ""} className="input" maxLength={70} /></div>
              <div><label className="label" htmlFor="rf-author">Author / contributor</label><select id="rf-author" name="authorId" defaultValue={r.authorId ?? ""} className="input">{authors?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div className="sm:col-span-2"><label className="label" htmlFor="rf-seod">Meta description</label><textarea id="rf-seod" name="seoDescription" rows={2} maxLength={170} defaultValue={r.seoDescription || ""} className="input" /></div>
            </div></section>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingText="Saving…">{admin ? "Save Recipe" : r.id ? "Save & Resubmit" : "Submit Recipe"}</SubmitButton>
        {!admin && <button name="asDraft" value="1" className="btn-ghost">Save as Draft</button>}
      </div>
      {!admin && <p className="text-[14px] text-muted">Submitted recipes are reviewed by our editors before they appear on the site. By submitting you confirm this recipe and photo are your own.</p>}
    </form>
  );
}

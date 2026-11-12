import { asc } from "drizzle-orm";
import { ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { db, homepageSections } from "@/db";
import { saveSection, moveSection, toggleSection, deleteSection } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnGhost } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
export const metadata = { title: "Homepage" };
const TYPES = [["hero", "Hero feature (recipeIds)"], ["recipe_grid", "Recipe grid"], ["recipe_row", "Recipe row / carousel"], ["category_tiles", "Category tiles"], ["collection_feature", "Collection feature (collectionSlug)"], ["article_list", "Articles"], ["video_row", "Videos"], ["newsletter", "Newsletter signup"]];
const HELP = `Config keys: recipeIds [1,2], categorySlug "desserts", collectionSlug "…", sort "latest"|"rating"|"popular", limit 4, subtitle "…"`;
export default async function Homepage() {
  const list = await db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder));
  const fields = (s?: typeof list[number]) => (<div className="grid gap-3 sm:grid-cols-[1fr_220px]">
    {s && <input type="hidden" name="id" value={s.id} />}<input type="hidden" name="sortOrder" value={s?.sortOrder ?? list.length} />
    <div><label className={alabel}>Title</label><input name="title" defaultValue={s?.title} className={ainput} required /></div>
    <div><label className={alabel}>Type</label><select name="type" defaultValue={s?.type || "recipe_grid"} className={ainput}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    <div className="sm:col-span-2"><label className={alabel}>Config (JSON)</label><textarea name="config" rows={2} defaultValue={JSON.stringify(s?.config ?? { limit: 4 })} className={ainput + " font-mono text-[13px]"} /><p className="mt-1 text-[12px] text-[#8a91a0]">{HELP}</p></div>
    <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="enabled" defaultChecked={s?.enabled ?? true} className="accent-brand" />Visible</label></div>);
  return (<><PageHeader title="Homepage sections" sub="Reorder, show/hide and configure each block of the homepage. Changes go live immediately." actions={<a href="/" target="_blank" className={abtnGhost}>View homepage ↗</a>} />
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-3">{list.map((s, i) => (
        <Card key={s.id} pad={false} className={s.enabled ? "" : "opacity-60"}>
          <div className="flex items-center gap-3 px-4 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f3f4f7] text-[12px] font-bold tabular-nums">{i + 1}</span><div className="min-w-0 flex-1"><div className="font-semibold">{s.title}</div><div className="text-[12px] text-[#8a91a0]">{TYPES.find((t) => t[0] === s.type)?.[1]}</div></div>
            <form action={moveSection}><input type="hidden" name="id" value={s.id} /><button name="dir" value="up" disabled={i === 0} className="rounded p-1.5 hover:bg-[#f3f4f7] disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button><button name="dir" value="down" disabled={i === list.length - 1} className="rounded p-1.5 hover:bg-[#f3f4f7] disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button></form>
            <form action={toggleSection}><input type="hidden" name="id" value={s.id} /><button className="rounded p-1.5 hover:bg-[#f3f4f7]" aria-label={s.enabled ? "Hide" : "Show"}>{s.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button></form></div>
          <details className="border-t border-admin-line"><summary className="cursor-pointer px-4 py-2 text-[13px] font-semibold text-brand">Edit section</summary><div className="p-4 pt-1"><ActionForm action={saveSection}>{fields(s)}<div className="mt-3"><AdminSubmit /></div></ActionForm>
            <form action={deleteSection} className="mt-2"><input type="hidden" name="id" value={s.id} /><ConfirmButton className="text-[13px] font-semibold text-red-700 hover:underline">Remove section</ConfirmButton></form></div></details>
        </Card>))}</div>
      <Card title="Add section" className="self-start"><ActionForm action={saveSection}>{fields()}<div className="mt-3"><AdminSubmit>Add section</AdminSubmit></div></ActionForm></Card>
    </div></>);
}

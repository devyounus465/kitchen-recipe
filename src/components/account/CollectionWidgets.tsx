"use client";
import { useActionState, useState, useTransition } from "react";
import { FolderPlus, Check, Plus, X } from "lucide-react";
import { createCollection, toggleInCollection, updateCollection } from "@/lib/actions/account";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus } from "@/components/ui/FormStatus";

export function NewCollectionForm({ recipeId, onDone }: { recipeId?: number; onDone?: () => void }) {
  const [state, action] = useActionState(async (s: Parameters<typeof createCollection>[0], fd: FormData) => { const r = await createCollection(s, fd); if (r?.ok) onDone?.(); return r; }, null);
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-3">
      {recipeId && <input type="hidden" name="recipeId" value={recipeId} />}
      <div><label className="label" htmlFor={`cn-${recipeId ?? 0}`}>Collection name</label><input id={`cn-${recipeId ?? 0}`} name="name" required maxLength={80} className="input" placeholder="e.g. Weeknight Favorites" /></div>
      {!recipeId && <div><label className="label" htmlFor="cd">Description</label><textarea id="cd" name="description" rows={2} maxLength={500} className="input" /></div>}
      <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" name="isPublic" className="h-4 w-4 accent-brand" />Make this collection public</label>
      <FormStatus state={state} /><SubmitButton className="h-10 text-[13px]" pendingText="Creating…">Create Collection</SubmitButton>
    </form>
  );
}
export function AddToCollection({ recipeId, collections }: { recipeId: number; collections: { id: number; name: string; has: boolean }[] }) {
  const [open, setOpen] = useState(false); const [items, setItems] = useState(collections); const [creating, setCreating] = useState(false); const [, start] = useTransition();
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.05em] text-ink hover:text-brand"><FolderPlus className="h-4 w-4" />Add to collection</button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border border-rule bg-white p-3 shadow-pop">
          <div className="mb-2 flex items-center justify-between"><span className="font-bold text-ink">Collections</span><button onClick={() => setOpen(false)} aria-label="Close"><X className="h-4 w-4" /></button></div>
          {items.length === 0 && !creating && <p className="text-[14px] text-muted">No collections yet.</p>}
          <ul className="max-h-48 space-y-1 overflow-y-auto">{items.map((c) => (
            <li key={c.id}><button onClick={() => { const add = !c.has; setItems(items.map((x) => x.id === c.id ? { ...x, has: add } : x)); start(() => toggleInCollection(c.id, recipeId, add).then(() => {})); }} className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[15px] hover:bg-tint">{c.name}{c.has ? <Check className="h-4 w-4 text-brand" /> : <Plus className="h-4 w-4 text-muted" />}</button></li>
          ))}</ul>
          <div className="mt-2 border-t border-rule pt-2">{creating ? <NewCollectionForm recipeId={recipeId} onDone={() => { setCreating(false); setOpen(false); }} /> : <button onClick={() => setCreating(true)} className="text-[14px] font-bold text-brand hover:underline">+ New collection</button>}</div>
        </div>
      )}
    </div>
  );
}
export function EditCollectionForm({ c }: { c: { id: number; name: string; description: string | null; isPublic: boolean } }) {
  const [state, action] = useActionState(updateCollection, null);
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-3 rounded-lg border border-rule p-5"><input type="hidden" name="id" value={c.id} />
      <div><label className="label" htmlFor="en">Name</label><input id="en" name="name" defaultValue={c.name} className="input" /></div>
      <div><label className="label" htmlFor="ed">Description</label><textarea id="ed" name="description" defaultValue={c.description || ""} rows={2} className="input" /></div>
      <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" name="isPublic" defaultChecked={c.isPublic} className="h-4 w-4 accent-brand" />Public</label>
      <FormStatus state={state} /><SubmitButton className="h-10 text-[13px]">Save</SubmitButton>
    </form>
  );
}

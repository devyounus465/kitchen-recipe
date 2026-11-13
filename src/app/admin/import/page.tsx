import { importAdmin } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel } from "@/components/admin/ui";
import { ActionForm, AdminSubmit } from "@/components/admin/ActionForm";
export const metadata = { title: "Bulk import" };
const EXAMPLE = `{
  "categories": [{ "name": "Granola", "parent": "meals" }],
  "recipes": [{
    "title": "Maple Pecan Granola", "description": "Crunchy and not too sweet.",
    "prepMin": 10, "cookMin": 30, "servings": 8,
    "ingredients": ["3 cups rolled oats", "1/3 cup maple syrup"],
    "steps": ["Mix everything.", "Bake 30 minutes at 325°F."],
    "categories": ["granola", "breakfast-and-brunch"], "diets": ["vegan"],
    "imageUrl": "https://…", "author": "maya-thornton", "status": "draft"
  }],
  "articles": [{ "title": "…", "kind": "guide", "body": "## Heading\\nText", "status": "draft" }],
  "videos": [{ "title": "…", "videoUrl": "https://www.youtube.com/watch?v=…", "recipe": "maple-pecan-granola" }]
}`;
export default function ImportPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader title="Bulk import" sub="Add many categories, recipes, articles and videos at once from a JSON file. Items whose URL slug already exists are skipped, so re-importing is safe." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title="Upload">
          <ActionForm action={importAdmin}>
            <div className="space-y-4">
              <div><label className={alabel} htmlFor="file">JSON file (max 5MB)</label><input id="file" name="file" type="file" accept="application/json,.json" className="text-[13px]" /></div>
              <div><label className={alabel} htmlFor="json">…or paste JSON</label><textarea id="json" name="json" rows={10} className={ainput + " font-mono text-[12px]"} /></div>
              <AdminSubmit>Import</AdminSubmit>
            </div>
          </ActionForm>
          <p className="mt-4 text-[12px] text-[#6b7385]">Tip: import as <b>draft</b>, review in Recipes, then publish. Upload images to the Media Library first and use their URLs.</p>
        </Card>
        <Card title="Format">
          <pre className="overflow-x-auto rounded-lg bg-[#0f1115] p-4 text-[12px] leading-relaxed text-white/90">{EXAMPLE}</pre>
          <p className="mt-3 text-[12px] text-[#6b7385]">Status: draft · pending · published. Categories/recipes are referenced by URL slug, authors by username.</p>
        </Card>
      </div>
    </div>
  );
}

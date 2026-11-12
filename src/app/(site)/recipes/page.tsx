import Link from "next/link";
import { navTree, cardsInCategorySlug } from "@/lib/queries";
import { categoryUrl } from "@/lib/utils";
import { Img } from "@/components/ui/Img";
export const metadata = { title: "Recipes A to Z", description: "Browse every recipe category on Simmerly." };
export default async function RecipesIndex() {
  const tree = await navTree();
  const covers = new Map<number, string | null>();
  await Promise.all(tree.flatMap((g) => g.children).map(async (c) => covers.set(c.id, (await cardsInCategorySlug(c.slug, 1))[0]?.imageUrl ?? null)));
  return (
    <div className="container-site pt-10">
      <h1 className="text-[40px] font-extrabold md:text-[48px]">Recipes</h1>
      <p className="mt-2 text-[19px]">Browse thousands of recipes by meal, ingredient, occasion and cuisine.</p>
      {tree.map((g) => (
        <section key={g.id} className="mt-12">
          <div className="mb-5 flex items-end justify-between border-b-2 border-ink pb-3"><h2 className="h-section">{g.name}</h2><Link href={categoryUrl(g)} className="text-[14px] font-bold uppercase tracking-[0.06em] text-brand hover:underline">View all</Link></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {g.children.map((c) => <Link key={c.id} href={categoryUrl(c)} className="group"><div className="aspect-[4/3] overflow-hidden"><Img src={covers.get(c.id)} alt="" w={400} className="h-full w-full transition group-hover:scale-105" /></div><div className="mt-2 text-[17px] font-extrabold text-ink group-hover:underline">{c.name}</div></Link>)}
          </div>
        </section>
      ))}
    </div>
  );
}

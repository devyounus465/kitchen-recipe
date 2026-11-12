import Link from "next/link";
import { editorialCollections } from "@/lib/queries";
import { Img } from "@/components/ui/Img";
export const metadata = { title: "Recipe Collections", description: "Hand-picked recipe collections from our editors." };
export default async function Collections() {
  const list = await editorialCollections();
  return (
    <div className="container-site pt-10">
      <h1 className="text-[40px] font-extrabold md:text-[48px]">Recipe Collections</h1>
      <p className="mt-2 text-[19px]">Hand-picked by our editors and loved by our community.</p>
      <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link key={c.id} href={`/collections/${c.slug}/`} className="group">
            <div className="relative aspect-[4/3] overflow-hidden"><Img src={c.imageUrl} alt={c.name} w={700} className="h-full w-full transition duration-500 group-hover:scale-105" />
              <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[13px] font-bold uppercase tracking-[0.06em] text-ink">{c.n} recipes</span></div>
            <h2 className="mt-3 text-[22px] font-extrabold text-ink decoration-brand decoration-2 underline-offset-4 group-hover:underline">{c.name}</h2>
            <p className="mt-1 text-[16px] text-muted">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

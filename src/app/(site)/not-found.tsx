import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-site py-20 text-center">
      <div className="text-[120px] font-black leading-none text-brand">404</div>
      <h1 className="mt-4 text-[34px] font-extrabold">Oops! We can&apos;t find that page.</h1>
      <p className="mx-auto mt-3 max-w-lg text-[18px] text-muted">The page you&apos;re looking for may have moved or no longer exists. Try searching for a recipe instead.</p>
      <form action="/search/" className="mx-auto mt-8 flex max-w-md overflow-hidden rounded-full border-2 border-ink"><input name="q" aria-label="Search" placeholder="Find a recipe or ingredient" className="h-12 flex-1 px-5 focus:outline-none" /><button className="bg-brand px-6 font-bold uppercase text-white">Search</button></form>
      <div className="mt-6 flex justify-center gap-3"><Link href="/" className="btn-primary">Go Home</Link><Link href="/recipes/" className="btn-outline">Browse Recipes</Link></div>
    </div>
  );
}

import { homeSections, savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { RenderSection } from "@/components/home/Sections";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, user] = await Promise.all([homeSections(), getUser()]);
  const ctx = { saved: await savedIdSet(user?.id), loggedIn: !!user };
  return (
    <>
      <h1 className="sr-only">{SITE.name} — {SITE.tagline}</h1>
      {sections.map((s) => <RenderSection key={s.id} s={s} ctx={ctx} />)}
    </>
  );
}

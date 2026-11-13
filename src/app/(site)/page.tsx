import { homeSections, savedIdSet } from "@/lib/queries";
import { getUser } from "@/lib/auth";
import { RenderSection } from "@/components/home/Sections";
import { SITE } from "@/lib/site";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [sections, user, settings] = await Promise.all([homeSections(), getUser(), getSettings()]);
  const ctx = { saved: await savedIdSet(user?.id), loggedIn: !!user };
  return (
    <>
      <h1 className="sr-only">{SITE.name} — {settings.tagline}</h1>
      {sections.map((s) => <RenderSection key={s.id} s={s} ctx={ctx} />)}
    </>
  );
}

import Link from "next/link";
import { Logo } from "./Logo";
import { Newsletter } from "./Newsletter";
import { navTree } from "@/lib/queries";
import { categoryUrl } from "@/lib/utils";
import { getSettings } from "@/lib/settings";

const SOCIAL: [string, string][] = [
  ["Facebook", "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"],
  ["Instagram", "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.5-1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"],
  ["Pinterest", "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.4s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.6-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.2-.4.1-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.7-2.4 6.8-5.6 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z"],
  ["TikTok", "M16 3c.3 2.2 1.6 3.6 4 3.8v3.3a7 7 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3.3a2.7 2.7 0 1 0 2.7 2.7V3H16z"],
  ["YouTube", "M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.4-1.2.4-3.8.4-3.8s0-2.6-.4-3.8zM10 15V9l5.2 3L10 15z"],
];

export async function Footer() {
  const [tree, settings] = await Promise.all([navTree(), getSettings()]);
  const social = settings.social as Record<string, string>;
  return (
    <footer className="no-print mt-20 bg-ink text-white">
      <div className="container-site grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <Link href="/" className="text-[36px]"><Logo light /></Link>
          <p className="mt-3 max-w-sm text-[16px] text-white/75">{settings.footerAbout}</p>
          {SOCIAL.some(([n]) => social[n]) && <ul className="mt-5 flex gap-3">
            {SOCIAL.filter(([n]) => social[n]).map(([n, d]) => <li key={n}><a href={social[n]} target="_blank" rel="noopener noreferrer" aria-label={`Simmerly on ${n}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand"><svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d={d} /></svg></a></li>)}
          </ul>}
          <div className="mt-8"><Newsletter dark title={settings.newsletterTitle} subtitle={settings.newsletterSubtitle} /></div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {tree.slice(0, 3).map((g) => (
            <div key={g.id}>
              <h3 className="mb-3 text-[14px] font-bold uppercase tracking-[0.1em] text-white">{g.name}</h3>
              <ul className="space-y-2">{g.children.slice(0, 6).map((c) => <li key={c.id}><Link href={categoryUrl(c)} className="text-[15px] text-white/75 hover:text-white hover:underline">{c.name}</Link></li>)}</ul>
            </div>
          ))}
          <div>
            <h3 className="mb-3 text-[14px] font-bold uppercase tracking-[0.1em]">Explore</h3>
            <ul className="space-y-2 text-[15px] text-white/75">
              {[["/collections/", "Collections"], ["/videos/", "Videos"], ["/kitchen-tips/", "Kitchen Tips"], ["/news/", "News"], ["/search/?sort=rating", "Top-Rated"]].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[14px] font-bold uppercase tracking-[0.1em]">Community</h3>
            <ul className="space-y-2 text-[15px] text-white/75">
              {[["/account/register/", "Join Free"], ["/account/submit-recipe/", "Submit a Recipe"], ["/account/my-recipes/", "My Recipes"], ["/account/login/", "Log In"]].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-[14px] font-bold uppercase tracking-[0.1em]">About</h3>
            <ul className="space-y-2 text-[15px] text-white/75">
              {[["/about-us/", "About Us"], ["/contact/", "Contact"], ["/privacy-policy/", "Privacy Policy"], ["/terms-of-service/", "Terms of Service"]].map(([h, l]) => <li key={h}><Link href={h} className="hover:text-white hover:underline">{l}</Link></li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="container-site flex flex-col gap-2 py-5 text-[13px] text-white/60 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Simmerly. All rights reserved.</span>
          <span className="flex gap-4"><Link href="/privacy-policy/" className="hover:text-white">Privacy</Link><Link href="/terms-of-service/" className="hover:text-white">Terms</Link><Link href="/sitemap.xml" className="hover:text-white">Sitemap</Link></span>
        </div>
      </div>
    </footer>
  );
}

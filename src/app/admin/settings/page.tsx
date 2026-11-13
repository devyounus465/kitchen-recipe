import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel } from "@/components/admin/ui";
import { ActionForm, AdminSubmit } from "@/components/admin/ActionForm";
export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Site settings" sub="Text, links and community rules used across the site. Changes go live immediately." />
      <ActionForm action={saveSettings}>
        <div className="space-y-6">
          <Card title="General">
            <div className="space-y-4">
              <div><label className={alabel} htmlFor="tagline">Site tagline (used for search engines)</label><input id="tagline" name="tagline" defaultValue={s.tagline} maxLength={200} className={ainput} /></div>
              <div><label className={alabel} htmlFor="footerAbout">Footer description</label><textarea id="footerAbout" name="footerAbout" rows={2} maxLength={500} defaultValue={s.footerAbout} className={ainput} /></div>
              <div><label className={alabel} htmlFor="contactEmail">Public contact email (optional)</label><input id="contactEmail" name="contactEmail" type="email" defaultValue={s.contactEmail} className={ainput} /></div>
            </div>
          </Card>
          <Card title="Newsletter box">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={alabel} htmlFor="nlt">Title</label><input id="nlt" name="newsletterTitle" defaultValue={s.newsletterTitle} maxLength={120} className={ainput} /></div>
              <div><label className={alabel} htmlFor="nls">Subtitle</label><input id="nls" name="newsletterSubtitle" defaultValue={s.newsletterSubtitle} maxLength={300} className={ainput} /></div>
            </div>
          </Card>
          <Card title="Social links (footer)">
            <p className="mb-3 text-[13px] text-[#6b7385]">Leave a field empty to hide that icon.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(s.social) as (keyof typeof s.social)[]).map((k) => <div key={k}><label className={alabel} htmlFor={`so-${k}`}>{k}</label><input id={`so-${k}`} name={`social_${k}`} defaultValue={s.social[k]} placeholder="https://" className={ainput} /></div>)}
            </div>
          </Card>
          <Card title="Review moderation">
            <div className="space-y-2 text-[14px]">
              {([["links", "Hold reviews that contain links for approval (recommended)"], ["all", "Every review needs approval before it appears"], ["none", "Publish all reviews immediately"]] as const).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2"><input type="radio" name="reviewModeration" value={v} defaultChecked={s.reviewModeration === v} className="accent-brand" />{l}</label>
              ))}
            </div>
          </Card>
          <AdminSubmit>Save settings</AdminSubmit>
        </div>
      </ActionForm>
    </div>
  );
}

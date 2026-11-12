import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account/AccountNav";
import { ProfileForm, PasswordForm, DeleteForm } from "@/components/account/SettingsForms";
export const metadata = { title: "Account Settings", robots: { index: false } };
export default async function Settings() {
  const u = await requireUser("/account/settings/");
  return (
    <AccountShell active="settings" user={u} title="Account Settings">
      <section className="rounded-lg border border-rule p-6"><h2 className="mb-4 text-[22px] font-extrabold">Profile</h2><ProfileForm u={u} /></section>
      <section className="mt-6 rounded-lg border border-rule p-6"><h2 className="mb-4 text-[22px] font-extrabold">Change Password</h2><PasswordForm /></section>
      <section className="mt-6 rounded-lg border border-red-200 bg-red-50/40 p-6"><h2 className="mb-2 text-[22px] font-extrabold text-red-800">Delete Account</h2><DeleteForm /></section>
    </AccountShell>
  );
}

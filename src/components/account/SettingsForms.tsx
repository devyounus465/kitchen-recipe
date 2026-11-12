"use client";
import { useActionState } from "react";
import { updateProfile, changePassword, deleteAccount } from "@/lib/actions/account";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus, FieldError } from "@/components/ui/FormStatus";
import { Avatar } from "@/components/ui/Avatar";
type U = { name: string; username: string; email: string; bio: string | null; location: string | null; avatarUrl: string | null; newsletter: boolean };
export function ProfileForm({ u }: { u: U }) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4" encType="multipart/form-data"><FormStatus state={state} />
      <div className="flex items-center gap-4"><Avatar name={u.name} url={u.avatarUrl} size={72} /><div><label className="label" htmlFor="avatar">Profile photo</label><input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="text-[14px]" />{u.avatarUrl && <label className="mt-1 flex items-center gap-2 text-[14px]"><input type="checkbox" name="removeAvatar" />Remove photo</label>}</div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="s-name">Display name</label><input id="s-name" name="name" defaultValue={u.name} className="input" /><FieldError state={state} name="name" /></div>
        <div><label className="label" htmlFor="s-user">Username</label><input id="s-user" name="username" defaultValue={u.username} className="input" /><FieldError state={state} name="username" /></div>
        <div><label className="label" htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" defaultValue={u.email} className="input" /><FieldError state={state} name="email" /></div>
        <div><label className="label" htmlFor="s-loc">Location</label><input id="s-loc" name="location" defaultValue={u.location || ""} className="input" /></div>
      </div>
      <div><label className="label" htmlFor="s-bio">About me</label><textarea id="s-bio" name="bio" rows={3} maxLength={500} defaultValue={u.bio || ""} className="input" /><FieldError state={state} name="bio" /></div>
      <label className="flex items-center gap-2 text-[15px]"><input type="checkbox" name="newsletter" defaultChecked={u.newsletter} className="h-4 w-4 accent-brand" />Email me the Daily Dish newsletter</label>
      <div className="max-w-sm"><label className="label" htmlFor="s-cur">Current password <span className="font-normal text-muted">(only needed to change your email)</span></label><input id="s-cur" name="currentPassword" type="password" autoComplete="current-password" className="input" /><FieldError state={state} name="currentPassword" /></div>
      <SubmitButton>Save Changes</SubmitButton>
    </form>
  );
}
export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4"><FormStatus state={state} />
      <div><label className="label" htmlFor="cur">Current password</label><input id="cur" name="current" type="password" autoComplete="current-password" className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label" htmlFor="np">New password</label><input id="np" name="password" type="password" autoComplete="new-password" className="input" /></div><div><label className="label" htmlFor="cp">Confirm</label><input id="cp" name="confirm" type="password" autoComplete="new-password" className="input" /></div></div>
      <SubmitButton>Update Password</SubmitButton>
    </form>
  );
}
export function DeleteForm() {
  const [state, action] = useActionState(deleteAccount, null);
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-3"><FormStatus state={state} /><p className="text-[15px]">This permanently deletes your account, reviews, photos, saved recipes and collections. Type <b>DELETE</b> and your password to confirm.</p>
      <div className="flex flex-wrap gap-3"><input name="confirm" className="input max-w-[200px]" aria-label="Type DELETE to confirm" placeholder="DELETE" /><input name="password" type="password" autoComplete="current-password" className="input max-w-[240px]" aria-label="Your password" placeholder="Your password" /></div><button className="btn border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white">Delete My Account</button></form>
  );
}

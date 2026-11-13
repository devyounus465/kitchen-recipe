import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getUser } from "@/lib/auth";
import { updateUserAdmin, deleteUserAdmin, sendResetAdmin } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnDanger, abtnGhost, Saved } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Edit user" };
export default async function EditUser({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; reset?: string }> }) {
  const sp = await searchParams;
  const [u] = await db.select().from(users).where(eq(users.id, Number((await params).id))); if (!u) notFound();
  const me = await getUser(); const isAdmin = me?.role === "admin";
  return (
    <div className="max-w-3xl"><PageHeader crumb={{ href: "/admin/users", label: "Users" }} title={u.name} sub={`${u.email} · joined ${formatDate(u.createdAt)}`} actions={<Link href={`/cook/${u.username}/`} target="_blank" className={abtnGhost}>Public profile ↗</Link>} />
      <Saved show={!!sp.created} text="User created. An invitation email with a link to set their password has been sent (see Email outbox if SMTP isn't configured)." />
      <Saved show={!!sp.reset} text="Password reset link sent." />
      <Card><div className="mb-5 flex items-center gap-4"><Avatar name={u.name} url={u.avatarUrl} size={56} /><div><div className="font-semibold">@{u.username}</div><div className="text-[13px] text-[#6b7385]">{u.location || "No location"}</div></div></div>
        {!isAdmin && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">Only administrators can change roles or ban users.</p>}
        <ActionForm action={updateUserAdmin}><input type="hidden" name="id" value={u.id} /><fieldset disabled={!isAdmin} className="grid gap-4 sm:grid-cols-2">
          <div><label className={alabel}>Role</label><select name="role" defaultValue={u.role} className={ainput}><option value="user">Member</option><option value="contributor">Contributor</option><option value="editor">Editor (CMS access)</option><option value="admin">Administrator</option></select></div>
          <div><label className={alabel}>Status</label><select name="status" defaultValue={u.status} className={ainput}><option value="active">Active</option><option value="banned">Banned</option></select></div>
          <div><label className={alabel}>Author title</label><input name="title" defaultValue={u.title || ""} className={ainput} placeholder="e.g. Senior Food Editor" /></div>
          <label className="mt-6 flex items-center gap-2 text-[14px]"><input type="checkbox" name="isStaff" defaultChecked={u.isStaff} className="accent-brand" />Show as editorial author (byline “By …”)</label>
          <div className="sm:col-span-2"><label className={alabel}>Bio</label><textarea name="bio" rows={3} maxLength={1000} defaultValue={u.bio || ""} className={ainput} /></div>
          <div className="sm:col-span-2"><label className={alabel}>Profile photo (shown on bylines)</label><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="text-[13px]" />{u.avatarUrl && <label className="ml-4 inline-flex items-center gap-2 text-[13px]"><input type="checkbox" name="removeAvatar" />Remove photo</label>}</div>
          <div><AdminSubmit /></div></fieldset></ActionForm>
        {isAdmin && <form action={sendResetAdmin} className="mt-6 border-t border-admin-line pt-5"><input type="hidden" name="id" value={u.id} /><button className={abtnGhost}>Send password reset link</button><span className="ml-3 text-[12px] text-[#6b7385]">Emails the user a secure link to choose a new password.</span></form>}
        {isAdmin && me?.id !== u.id && <form action={deleteUserAdmin} className="mt-6 border-t border-admin-line pt-5"><input type="hidden" name="id" value={u.id} /><ConfirmButton className={abtnDanger} message="Delete this user and all their reviews, photos and collections?">Delete user</ConfirmButton></form>}
      </Card></div>
  );
}

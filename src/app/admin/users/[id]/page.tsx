import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { getUser } from "@/lib/auth";
import { updateUserAdmin, deleteUserAdmin } from "@/lib/actions/admin";
import { PageHeader, Card, ainput, alabel, abtnDanger, abtnGhost } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Edit user" };
export default async function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const [u] = await db.select().from(users).where(eq(users.id, Number((await params).id))); if (!u) notFound();
  const me = await getUser(); const isAdmin = me?.role === "admin";
  return (
    <div className="max-w-3xl"><PageHeader crumb={{ href: "/admin/users", label: "Users" }} title={u.name} sub={`${u.email} · joined ${formatDate(u.createdAt)}`} actions={<Link href={`/cook/${u.username}/`} target="_blank" className={abtnGhost}>Public profile ↗</Link>} />
      <Card><div className="mb-5 flex items-center gap-4"><Avatar name={u.name} url={u.avatarUrl} size={56} /><div><div className="font-semibold">@{u.username}</div><div className="text-[13px] text-[#6b7385]">{u.location || "No location"}</div></div></div>
        {!isAdmin && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[13px] text-amber-900">Only administrators can change roles or ban users.</p>}
        <ActionForm action={updateUserAdmin}><input type="hidden" name="id" value={u.id} /><fieldset disabled={!isAdmin} className="grid gap-4 sm:grid-cols-2">
          <div><label className={alabel}>Role</label><select name="role" defaultValue={u.role} className={ainput}><option value="user">Member</option><option value="contributor">Contributor</option><option value="editor">Editor (CMS access)</option><option value="admin">Administrator</option></select></div>
          <div><label className={alabel}>Status</label><select name="status" defaultValue={u.status} className={ainput}><option value="active">Active</option><option value="banned">Banned</option></select></div>
          <div><label className={alabel}>Author title</label><input name="title" defaultValue={u.title || ""} className={ainput} placeholder="e.g. Senior Food Editor" /></div>
          <label className="mt-6 flex items-center gap-2 text-[14px]"><input type="checkbox" name="isStaff" defaultChecked={u.isStaff} className="accent-brand" />Show as editorial author (byline “By …”)</label>
          <div className="sm:col-span-2"><label className={alabel}>Bio</label><textarea name="bio" rows={3} defaultValue={u.bio || ""} className={ainput} /></div>
          <div><AdminSubmit /></div></fieldset></ActionForm>
        {isAdmin && me?.id !== u.id && <form action={deleteUserAdmin} className="mt-6 border-t border-admin-line pt-5"><input type="hidden" name="id" value={u.id} /><ConfirmButton className={abtnDanger} message="Delete this user and all their reviews, photos and collections?">Delete user</ConfirmButton></form>}
      </Card></div>
  );
}

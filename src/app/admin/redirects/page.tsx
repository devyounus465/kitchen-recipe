import { desc } from "drizzle-orm";
import { db, redirects } from "@/db";
import { saveRedirect, deleteRedirect } from "@/lib/actions/admin";
import { PageHeader, Card, Table, ainput, alabel } from "@/components/admin/ui";
import { ActionForm, AdminSubmit, ConfirmButton } from "@/components/admin/ActionForm";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "URL redirects" };
export default async function Redirects() {
  const list = await db.select().from(redirects).orderBy(desc(redirects.createdAt)).limit(500);
  return (
    <>
      <PageHeader title="URL redirects" sub="Old addresses that permanently forward to new ones. Created automatically when you change an article, collection or page URL; add your own below." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Card pad={false}>
          <Table head={["From", "To", "Uses", "Created", ""]} empty={!list.length}>
            {list.map((r) => (
              <tr key={r.id} className="hover:bg-[#fafbfc]">
                <td className="px-4 py-2.5 font-mono text-[13px]">{r.fromPath}</td><td className="px-4 font-mono text-[13px]">{r.toPath}</td>
                <td className="px-4 tabular-nums">{r.hits}</td><td className="whitespace-nowrap px-4 text-[#6b7385]">{formatDate(r.createdAt)}</td>
                <td className="px-4 text-right"><form action={deleteRedirect}><input type="hidden" name="id" value={r.id} /><ConfirmButton className="text-[13px] font-semibold text-red-700 hover:underline">Delete</ConfirmButton></form></td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Add redirect" className="self-start">
          <ActionForm action={saveRedirect}>
            <div className="space-y-3">
              <div><label className={alabel} htmlFor="rf">From (old path)</label><input id="rf" name="fromPath" required placeholder="/old-page/" className={ainput} /></div>
              <div><label className={alabel} htmlFor="rt">To (new path)</label><input id="rt" name="toPath" required placeholder="/new-page/" className={ainput} /></div>
              <AdminSubmit>Save redirect</AdminSubmit>
            </div>
          </ActionForm>
          <p className="mt-3 text-[12px] text-[#6b7385]">Works for article, collection and page URLs that no longer exist.</p>
        </Card>
      </div>
    </>
  );
}

import { desc } from "drizzle-orm";
import { db, contactMessages } from "@/db";
import { markMessage } from "@/lib/actions/admin";
import { PageHeader, Card, Badge, abtnGhost } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";
export const metadata = { title: "Messages" };
export default async function Messages() {
  const list = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  return (<><PageHeader title="Contact messages" sub={`${list.filter((m) => !m.handled).length} open`} />
    <div className="space-y-3">{list.length === 0 && <Card><p className="text-center text-[#6b7385]">No messages.</p></Card>}{list.map((m) => (
      <Card key={m.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">{m.subject}</div><div className="text-[13px] text-[#6b7385]">{m.name} · <a href={`mailto:${m.email}`} className="text-brand">{m.email}</a> · {formatDate(m.createdAt)}</div></div>
        <div className="flex items-center gap-2"><Badge s={m.handled ? "approved" : "pending"} /><form action={markMessage}><input type="hidden" name="id" value={m.id} /><button className={abtnGhost}>{m.handled ? "Reopen" : "Mark handled"}</button></form></div></div>
        <p className="mt-3 whitespace-pre-wrap text-[14px] text-[#3b4252]">{m.message}</p></Card>))}</div></>);
}

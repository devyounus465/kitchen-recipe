import { desc } from "drizzle-orm";
import { db, emailOutbox } from "@/db";
import { PageHeader, Card } from "@/components/admin/ui";
export const metadata = { title: "Email outbox" };
export default async function Outbox() {
  const list = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(100);
  return (<><PageHeader title="Email outbox" sub="Transactional emails sent by the site (welcome, password reset, moderation). Connect SMTP/Resend in production — see README." />
    <div className="space-y-3">{list.length === 0 && <Card><p className="text-center text-[#6b7385]">No emails sent yet.</p></Card>}{list.map((e) => <Card key={e.id}><div className="flex justify-between text-[13px] text-[#6b7385]"><span>To <b className="text-[#0f1115]">{e.to}</b></span><span>{e.createdAt.toLocaleString()}</span></div><div className="mt-1 font-semibold">{e.subject}</div><pre className="mt-2 whitespace-pre-wrap font-sans text-[14px] text-[#3b4252]">{e.body}</pre></Card>)}</div></>);
}

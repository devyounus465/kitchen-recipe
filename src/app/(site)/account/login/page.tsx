import { redirect } from "next/navigation";
import { getUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/account/AuthForms";
export const metadata = { title: "Log In", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const sp = await searchParams; if (await getUser()) redirect(safeNext(sp.next));
  return <LoginForm next={sp.next} reason={sp.reason} />;
}

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { RegisterForm } from "@/components/account/AuthForms";
export const metadata = { title: "Join Free", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams; if (await getUser()) redirect("/account/my-recipes/");
  return <RegisterForm next={sp.next} />;
}

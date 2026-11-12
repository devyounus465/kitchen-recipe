import { ResetForm } from "@/components/account/AuthForms";
export const metadata = { title: "Reset Password", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <ResetForm token={(await searchParams).token || ""} />; }

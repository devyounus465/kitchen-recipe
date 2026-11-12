import Link from "next/link";
export default function GlobalNotFound() {
  return <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center"><div className="text-[96px] font-black text-brand">404</div><h1 className="text-[28px] font-extrabold">Page not found</h1><Link href="/" className="btn-primary mt-6">Go to homepage</Link></div>;
}

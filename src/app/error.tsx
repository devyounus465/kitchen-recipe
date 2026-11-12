"use client";
import Link from "next/link";
export default function Error({ reset, error }: { reset: () => void; error: Error & { digest?: string } }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <div className="text-[64px] font-black text-brand">Uh-oh!</div>
      <h1 className="mt-2 text-[28px] font-extrabold">Something went wrong in the kitchen.</h1>
      <p className="mt-2 max-w-md text-muted">We&apos;ve logged the problem{error.digest ? ` (ref ${error.digest})` : ""}. Please try again.</p>
      <div className="mt-6 flex gap-3"><button onClick={reset} className="btn-primary">Try again</button><Link href="/" className="btn-outline">Go home</Link></div>
    </div>
  );
}

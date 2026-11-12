"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/actions/public";
import { abtnPrimary } from "./ui";

export function AdminSubmit({ children = "Save", className }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={className || abtnPrimary}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Saving…" : children}</button>;
}
/** Wraps a server action with inline success/error feedback. */
export function ActionForm({ action, children, className }: { action: (s: FormState, fd: FormData) => Promise<FormState>; children: React.ReactNode; className?: string }) {
  const [state, run] = useActionState(action, null);
  return (
    <form action={run} onReset={(e) => e.preventDefault()} className={className} encType="multipart/form-data">
      {state?.error && <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[14px] text-red-800"><AlertCircle className="h-4 w-4" />{state.error}</div>}
      {state?.ok && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[14px] text-emerald-800"><CheckCircle2 className="h-4 w-4" />{state.message}</div>}
      {children}
    </form>
  );
}
export function ConfirmButton({ children, className, message = "Are you sure? This cannot be undone." }: { children: React.ReactNode; className?: string; message?: string }) {
  return <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}

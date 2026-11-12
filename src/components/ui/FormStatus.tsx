import { CheckCircle2, AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/actions/public";
export function FormStatus({ state }: { state: FormState }) {
  if (!state) return null;
  if (state.error) return <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{state.error}</div>;
  if (state.ok && state.message) return <div role="status" className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-[15px] text-green-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{state.message}</div>;
  return null;
}
export function FieldError({ state, name }: { state: FormState; name: string }) {
  const e = state?.fieldErrors?.[name]; return e ? <p className="mt-1 text-[14px] font-semibold text-red-700">{e}</p> : null;
}

"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
export function SubmitButton({ children, className, pendingText }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={cn("btn-primary", className)}>{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? pendingText || "Saving…" : children}</button>;
}

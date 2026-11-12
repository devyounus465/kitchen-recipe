"use client";
import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/actions/public";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus } from "@/components/ui/FormStatus";
import { cn } from "@/lib/utils";
export function Newsletter({ dark, title = "Get our best recipes delivered", subtitle = "Sign up for the Simmerly Daily Dish newsletter." }: { dark?: boolean; title?: string; subtitle?: string }) {
  const [state, action] = useActionState(subscribeNewsletter, null);
  return (
    <div className={cn(dark ? "text-white" : "")}>
      <h2 className={cn("text-[24px] font-extrabold leading-tight", dark ? "text-white" : "text-ink")}>{title}</h2>
      <p className={cn("mt-1 text-[16px]", dark ? "text-white/80" : "text-muted")}>{subtitle}</p>
      {state?.ok ? <div className="mt-4"><FormStatus state={state} /></div> : (
        <form action={action} onReset={(e) => e.preventDefault()} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={dark ? "nl-f" : "nl-b"} className="sr-only">Email address</label>
          <input id={dark ? "nl-f" : "nl-b"} name="email" type="email" required placeholder="Enter your email address" className="input h-12 flex-1 rounded-full px-5" />
          <SubmitButton className="h-12 px-8" pendingText="Signing up…">Sign Up</SubmitButton>
        </form>
      )}
      {state?.error && <div className="mt-2"><FormStatus state={state} /></div>}
    </div>
  );
}

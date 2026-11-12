"use client";
import { useActionState } from "react";
import { sendContact } from "@/lib/actions/public";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus, FieldError } from "@/components/ui/FormStatus";
export function ContactForm() {
  const [state, action] = useActionState(sendContact, null);
  if (state?.ok) return <div className="self-start"><FormStatus state={state} /></div>;
  return (
    <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4 rounded-lg border border-rule p-6 shadow-card" noValidate>
      <FormStatus state={state} />
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" name="name" className="input" required /><FieldError state={state} name="name" /></div>
        <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" className="input" required /><FieldError state={state} name="email" /></div>
      </div>
      <div><label className="label" htmlFor="c-sub">Subject</label><input id="c-sub" name="subject" className="input" required /><FieldError state={state} name="subject" /></div>
      <div><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" name="message" rows={6} className="input" required /><FieldError state={state} name="message" /></div>
      <SubmitButton pendingText="Sending…">Send Message</SubmitButton>
    </form>
  );
}

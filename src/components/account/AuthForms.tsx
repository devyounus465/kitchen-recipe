"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login, register, forgotPassword, resetPassword } from "@/lib/actions/account";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormStatus, FieldError } from "@/components/ui/FormStatus";

function Pw({ name = "password", label = "Password", auto = "current-password" }: { name?: string; label?: string; auto?: string }) {
  const [show, setShow] = useState(false);
  return (<div><label className="label" htmlFor={name}>{label}</label><div className="relative"><input id={name} name={name} type={show ? "text" : "password"} required autoComplete={auto} className="input pr-11" />
    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted hover:text-ink">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></div>);
}
function Shell({ title, sub, children }: { title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (<div className="container-site py-12"><div className="mx-auto max-w-md"><h1 className="text-center text-[34px] font-extrabold">{title}</h1>{sub && <p className="mt-2 text-center text-[17px] text-muted">{sub}</p>}<div className="mt-8 rounded-xl border border-rule p-6 shadow-card sm:p-8">{children}</div></div></div>);
}
export function LoginForm({ next, reason }: { next?: string; reason?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <Shell title="Log In" sub={reason === "save" ? "Log in to save recipes to My Recipes." : <>New here? <Link className="link" href={`/account/register/${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create a free account</Link></>}>
      <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4"><input type="hidden" name="next" value={next || ""} /><FormStatus state={state} />
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} key={state?.values?.email} className="input" /></div>
        <Pw /><div className="text-right"><Link href="/account/forgot-password/" className="text-[15px] font-semibold text-brand hover:underline">Forgot password?</Link></div>
        <SubmitButton className="w-full" pendingText="Logging in…">Log In</SubmitButton></form>
      {reason === "save" && <p className="mt-5 text-center text-[15px]">Don&apos;t have an account? <Link className="link" href={`/account/register/?next=${encodeURIComponent(next || "")}`}>Sign up free</Link></p>}
    </Shell>
  );
}
export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(register, null);
  return (
    <Shell title="Join Simmerly" sub={<>Already a member? <Link className="link" href="/account/login/">Log in</Link></>}>
      <ul className="mb-6 space-y-1 text-[15px] text-body">{["Save recipes and build collections", "Rate, review and share photos", "Submit your own recipes"].map((t) => <li key={t} className="flex gap-2"><span className="text-brand">✓</span>{t}</li>)}</ul>
      <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4" noValidate><input type="hidden" name="next" value={next || ""} /><FormStatus state={state} />
        <div><label className="label" htmlFor="name">Display name</label><input id="name" name="name" required autoComplete="name" defaultValue={state?.values?.name} className="input" /><FieldError state={state} name="name" /></div>
        <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" defaultValue={state?.values?.email} className="input" /><FieldError state={state} name="email" /></div>
        <div><Pw auto="new-password" /><p className="mt-1 text-[13px] text-muted">8+ characters with at least one letter and one number.</p><FieldError state={state} name="password" /></div>
        <label className="flex items-start gap-2 text-[15px]"><input type="checkbox" name="newsletter" className="mt-1 h-4 w-4 accent-brand" defaultChecked />Send me the Daily Dish newsletter</label>
        <label className="flex items-start gap-2 text-[15px]"><input type="checkbox" name="terms" className="mt-1 h-4 w-4 accent-brand" />I agree to the <Link href="/terms-of-service/" className="link" target="_blank">Terms</Link> and <Link href="/privacy-policy/" className="link" target="_blank">Privacy Policy</Link></label><FieldError state={state} name="terms" />
        <SubmitButton className="w-full" pendingText="Creating account…">Create Account</SubmitButton></form>
    </Shell>
  );
}
export function ForgotForm() {
  const [state, action] = useActionState(forgotPassword, null);
  return (
    <Shell title="Forgot Password?" sub="Enter your email and we'll send you a link to reset your password.">
      {state?.ok ? <><FormStatus state={state} /><Link href="/account/login/" className="btn-outline mt-5 w-full">Back to Log In</Link></> : (
        <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4"><FormStatus state={state} /><div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
          <SubmitButton className="w-full" pendingText="Sending…">Send Reset Link</SubmitButton><p className="text-center text-[15px]"><Link href="/account/login/" className="link">Back to Log In</Link></p></form>)}
    </Shell>
  );
}
export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  if (!token) return <Shell title="Invalid link"><p>This reset link is missing its token. <Link href="/account/forgot-password/" className="link">Request a new link</Link>.</p></Shell>;
  return (
    <Shell title="Choose a New Password">
      <form action={action} onReset={(e) => e.preventDefault()} className="space-y-4"><input type="hidden" name="token" value={token} /><FormStatus state={state} />
        <Pw label="New password" auto="new-password" /><Pw name="confirm" label="Confirm new password" auto="new-password" />
        <SubmitButton className="w-full" pendingText="Saving…">Reset Password</SubmitButton></form>
    </Shell>
  );
}

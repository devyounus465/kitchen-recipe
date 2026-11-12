import Link from "next/link";
import { Heart, Folder, Activity, PlusCircle, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
const ITEMS = [["/account/my-recipes/", "Saved Recipes", Heart, "saved"], ["/account/my-recipes/?tab=collections", "Collections", Folder, "collections"], ["/account/activity/", "Activity & Submissions", Activity, "activity"], ["/account/submit-recipe/", "Submit a Recipe", PlusCircle, "submit"], ["/account/settings/", "Account Settings", Settings, "settings"]] as const;
export function AccountShell({ active, user, children, title }: { active: string; user: { name: string; username: string }; children: React.ReactNode; title: string }) {
  return (
    <div className="container-site pt-8">
      <div className="mb-6 flex items-center justify-between border-b-2 border-ink pb-4"><h1 className="text-[32px] font-extrabold md:text-[40px]">{title}</h1>
        <Link href={`/cook/${user.username}/`} className="hidden items-center gap-1.5 text-[14px] font-bold uppercase tracking-[0.06em] text-brand hover:underline sm:flex"><User className="h-4 w-4" />View public profile</Link></div>
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:block lg:space-y-1 lg:px-0">
          {ITEMS.map(([href, label, Icon, key]) => (
            <Link key={key} href={href} aria-current={active === key ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-[15px] font-semibold transition", active === key ? "bg-ink text-white" : "text-ink hover:bg-tint")}><Icon className="h-[18px] w-[18px]" />{label}</Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

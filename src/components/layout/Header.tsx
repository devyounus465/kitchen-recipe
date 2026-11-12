import { navTree } from "@/lib/queries";
import { getUser, isStaffRole } from "@/lib/auth";
import { categoryUrl } from "@/lib/utils";
import { STATIC_NAV, type NavItem } from "./nav";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const [tree, user] = await Promise.all([navTree(), getUser()]);
  const items: NavItem[] = [
    ...tree.map((p) => ({ label: p.name, href: categoryUrl(p), children: p.children.map((c) => ({ label: c.name, href: categoryUrl(c) })), feature: { label: `View All ${p.name}`, href: categoryUrl(p) } })),
    ...STATIC_NAV,
  ];
  return <HeaderClient items={items} user={user ? { name: user.name, username: user.username, staff: isStaffRole(user.role) } : null} />;
}

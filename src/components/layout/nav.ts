export type NavItem = { label: string; href: string; children: { label: string; href: string }[]; feature?: { label: string; href: string } };
export const STATIC_NAV: NavItem[] = [
  { label: "Kitchen Tips", href: "/kitchen-tips/", children: [
    { label: "Cooking Guides", href: "/kitchen-tips/" }, { label: "How-Tos", href: "/kitchen-tips/" }, { label: "All Articles", href: "/articles/" }, { label: "Videos", href: "/videos/" } ] },
  { label: "News", href: "/news/", children: [{ label: "Food News & Trends", href: "/news/" }, { label: "Community Spotlight", href: "/news/" }] },
  { label: "Features", href: "/collections/", children: [
    { label: "Recipe Collections", href: "/collections/" }, { label: "Videos", href: "/videos/" }, { label: "Top-Rated Recipes", href: "/search/?sort=rating" }, { label: "Newest Recipes", href: "/search/?sort=newest" } ] },
  { label: "About Us", href: "/about-us/", children: [
    { label: "About Simmerly", href: "/about-us/" }, { label: "Contact Us", href: "/contact/" }, { label: "Submit a Recipe", href: "/account/submit-recipe/" }, { label: "Our Editors", href: "/about-us/#editors" } ] },
];

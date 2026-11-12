import { articleList } from "@/lib/queries";
import { ArticleHub } from "@/components/editorial/ArticleCard";
export const metadata = { title: "Kitchen Tips & Cooking Guides", description: "Cooking techniques, how-tos and kitchen tips from our test kitchen." };
export default async function Page() { return <ArticleHub title="Kitchen Tips" intro="Cooking techniques, how-tos and smart shortcuts from our test kitchen." list={await articleList("guide", 50)} />; }

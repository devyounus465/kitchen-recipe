import { articleList } from "@/lib/queries";
import { ArticleHub } from "@/components/editorial/ArticleCard";
export const metadata = { title: "Food News & Trends", description: "The latest food news, trends and community stories." };
export default async function Page() { return <ArticleHub title="News" intro="Food news, trends and stories from our community." list={await articleList("news", 50)} />; }

import { articleList } from "@/lib/queries";
import { ArticleHub } from "@/components/editorial/ArticleCard";
export const metadata = { title: "Articles", description: "Features, round-ups and stories from the Simmerly editors." };
export default async function Page() { return <ArticleHub title="Features & Articles" intro="Round-ups, features and stories from our editors." list={await articleList(undefined, 60)} />; }

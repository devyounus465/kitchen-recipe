import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
export async function refreshRecipeStats(recipeId: number) {
  await db.execute(sql`UPDATE recipes SET
    rating_avg = COALESCE((SELECT AVG(rating)::real FROM reviews WHERE recipe_id=${recipeId} AND status='approved'),0),
    rating_count = (SELECT count(*) FROM reviews WHERE recipe_id=${recipeId} AND status='approved'),
    review_count = (SELECT count(*) FROM reviews WHERE recipe_id=${recipeId} AND status='approved' AND body <> ''),
    photo_count = (SELECT count(*) FROM recipe_photos WHERE recipe_id=${recipeId} AND status='approved'),
    save_count = (SELECT count(*) FROM saved_recipes WHERE recipe_id=${recipeId})
    WHERE id=${recipeId}`);
}

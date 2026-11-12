import "./env";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
await sql.unsafe(`
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS search tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('english', coalesce(jsonb_path_query_array(ingredients, '$[*].item')::text,'')), 'B') ||
  setweight(to_tsvector('english', coalesce(cuisine,'') || ' ' || coalesce(description,'')), 'C')
) STORED;
CREATE INDEX IF NOT EXISTS recipes_search_idx ON recipes USING GIN (search);
CREATE INDEX IF NOT EXISTS recipes_title_trgm ON recipes USING GIN (title gin_trgm_ops);
CREATE UNIQUE INDEX IF NOT EXISTS collections_owner_slug ON collections (coalesce(user_id,0), slug);
`);
console.log("post-migrate: search index ready");
await sql.end();

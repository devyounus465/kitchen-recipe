# Simmerly — full-stack recipe platform (Allrecipes-style MVP)

Next.js 15 · React 19 · TypeScript · Tailwind · PostgreSQL 16 · Drizzle ORM

See **[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** for the brief → feature matrix, architecture, data model and milestones.

## Quick start (local)

```bash
cp .env.example .env              # set DATABASE_URL, AUTH_SECRET
npm install
npm run db:push                   # create tables + full-text search index
npm run db:seed                   # demo content (40 recipes, articles, users, reviews…)
npm run dev                       # http://localhost:3000
```

**Windows (Command Prompt):** use `copy .env.example .env` instead of `cp`. In PowerShell, `cp` works.
Requires a running PostgreSQL 16 whose credentials match `DATABASE_URL` in `.env`.

| Login | Email | Password |
|---|---|---|
| Admin (CMS) | admin@simmerly.test | Admin123! |
| Editor | maya-thornton@simmerly.test | Password123! |
| Community member | lindacooks@example.test | Password123! |

CMS: **/admin**.

## Scripts

| Command | What it does |
|---|---|
| `npm run db:push` | Apply schema (drizzle-kit) + search index/extension (`scripts/post-migrate.ts`) |
| `npm run db:seed` | Reset content tables and load demo data |
| `npm run db:reset` | Drop everything, push schema, seed |
| `npm run import -- file.json` | Bulk-import recipes/articles (see `scripts/sample-import.json`) |
| `npm run test:e2e` | Playwright end-to-end suite against a running server (`BASE_URL` env) |
| `scripts/backup.sh` / `scripts/restore.sh` | pg_dump + uploads archive with rotation / restore |

## Production deployment

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" >> .env
echo "AUTH_SECRET=$(openssl rand -hex 32)" >> .env
echo "SITE_URL=https://your-domain.com" >> .env
docker compose up -d --build
docker compose exec app npx drizzle-kit push --force && docker compose exec app npx tsx scripts/post-migrate.ts
```

Put Caddy or Nginx in front for TLS (app listens on 127.0.0.1:3000). Security headers are set in `next.config.mjs`;
session cookies are `httpOnly`, `SameSite=Lax` and `Secure` when `SITE_URL` is https. Schedule `scripts/backup.sh` via cron.

### Swappable adapters
- **Media storage** — `src/lib/storage.ts` (local disk → S3/R2)
- **Email** — `src/lib/email.ts` (outbox table → SMTP/Resend). Until configured, emails (incl. password resets) appear in **Admin → Email outbox**.
- **Search** — `searchRecipes()` in `src/lib/queries.ts` (Postgres FTS → Meilisearch/Typesense)
- **Rate limiting** — `src/lib/ratelimit.ts` (in-memory → Redis for multi-instance)

## Content & licensing
Demo recipes, articles and reviews are original text written for this project. Demo photos are hot-linked from
Unsplash (free licence) and should be replaced with client-approved assets. **No Allrecipes text, photos, video,
logo or trademarks are used** (brief §8). Seeded videos have thumbnails only — upload licensed MP4s or link
YouTube/Vimeo via Admin → Videos.

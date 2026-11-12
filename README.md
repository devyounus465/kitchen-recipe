# Simmerly — full-stack recipe platform (Allrecipes-style MVP)

Next.js 15 · React 19 · TypeScript · Tailwind · PostgreSQL 16 · Drizzle ORM

See **[docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md)** for the brief → feature matrix, architecture, data model and milestones.

## Easiest: one command (no PostgreSQL install needed)

Requires only **Node.js 20+**.

```bash
npm install
npm run local
```

This downloads a portable PostgreSQL via npm, starts it, creates the tables, loads demo
content on first run and opens the site at **http://localhost:3000**. Press `Ctrl+C` to stop.
Data is kept in `.pgdata/`. Delete that folder to start fresh. No `.env` file is needed.
(On Windows, use a normal, non-Administrator terminal.)

## Using PostgreSQL installed on your computer (guided)

```bash
npm install
npm run setup     # asks for your PostgreSQL password, creates DB + .env + tables + demo data
npm run dev       # http://localhost:3000
```

## Quick start with your own PostgreSQL (manual)

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

## Free hosting: Vercel + Neon

1. **Neon** (neon.tech): create a project, copy the **pooled** connection string.
2. From your computer, create tables + demo data in Neon:
   `set "DATABASE_URL=<neon url>"` then `npm run db:push` and `npm run db:seed`.
3. **Vercel** (vercel.com): Add New → Project → import this repo. Env vars:
   `DATABASE_URL` (Neon URL), `AUTH_SECRET` (32+ random chars), `SITE_URL` (your vercel.app URL).
4. Vercel → Storage → create a **Blob** store and connect it to the project (adds `BLOB_READ_WRITE_TOKEN`), then redeploy.

Notes: images are limited to 4MB on Vercel and videos use YouTube/Vimeo/MP4 links. Choose the same
region for Neon and Vercel functions. Vercel's free Hobby plan is for non-commercial use.

## Free demo link (share your local site)

```bash
npm run build && npm start                         # fast production server on :3000
cloudflared tunnel --url http://localhost:3000     # in a 2nd terminal → https://xxxx.trycloudflare.com
```
Install cloudflared on Windows with `winget install --id Cloudflare.cloudflared`. No account is needed.
The link works while your computer and both terminals stay on, and it changes on each restart.
Tunnel domains are pre-allowed for form submissions in `next.config.mjs` (extend with `ALLOWED_ORIGINS`).

## Production deployment (VPS, e.g. Hostinger)

Docker Compose runs PostgreSQL + app + Caddy (automatic HTTPS). Full step-by-step guide:
**[docs/DEPLOY_HOSTINGER.md](docs/DEPLOY_HOSTINGER.md)**.

```bash
cp deploy/env.example .env   # DOMAIN, POSTGRES_PASSWORD, AUTH_SECRET
docker compose up -d --build
docker compose exec app npm run db:push
```

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

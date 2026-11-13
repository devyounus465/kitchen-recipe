# Proposal — Allrecipes-style recipe platform (MVP)

> Draft for the freelancer to complete. Items in **[brackets]** are for you to fill in (prices,
> experience, links). Everything else describes what is already built in this repository.

## 1. Proposed technology stack
Next.js 15 + React 19 + TypeScript (frontend, server rendering, API) · PostgreSQL 16 + Drizzle ORM ·
Tailwind CSS · built-in CMS/admin at `/admin` · Docker + Caddy (automatic HTTPS) on a VPS ·
SMTP email · Postgres full-text search. Details: `docs/PROJECT_PLAN.md` §3.

## 2. Experience
**[Your experience with recipe, editorial or community websites.]**

## 3. MVP page and feature inventory
All 33 items of brief §2 plus §3–§8, mapped one-to-one in `docs/PROJECT_PLAN.md` §1:
- **Main site (17):** homepage, navigation and dropdowns, category pages, search and filters, recipe pages,
  related recipes, collections, articles, guides, video listing and video pages, author profiles,
  About/Contact/Privacy/Terms, 404/error pages.
- **Accounts (8):** registration, login/logout, password recovery, profile, settings, MyRecipes,
  personal collections, activity history.
- **Community (8):** ratings, reviews, user photos, review sorting, recipe submission and editing,
  moderation, contributor attribution.
- **Admin/CMS:** recipes, categories, collections, articles, videos, media, bulk import, users and
  authors, moderation, reviews, photos, homepage, pages/SEO, redirects, messages, settings.

## 4. What is included
Source code and ownership transfer · database schema and migrations · CMS · demo content · bulk
importer · automated test suites (functional, security) · Docker deployment with HTTPS · daily backups
· private staging (password-protected) · documentation (README, deployment guide, security overview,
test report) · production deployment after written approval.

**Not included (future phase):** see `docs/PROJECT_PLAN.md` §8.

## 5. Fixed itemized price
| Item | Price |
|---|---|
| Milestone 1: research, design audit, architecture | **[ ]** |
| Milestone 2: UI/UX and responsive frontend | **[ ]** |
| Milestone 3: backend, CMS, accounts, search, reviews | **[ ]** |
| Milestone 4: content integration (see §8) | **[ ]** |
| Milestone 5: testing, visual comparison, fixes | **[ ]** |
| Milestone 6: deployment, handover, documentation | **[ ]** |
| **Total** | **[ ]** |

## 6. Estimated timeline
| Milestone | Duration (estimate) |
|---|---|
| 1. Research and design audit | **[1 week]** |
| 2. UI/UX and frontend | **[2–3 weeks]** |
| 3. Backend and CMS | **[2–3 weeks]** |
| 4. Content integration | **[1–2 weeks, depends on content readiness]** |
| 5. Testing and baseline approval | **[1–2 weeks]** |
| 6. Final delivery | **[up to 1 week]** |

## 7. Hosting, infrastructure and third-party costs (recurring)
| Service | Purpose | Cost |
|---|---|---|
| VPS (e.g. Hostinger KVM 1 or KVM 2) | App, database, HTTPS | **[current plan price/month]** |
| Domain name | Website address | **[per year]** |
| Email mailbox / SMTP (e.g. Hostinger email) | Password resets, notifications | **[per month, often bundled]** |
| Off-site backup storage (optional) | Copies of daily backups | **[per month]** |
| Licensed photography/video (optional) | Content, if not supplied by the client | **[per asset or subscription]** |

No paid software licences are required: all components are open source.

## 8. Initial content and import pricing
Proposed launch quantity: **[e.g. 150 recipes, 20 articles/guides, 10 videos, ~40 categories]**.
| Item | Unit price | Quantity | Total |
|---|---|---|---|
| Recipe import (supplied text + photos, checked and categorised) | **[ ]** | **[ ]** | **[ ]** |
| Article/guide import | **[ ]** | **[ ]** | **[ ]** |
| Video setup | **[ ]** | **[ ]** | **[ ]** |
Content must be supplied by the client or properly licensed (brief §8).

## 9. Maintenance and support
**[Monthly retainer or hourly rate: security updates, backups check, minor fixes, response time.]**

## 10. Portfolio
**[Links to previous projects.]**

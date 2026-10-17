# ASK ERP specifics (mkt.dayso.vn landings)

## Contents
1. File map
2. Registering a theme (4 edits)
3. Content JSON
4. Dev test loop
5. Deploy to production
6. Apply content to the production page
7. Incidents & rules learned the hard way

---

## 1. File map (ERP monorepo; local `~/Developer/ASK/erp`, server `$APP_DIR`)

Set once per machine: `export HOST=root@<vps> APP_DIR=/path/to/ask-erp`.

| What | Path |
|---|---|
| Theme components | `apps/web/src/pages/marketing/themes/<Name>Landing.tsx` |
| Shared effects | `apps/web/src/pages/marketing/themes/fx.tsx`, `reveal.ts` |
| Theme dispatch + favicon swap | `apps/web/src/pages/marketing/LandingView.tsx` (`useCourseFavicon(iconUrl‖logoUrl)`) |
| Editor (theme select, logo/icon fields) | `apps/web/src/pages/marketing/Pages.tsx` |
| Types (`PageContent`, theme union) | `apps/web/src/lib/marketing.ts` |
| API whitelist (`LANDING_THEMES`, `cleanPageContent`, `cleanExtra` ≤60KB) | `apps/api/src/modules/marketing/marketing.module.ts` |
| Public landing API | `GET /api/public/lp/:slug` (`marketing-public.ts`) → `{content, course{price,listPrice,durationDays,classes[],sections[]}}` |
| Fonts | `<link>` in `apps/web/mkt.html` and `apps/web/index.html` |
| Static assets | `apps/web/public/landing/<dir>/…` → served at `/landing/<dir>/…` |
| Content JSON per page | `docs/landing/<slug>.json` (+ approved drafts `docs/landing/landing-14-khoa.{md,json}`) |
| Learner site (hoc.dayso.vn) | `apps/khoahoc` — built separately (see §5) |

Public page URL: `https://mkt.dayso.vn/p/<slug>`.

## 2. Registering a theme

1. `marketing.module.ts`: add the key to `LANDING_THEMES`.
2. `lib/marketing.ts`: add the key to the `theme?:` union.
3. `LandingView.tsx`: `import { XLanding } from './themes/XLanding';` and `if (props.content.theme === 'x') return <XLanding {...props} org={org} />;`
4. `Pages.tsx`: add `{ value: 'x', label: t('Tên khóa — mô tả giao diện') }` to the theme Select options.

Component props are the same for every theme: `{ content, course, org, onSubmit, submitting, done, error, preview }`. `preview` = editor preview (no intro, no cursor, form doesn't submit). Keep the honeypot input (`name="website"`) and consent checkbox in the form.

Typecheck: `cd apps/web && npx tsc --noEmit -p .` and `cd apps/api && npx tsc --noEmit -p .`.

## 3. Content JSON

See `assets/example-content.json`. Standard fields: `theme, logoUrl, iconUrl, headline, subheadline, ctaLabel, painPoints[], bullets[], curriculum[{title,lessons[]}], faq[{q,a}], testimonials[{name,role,quote,photo}]`. Theme-specific data goes in `extra` (kicker, tagline, story, audience[{t,d}], facts[[label,value]], bigWords[], closing, speaker{name,title,photo,credentials[]}, stats[[value,label]], contact{hotline,email}, plus anything the theme needs: `cycle`, `channels`, `ticker`, `disclaimer`, `cover`, `quote`, `pages`…). `logoUrl`/`iconUrl`/testimonial `photo` accept `https://` or `/path`.

Speaker/stats/contact blocks are shared — copy them from an existing JSON rather than retyping.

## 4. Dev test loop

- Ports: API `4010`, web Vite `5190` (learner site `5292`). **Check they are free first** (`lsof -iTCP:<port> -sTCP:LISTEN`); the owner asked not to collide with other services.
- DB: local Postgres container `ask-erp-postgres` on `5440` from `erp/docker-compose.yml` (`docker compose up -d` in `erp/`). It may be stopped/removed by other agents — bring it up, don't recreate or wipe it. **Never reset/reseed it without asking.**
- Start API: `cd apps/api && npx nest build && PORT=4010 node dist/main.js`; web: `cd apps/web && API_URL=http://localhost:4010 npx vite --port 5190 --strictPort`.
- Login: use a dev-only account you create for testing (bcrypt hash via `bcryptjs`); store its password in a scratch file, never in chat; delete test data afterwards.
- Create a demo page: `POST /api/marketing/pages/generate-courses {courseIds:[id], status:'PUBLISHED'}` then `PATCH /api/marketing/pages/:id {title, slug:'xx-demo', content:{...existing, ...json}}` (PATCH requires `title`). Open `http://localhost:5190/p/xx-demo`. Delete the demo page when done.
- If the course doesn't exist on dev, attach the demo to any course — only theme/content matter for visuals.
- Check at 1200–1280 desktop and 375 mobile; `sessionStorage.removeItem('<prefix>-intro')` to replay the intro.

## 5. Deploy to production (VPS (`$HOST`), `$APP_DIR`)

Other agents edit code **directly on the VPS**, so the server tree can be newer than git. Therefore:
1. For every file you will copy, compare the server copy with your base version (`git show HEAD:<f> | shasum` vs `ssh … shasum $APP_DIR/<f>`). If a server file differs, fetch it and merge your change into **the server version** — never overwrite it.
2. Copy only your own changed files (tar/scp), verify checksums on the server.
3. Rebuild: `ssh "$HOST" 'cd $APP_DIR/deploy && ./deploy.sh --skip-dns'` (builds api + web images; API runs pending Prisma migrations on start). Don't start a second deploy while one runs (`ps -eo cmd | grep '^bash ./deploy.sh'`). Docker Hub timeouts happen — retry.
4. Learner site `apps/khoahoc` is not built by deploy.sh: `cd $APP_DIR/apps/khoahoc && pnpm build && rsync -a dist/ /var/www/hoc.dayso.vn/`.
5. Static-only sites (e.g. `zoom.dayso.vn` from `apps/zoom-portal`) are rsynced to `/var/www/<domain>/`.
6. Verify: `curl https://mkt.dayso.vn/api/public/lp/<slug>` returns your theme; fetch changed assets and compare checksums.

## 6. Apply content to the production page

Content lives in the DB (`MktLandingPage.content`), so shipping code doesn't change the page. Back up first, then merge your JSON into the existing content by slug:
```bash
scripts/apply_content.sh <slug> docs/landing/<slug>.json      # prints theme, headline, course price/listPrice/days/classes after update
```
It runs a small Prisma script inside the `api` container (`docker compose exec -T api node -e …`), merging `{...old, ...new}`. It writes production data — run `deploy/backup.sh` first (the script does) and only for pages the owner asked to change.

## 7. Incidents & rules learned the hard way

- **2026-10-09 — dev DB wiped.** `prisma migrate diff --shadow-database-url <sed-edited DATABASE_URL>`: the sed didn't match (URL ends with `?schema=public`), so the "shadow" was the real DB and Prisma reset it. Rule: check migrations with read-only `prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code`; apply with `migrate deploy`; never pass a derived shadow URL.
- **2026-10-12 — production overwritten.** Another agent asked to "push the ASK ERP database cluster to the VPS" piped `pg_dump --clean` of the Mac dev DB into production → 2.5 days of data and all 14 landings gone. Restored from the nightly dump. Rule: **never move data from dev to production**; deploy code only. Diagnose suspicious production data by comparing row counts with `$APP_DIR/deploy/backups/ask_erp_<date>_2000.sql.gz` (nightly, 02:00 VN) and checking table file mtimes / stray schemas (`public_shadow`).
- Partial, additive restores (e.g. re-inserting only `MktLandingPage` rows from a dump into a temp table, `INSERT … WHERE NOT EXISTS`) are a safe first aid; full restores need the owner's explicit OK and may be blocked by the agent's safety layer — then give the owner the exact command to run.
- `/api/public/lp/:slug` 404 for all slugs = pages missing in DB, not a frontend bug.

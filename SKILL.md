---
name: course-landing-themes
description: Build a distinctive, high-"wow" sales landing page for one course, workshop or book — its own visual theme, motion effects, real logo, favicon and honest conversion copy — then test it and ship it. Built from the ASK Training work (mkt.dayso.vn, 14 themed course landings in the ASK ERP monorepo) but the method works for any React/Tailwind landing. Use this whenever the user asks to make, redo or upgrade a landing page for a course/khóa học/sách/event, says a page is "chưa đủ wow", wants "phong cách riêng" per course, wants the course logo/tab icon on a landing, wants landing images sharpened, or wants testimonials/cảm nhận học viên added to a landing — even if they don't say "skill" or "theme".
---

# Course landing themes

Each course gets its **own theme**: a concept drawn from the course's identity (its logo, name, promise), rendered as a single React component with signature effects nobody else's page has. The shared plumbing (form, price/class data, reveal-on-scroll, cursor, confetti) is reused; the look, metaphor and motion are not.

Why this works: a page that looks like the course's own world ("Trại Lãnh Đạo" = mountain + eagle, "Thức Giấc Ngủ Đông" = snow melting into spring) is memorable and feels premium; a generic template with swapped colours does not. The user judged earlier attempts "chưa đủ wow" until each page had a concept-specific centrepiece effect.

## Workflow (one course at a time)

1. **Collect the truth before designing.** Gather: official course copy (approved drafts first), the course's real logo/banner, real photos, price/list price/duration/classes from the system of record. Read `references/assets-pipeline.md` for where these come from and how to fetch them.
2. **Note every mismatch** between sources (days, list price, positioning, course list). Don't silently pick one for numbers that customers pay — use the system-of-record value on the page and list each mismatch in your final report so the owner can decide.
3. **Pick the concept.** One metaphor + palette + display font + 4–6 signature effects, derived from the logo and promise. Check the catalog in `references/design-playbook.md` so the new page doesn't repeat an existing theme's centrepiece.
4. **Prepare assets.** Extract a transparent logo from the banner, make a 128px square favicon, upscale small images. Commands are in `scripts/` (see `references/assets-pipeline.md`).
5. **Write the theme component** by copying the structure of `assets/themes/NetworkLanding.tsx` (sections: intro → sticky header → hero → pain → value → curriculum → big marquee → audience → pricing/classes → speaker → form → FAQ → footer → mobile sticky CTA) and reusing `assets/themes/fx.tsx` + `reveal.ts`. Replace the visuals and effects; keep the data contract and the form.
6. **Register the theme and write content JSON.** In ASK ERP that is four edits + one JSON file — see `references/ask-erp.md`. In another codebase, mirror the idea: a `theme` key on the page content selects the component; theme-specific data lives in `content.extra`.
7. **Test on dev at desktop (1200–1280px) and mobile (375px)**: intro plays once per session, every section reveals, no horizontal scroll (`scrollWidth === innerWidth`), no console errors, Vietnamese diacritics not clipped, prices/classes render from live data. Take screenshots of the centrepiece effects.
8. **Ship carefully** (production may be edited by other agents): verify shared files on the server are unchanged before copying, copy only your own files, rebuild, then apply the content JSON to the production page and re-check the public URL. See `references/ask-erp.md` → Deploy.
9. **Report back** in the user's language: link, concept + effects in plain words, data mismatches, anything labelled "minh họa", what is not verified.

## Non-negotiables (and why)

- **Never invent testimonials, results, guarantees, statistics or return rates.** Real people and money are involved; one fabricated claim destroys trust and may be illegal (education/finance advertising). Only use testimonials the owner supplies, and quote them as given. Drop claims like "lợi nhuận 15–20%/năm" even if a source page has them. Finance-related pages get a short "nội dung giáo dục, không phải khuyến nghị đầu tư" note.
- **Illustrative graphics must say so** — a growth tree, an inflation calculator, a mock dashboard: label it "minh họa" / "ví dụ" / "giả định" on the page.
- **Use the real logo**, extracted from official art. If none exists, set the name as a typographic wordmark and say so; don't draw a fake logo.
- **Don't alter real faces.** Upscale portraits with a general model only; face-restoration models (GFPGAN etc.) change identity — rejected for the speaker photo.
- **Respect `prefers-reduced-motion`** and keep cursor effects to fine pointers; mobile must stay fast and readable.
- **Production data is sacred.** Never sync a dev database to production, never run Prisma commands with a shadow/reset URL derived from `DATABASE_URL`, and back up before any production data write. Two real incidents (dev DB wiped; production overwritten by a Mac→VPS DB "sync") are described in `references/ask-erp.md`.

## Hard-won layout gotchas

These cost real iterations; check them on every theme:
- Vietnamese headings need `line-height ≥ 1.3` and a little `padding-bottom` on gradient/clip text, otherwise stacked diacritics (ẩ, ỗ, ặ) touch or get cut.
- Don't reveal words with `overflow:hidden` masks — they clip diacritics. Use opacity/blur/translate instead. Put the space *outside* inline-block word spans or words glue together.
- `rotate` animations combined with Tailwind translate-centering orbit off-centre; centre with negative margins or a zero-size wrapper whose pivot is the point.
- Root element gets `overflow-x: clip` (not `hidden`) so slide-in effects don't create horizontal scroll and sticky still works.
- Circle avatars: give the ring `w-fit`, otherwise it stretches into an oval in a flex column.
- Screenshots from a hidden/background browser pane freeze `requestAnimationFrame`, scroll-progress and CSS transitions — the page looks broken but isn't. Verify via DOM/computed style, or check `document.visibilityState`.
- Intros: once per session (`sessionStorage`), skippable by reduced motion, never longer than ~3s.

## References

- `references/design-playbook.md` — concept recipes, catalog of the 14 existing themes and their centrepiece effects, reusable effect list, copy structure (incl. Martin Conroy sales-letter variant).
- `references/assets-pipeline.md` — sourcing (Haravan `.js` product JSON), logo extraction, favicon, Real-ESRGAN upscaling, portrait centring.
- `references/ask-erp.md` — ASK ERP file map, theme registration, content JSON schema, dev test loop, deploy & production-apply procedure, incident lessons.
- `scripts/` — `haravan_product.py`, `extract_logo.sh`, `upscale.sh`, `favicon.sh`, `apply_content.sh`.
- `assets/themes/` — `fx.tsx` (shared effects), `reveal.ts`, `NetworkLanding.tsx` (a complete theme to copy); `assets/example-content.json` (a complete content JSON).

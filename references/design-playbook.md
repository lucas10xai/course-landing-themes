# Design playbook

## Contents
1. Choosing the concept
2. Catalog of existing themes (don't repeat a centrepiece)
3. Reusable effect library
4. Page structure & copy
5. Quality bar ("đủ wow" checklist)

---

## 1. Choosing the concept

Start from three inputs and let them decide everything else:

| Input | Gives you |
|---|---|
| The course logo / banner art | palette (sample its 2–3 dominant colours), display-font feel (condensed? serif? rounded?), iconography |
| The course name & promise | the metaphor (sân khấu → stage lights; đầu tư → trading floor; ngủ đông → winter→spring; hệ thống A-Z → network/replication) |
| The audience & price | tone: premium/serious (dark, restrained motion) vs energetic (neon, confetti) |

Then write a one-line concept before coding, e.g. *"Sàn giao dịch: nền xanh đêm, nến tăng giảm, bảng điện đỏ lật xanh, chữ Oswald"*. Pick **one centrepiece effect** that only makes sense for this course (the dart hitting the bullseye, the brick wall shattering, the book flipping its pages) plus 3–5 supporting effects. A centrepiece tied to the metaphor is what produces the "wow"; generic particles alone do not.

Fonts used so far (all Vietnamese-capable Google Fonts, loaded in the host HTML): Montserrat 800/900, Oswald 500–700, Anton, Playfair Display, Lora, Dancing Script, Be Vietnam Pro (body). Add the family to the page's `<link>` if you use a new one, and verify diacritics render.

## 2. Catalog of existing ASK themes

| theme key | course | concept & palette | centrepiece / signature effects |
|---|---|---|---|
| default | (fallback) | ASK stage, dark + gold/red | long-form sales page |
| wakeup | WAKE UP | green + rising sun | sunrise intro, rotating ray ring, "trước/sau" strike-through cards swept by sunlight, scroll counters |
| sales | Sales Mastery | electric navy + cyan, orange arrow | curtain intro, 3D poster hero, scroll-scrubbed growth charts, Martin Conroy sales letter with highlighted phrases + P.S., fork chart, velocity marquee, confetti |
| trainer | Chuyên Gia Đào Tạo | fire stage, Playfair | velvet curtains + spotlights + flame, bulb-lit marquee border, iris photo reveal, film-strip gallery, ticket pricing, testimonials with fire-ring avatars |
| breakthrough | Trường Kinh Doanh Đột Phá | purple/gold bullseye, Montserrat | dart flying into bullseye, pinned brick wall shattering on scroll, 3D card carousel |
| leadership | Trại Lãnh Đạo Cấp Cao | red/gold, mountain + eagle | scroll climb path with base camps, summit, stamp seal |
| stage | Triệu Phú Sân Khấu | concert neon pink/purple/blue | lasers, crowd silhouettes, money rain, slot-machine price, applause meter, backstage-pass cards, LED screen, rotating-neon testimonial cards |
| phoenix | Phượng Hoàng Tái Sinh | ash → fire | embers rising, ash to flame rebirth transition |
| leap | Combo Bước Nhảy Vọt | lime/forest | balance scale, orbiting course chips (pivot via zero-size wrapper) |
| digital | DIGIBIZ | orange–pink digital | funnel animation, phone notifications and AI chat labelled "minh họa/ví dụ" |
| ikigai | VIKIGAI | washi paper, ink, red seal, Lora | 4-circle Ikigai diagram; typographic wordmark (no official logo exists) |
| network | Kinh Doanh Hệ Thống A-Z | navy + gold, Montserrat | A→Z split-flap intro, canvas node network growing around logo, replication tree 1→3→9→27 ("minh họa"), broken chain links reconnecting, A→Z road, departure-board price |
| invest | Nhà Đầu Tư Thông Thái | trading floor, Oswald | candlestick intro, live-looking candle canvas, ticker tape, red→green board flip, inflation calculator ("giả định"), pinned economic-cycle wave, portfolio donut assembling, candle-ladder curriculum, odometer price, education-only disclaimer |
| startup | Sách Cẩm Nang Khởi Nghiệp | yellow/black, Anton, blueprint grid | cover-opening intro, CSS 3D book following the mouse, rocket launching on scroll, hazard-tape "cạm bẫy" cards, isometric bars, pinned flip-book turning pages on scroll, swinging price tag |
| winter | Sách Thức Giấc Ngủ Đông | snow → spring, Playfair/Lora | night-snow intro with sprout, page-wide snow that turns into leaves as you scroll, background warming, frosted 3D book, ice cards cracking & melting, growing plant, sun rising along the journey |

The full code of every theme lives in the ASK ERP repo at `apps/web/src/pages/marketing/themes/`. Read the closest one before writing a new theme — copying a proven section is faster than reinventing it.

## 3. Reusable effect library

From `assets/themes/fx.tsx` (import, don't copy-paste):
- `Cursor({ring, dot})` — glowing ring + dot, grows over interactive elements (fine pointer only)
- `Mag` — magnetic button wrapper
- `Tilt({max})` — 3D tilt card with glare
- `BigMarquee({words, fills, stroke, sep})` — two giant word rows, speed/skew follow scroll velocity
- `Confetti({fire, colors})` — burst on successful registration
- `useScrollProgress(cb, start, end)` — 0→1 progress of an element through the viewport (drive any scrubbed animation; for a pinned section use a tall wrapper + `sticky` child and `start=0,end=1`)
- `CountUp({value})` — "200.000+" counts up when visible
- `reduced()`, `finePointer()`, `clamp01()`, `FX_CSS`

From `reveal.ts`: `useScrollReveal(attr, cls)` — scroll-event based reveal (IntersectionObserver was unreliable in this setup). Mark elements with `data-xx` and give them an initial class (`xx-up`, `xx-left`…).

Patterns that worked as centrepieces (reuse the technique, change the metaphor):
- **Canvas field** (nodes, candles, snow/leaves, embers) with `requestAnimationFrame`, paused when off-screen, density lowered on mobile.
- **Pinned scroll scene**: section `height: 250vh`, inner `sticky top-16 h-[calc(100vh-4rem)]`, progress drives SVG path dashoffset / positions / page flips.
- **SVG path drawing** with `pathLength={1} strokeDasharray="1" strokeDashoffset={1-p}`.
- **Flip/rotate cards** (split-flap letters, departure board digits, odometer columns, board rows flipping colour).
- **CSS 3D objects** (book with cover/spine/page-edge faces, `preserve-3d`, rotate with mouse).
- **State-change on scroll** (red→green, broken→linked, ice→melted, frozen→sprouting): each item flips when progress passes its index — maps the customer's pain to resolution.
- **Typographic intro** once per session (split-flap A→Z, curtain, candles, cover opening, snow) ≤ 3s, then slide away.

## 4. Page structure & copy

Section order that converts (keep it unless the concept demands otherwise):
intro → sticky header (logo + ASK mark, nav, hotline, CTA) → hero (logo big, headline, sub, CTA + price, next class) → pain points → story/why → benefits (bullets) → curriculum (LMS lessons if the course has them, else `content.curriculum`) → big marquee → audience → testimonials (only real ones) → pricing + upcoming classes (live data, "Giữ chỗ" preselects class in form) → speaker → registration form → FAQ → footer (+ disclaimer if any) → mobile sticky CTA bar.

Copy rules:
- Pull headline/sub/pain/bullets from the **approved** content draft; if the official store page has richer modules (e.g. 5 investment modules), restructure the curriculum from it.
- Keep claims sourced. Speaker credentials reused across pages must be the same approved list.
- CTA label matches the product: "Đăng ký tư vấn" for courses, "Đặt mua sách" for books.
- Martin Conroy sales-letter variant (used on Sales Mastery): a short parable (two similar people, different outcomes because of what they learned), marked key phrases, signature, P.S. with the offer. Use only when the owner asks for long-form persuasive copy.

## 5. "Đủ wow" checklist

- [ ] Concept is obvious within 3 seconds of landing (intro + hero centrepiece).
- [ ] At least one scroll-driven scene that only makes sense for this course.
- [ ] Every section has motion on reveal; buttons have shine/magnet; cursor on desktop.
- [ ] Real logo crisp on retina (≥2× display width), favicon is the course mark.
- [ ] Mobile: no horizontal scroll, sticky CTA visible, effects lighter but present.
- [ ] Reduced-motion users get a calm, complete page.
- [ ] Nothing fabricated; every illustration labelled.

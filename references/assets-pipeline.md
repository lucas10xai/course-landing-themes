# Assets pipeline: content, logos, favicons, sharp images

Tools: ImageMagick 7 (`magick`), Python 3, optional Real-ESRGAN (local at `~/Developer/Real-ESRGAN` on the ASK Mac: `./run.sh` wraps `venv/bin/python inference_realesrgan.py`, uses Apple MPS).

## 1. Sourcing the truth

Priority of sources for ASK courses:
1. **Approved content draft** — `erp/docs/landing/landing-14-khoa.{md,json}` (owner-approved copy: pain points, bullets, sections, curriculum).
2. **Official store page** ask.com.vn (Haravan). Product JSON: `https://ask.com.vn/products/<handle>.js` → title, `price`/`compare_at_price` (**×100**, divide by 100), `images[]`, `description` HTML. Use `scripts/haravan_product.py <handle>`. Plain product URLs sometimes 404 — try handle variants (`khoa-hoc-…`, without `sach-`, etc.).
3. **System of record (ERP)** — price, listPrice, durationDays, upcoming classes, LMS sections. The public landing shows these live; content JSON must not hard-code prices.
4. Earlier official sites (e.g. wakeup.vn) for event-style courses.

Record mismatches (days, list price, course list in combos, positioning) in your report. Known recurring ones for ASK: ask.com.vn day count and list price often ≠ ERP.

Product images: `https://product.hstatic.net/<shop>/product/<file>.jpg` (also `_master`, `_grande`, `_1024x1024` variants; the bare URL is usually the largest).

## 2. Logo extraction (banner → transparent PNG/WebP)

Logos usually exist only inside a banner JPEG. Three masks cover all cases seen so far; choose by how the lettering is drawn, test on the theme's background colour, iterate.

**A. Bright/gold letters on dark or busy background** (luminance + gold detection):
```bash
scripts/extract_logo.sh luma banner.jpg 640x265+40+250 out.png
```
(core: `-fx` alpha = max(gold-pixel?1:0, low-saturation & lightness>0.72 ramp) then `-trim`).

**B. Letters with a white outline on a coloured background** (flood-fill outside the outline):
```bash
scripts/extract_logo.sh outline banner.jpg 640x200+50+160 out.png
```
White-outline mask → flood fill from the corner → everything not reached is the logo. Background streaks that touch the outline leak in; remove them with a "letter-colour mask dilated by ~5px" multiply (the script's `cleanup` step) or erase a polygon by hand (`-draw "polygon …"` on the alpha).

**C. Dark + coloured letters on a light background** (print covers): alpha = dark pixels (lightness ramp) OR saturated brand-colour pixels; erase small stray text (author lines) with a polygon on the alpha.

Always `-trim +repage`, check on dark AND light backgrounds (`magick out.png -background '#111' -flatten check.png`), then save WebP with `-quality 92 -define webp:alpha-quality=95`.

Remove tiny specks: `-morphology Open Disk:1 -define connected-components:area-threshold=400 -connected-components 8`.

## 3. Favicon (tab icon)

`scripts/favicon.sh logo.png "#fff6dc" out.png` → 128×128 rounded square, logo fitted to 116px on a background colour from the brand. Wire it via the page's `iconUrl` (falls back to `logoUrl`).

## 4. Sharpening low-res art (Real-ESRGAN)

Logos cut from 720px banners are 300–600px — blurry on retina. Book covers ~400px, speaker photos ~800px.

```bash
scripts/upscale.sh logo in_dir out_dir     # RealESRGAN_x4plus_anime_6B ×4, then alpha edge sharpen, cap 1400px
scripts/upscale.sh photo in_dir out_dir    # realesr-general-x4v3 ×2 (×4 if <1200px), cap 2200px, JPEG q84 progressive
```
- Anime model is best for flat graphics/logos/covers; general model for photos and screenshots (testimonial screenshots become fully legible).
- Alpha sharpening after upscale: `( +clone -alpha extract -blur 0x1.2 -level 30%,70% ) -compose CopyOpacity`.
- **Do not** use `--face_enhance` (GFPGAN) on real people — it changes faces. Plain upscale only.
- Keep file paths identical so pages update without code changes; server sends `Cache-Control: no-cache` for `/landing/*`.

## 5. Testimonial portraits from a screenshot

When the owner sends a screenshot of testimonial cards and no originals exist: crop each circle's inner square (avoid the ring), upscale ×4 with the general model, then **re-centre the face**: crop a square so the face is horizontally centred and the eyes sit around 40–42% of the height, resize to 400×400. If the source is cut at the top of the head, accept a tighter crop rather than inventing pixels. Preview inside a circle mask with crosshairs before shipping:
```bash
magick face.jpg -alpha set \( -size 400x400 xc:none -fill white -draw "circle 200,200 200,6" \) -compose DstIn -composite \
  -background '#1a0b06' -compose over -flatten -stroke red -draw "line 200,0 200,400 line 0,200 400,200" preview.png
```
(JPEGs need `-alpha set` before `DstIn`, otherwise the result is empty or inverted.)
Testimonial `photo` accepts `https://…` or a site path `/landing/testimonials/x.jpg`.

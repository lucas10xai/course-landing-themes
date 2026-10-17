#!/usr/bin/env python3
"""Fetch an ask.com.vn (Haravan) product as JSON and print title, prices (VND), images and description text.
Usage: haravan_product.py <handle> [--shop https://ask.com.vn] [--json]
Haravan stores prices ×100 — this script divides by 100."""
import argparse, html, json, re, sys, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('handle'); ap.add_argument('--shop', default='https://ask.com.vn'); ap.add_argument('--json', action='store_true')
a = ap.parse_args()
url = f"{a.shop.rstrip('/')}/products/{a.handle}.js"
try:
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20) as r:
        d = json.load(r)
except Exception as e:
    sys.exit(f"Không lấy được {url}: {e} — thử handle khác (khoa-hoc-…, bỏ sach-…)")
text = html.unescape(re.sub(r'<[^>]+>', '\n', d.get('description') or ''))
lines = [l.strip() for l in text.split('\n') if l.strip()]
out = {
    'title': d.get('title'), 'price': (d.get('price') or 0) / 100, 'compare_at_price': (d.get('compare_at_price') or 0) / 100,
    'images': [i if isinstance(i, str) else i.get('src') for i in d.get('images', [])],
    'embedded_images': re.findall(r'src="([^"]+)"', d.get('description') or ''),
    'description_lines': lines,
}
if a.json: print(json.dumps(out, ensure_ascii=False, indent=1))
else:
    print(f"{out['title']}\nGiá: {out['price']:,.0f}đ  Giá gốc: {out['compare_at_price']:,.0f}đ".replace(',', '.'))
    print('Ảnh:', *(['https:' + i if i.startswith('//') else i for i in out['images']]), sep='\n  ')
    print('--- Mô tả ---'); print('\n'.join(lines) or '(trống)')

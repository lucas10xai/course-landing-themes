#!/usr/bin/env bash
# Tách logo nền trong suốt từ ảnh banner.
#   extract_logo.sh luma    banner.jpg WxH+X+Y out.png   # chữ sáng / vàng kim trên nền tối hoặc rối
#   extract_logo.sh outline banner.jpg WxH+X+Y out.png   # chữ có viền trắng trên nền màu (flood-fill phía ngoài viền)
#   extract_logo.sh cleanup in.png out.png [px=5]        # chỉ giữ vùng quanh màu chữ đậm (xóa vệt nền lọt vào), dùng sau 'outline'
# Kiểm tra: magick out.png -background '#111' -flatten check.png  (và trên nền sáng)
set -euo pipefail
mode=$1
if [ "$mode" = cleanup ]; then OUT=$3; else OUT=${4:-}; fi
case "$mode" in
  luma)
    magick "$2" -crop "$3" +repage -alpha set -channel A -fx 'mx=max(max(r,g),b); mn=min(min(r,g),b); lt=(mx+mn)/2; sat=mx-mn; gd=(r>0.55 && r>b+0.2 && g>b+0.08)?1:0; wh=(sat<0.18)?min(1,max(0,(lt-0.72)/0.12)):0; max(gd,wh)' +channel \
      -trim +repage "$4" ;;
  outline)
    t=$(mktemp -d); magick "$2" -crop "$3" +repage "$t/src.png"
    magick "$t/src.png" -fx 'mn=min(min(r,g),b); (mn>0.78)?1:0' "$t/w.png"
    magick "$t/w.png" -bordercolor black -border 2 -fill red -draw 'color 0,0 floodfill' -shave 2x2 -fx '(r>0.9 && g<0.1)?0:1' "$t/mask.png"
    magick "$t/src.png" "$t/mask.png" -alpha off -compose CopyOpacity -composite -trim +repage "$4"; rm -rf "$t" ;;
  cleanup)
    px=${4:-5}; t=$(mktemp -d)
    magick "$2" -alpha off -fx 'mx=max(max(r,g),b); mn=min(min(r,g),b); lt=(mx+mn)/2; sat=mx-mn; (lt<0.55 && sat>0.15)?1:0' -morphology Open Disk:1 -morphology Dilate Disk:$px "$t/keep.png"
    magick "$2" -alpha extract "$t/a.png"
    magick "$t/a.png" "$t/keep.png" -compose Multiply -composite "$t/a2.png"
    magick "$2" -alpha off "$t/a2.png" -compose CopyOpacity -composite -trim +repage "$3"; rm -rf "$t" ;;
  *) echo "mode: luma | outline | cleanup"; exit 1 ;;
esac
echo "✓ $OUT $(magick identify -format '%wx%h' "$OUT")"

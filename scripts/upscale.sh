#!/usr/bin/env bash
# Làm nét ảnh bằng Real-ESRGAN rồi chuẩn hóa kích thước.
#   upscale.sh logo  in_dir out_dir   # anime_6B ×4, làm sắc mép alpha, tối đa 1400px, PNG
#   upscale.sh photo in_dir out_dir   # general-x4v3 (×2 nếu ≥1200px, ×4 nếu nhỏ hơn), tối đa 2200px, JPEG q84
# Biến môi trường REALESRGAN=đường dẫn repo (mặc định ~/Developer/Real-ESRGAN, cần ./run.sh hoặc venv).
# KHÔNG dùng --face_enhance cho ảnh người thật (GFPGAN làm đổi khuôn mặt).
set -euo pipefail
mode=$1; in=$(cd "$2" && pwd); mkdir -p "$3"; out=$(cd "$3" && pwd); R=${REALESRGAN:-$HOME/Developer/Real-ESRGAN}
run(){ if [ -x "$R/run.sh" ]; then (cd "$R" && ./run.sh "$@"); else (cd "$R" && venv/bin/python inference_realesrgan.py "$@"); fi; }
t=$(mktemp -d)
if [ "$mode" = logo ]; then
  run -n RealESRGAN_x4plus_anime_6B -i "$in" -o "$t" --outscale 4 --ext png >/dev/null
  for f in "$t"/*_out.png; do n=$(basename "$f" _out.png)
    magick "$f" \( +clone -alpha extract -blur 0x1.2 -level 30%,70% \) -alpha off -compose CopyOpacity -composite -resize '1400x700>' -strip "$out/$n.png"; done
else
  mkdir -p "$t/big" "$t/small" "$t/o"
  for f in "$in"/*; do w=$(magick identify -format %w "$f"); if [ "$w" -ge 1200 ]; then cp "$f" "$t/big/"; else cp "$f" "$t/small/"; fi; done
  [ -n "$(ls "$t/small")" ] && run -n realesr-general-x4v3 -i "$t/small" -o "$t/o" --outscale 4 --ext jpg >/dev/null
  [ -n "$(ls "$t/big")" ] && run -n realesr-general-x4v3 -i "$t/big" -o "$t/o" --outscale 2 --ext jpg --tile 512 >/dev/null
  for f in "$t"/o/*_out.jpg; do n=$(basename "$f" _out.jpg)
    magick "$f" -resize '2200x1600>' -strip -interlace JPEG -sampling-factor 4:2:0 -quality 84 "$out/$n.jpg"; done
fi
rm -rf "$t"; ls -la "$out"

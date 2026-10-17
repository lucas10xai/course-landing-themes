#!/usr/bin/env bash
# Icon tab 128×128 bo góc từ logo (nền trong suốt): favicon.sh logo.png "#fff6dc" out.png
set -euo pipefail
magick "$1" -resize 116x116 -background "${2:-#ffffff}" -gravity center -extent 128x128 \
  \( +clone -alpha extract -fill black -colorize 100 -fill white -draw "roundrectangle 0,0 127,127 22,22" \) \
  -alpha off -compose CopyOpacity -composite "$3"
echo "✓ $3"

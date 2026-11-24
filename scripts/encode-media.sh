#!/usr/bin/env bash
# Turn one master clip into the hero files the site expects.
# Usage: scripts/encode-media.sh master.mov
# Output: assets/media/hero/manthai-hero.webm, manthai-hero.mp4, hero-poster.webp
set -euo pipefail
src="${1:?usage: encode-media.sh master-video}"
out="assets/media/hero"; mkdir -p "$out"
vf="scale=1920:-2,fps=24"
ffmpeg -y -i "$src" -t 12 -an -vf "$vf" -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 "$out/manthai-hero.webm"
ffmpeg -y -i "$src" -t 12 -an -vf "$vf" -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart "$out/manthai-hero.mp4"
ffmpeg -y -i "$src" -frames:v 1 -vf "scale=1600:-2" -c:v libwebp -quality 80 "$out/hero-poster.webp"
ls -lh "$out"

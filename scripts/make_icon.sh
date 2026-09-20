#!/usr/bin/env bash
set -e

mkdir -p Hanouti40/assets
mkdir -p Hanouti40/bin
mkdir -p public/assets

# Create high-res 512x512 base PNG using ImageMagick
convert -size 512x512 xc:none \
  -fill "#0f172a" -stroke "#334155" -strokewidth 4 \
  -draw "roundrectangle 24,24 488,488 96,96" \
  -fill none -stroke "#10b981" -strokewidth 5 \
  -draw "roundrectangle 36,36 476,476 84,84" \
  \
  -fill "#047857" -stroke none \
  -draw "polygon 100,160 130,85 382,85 412,160" \
  -fill "#10b981" \
  -draw "circle 126,160 126,180 circle 178,160 178,180 circle 230,160 230,180 circle 282,160 282,180 circle 334,160 334,180 circle 386,160 386,180" \
  \
  -fill "#1e293b" -stroke "#475569" -strokewidth 4 \
  -draw "roundrectangle 130,185 382,345 20,20" \
  \
  -fill "#064e3b" -stroke "#10b981" -strokewidth 3 \
  -draw "roundrectangle 150,205 362,305 12,12" \
  \
  -fill "#0f172a" -stroke "#334155" -strokewidth 4 \
  -draw "polygon 110,345 402,345 382,395 130,395" \
  -fill "#f59e0b" -stroke none \
  -draw "roundrectangle 210,362 302,372 4,4" \
  -fill "#10b981" \
  -draw "circle 340,367 340,373" \
  \
  -fill "#0f172a" -stroke "#f59e0b" -strokewidth 6 \
  -draw "circle 400,400 400,448" \
  -fill "#f59e0b" -stroke none \
  -draw "circle 400,400 400,440" \
  \
  -font "Helvetica-Bold" -fill "#6ee7b7" -pointsize 52 \
  -gravity North -annotate +0+220 "H40" \
  -font "Helvetica-Bold" -fill "#34d399" -pointsize 18 \
  -gravity North -annotate +0+280 "HANOUTI" \
  -font "Helvetica-Bold" -fill "#0f172a" -pointsize 30 \
  -gravity center -annotate +144+144 "PRO" \
  Hanouti40/assets/app_icon_512.png

# Generate Windows ICO containing 16, 24, 32, 48, 64, 128, 256 pixel layers
convert Hanouti40/assets/app_icon_512.png \
  -define icon:auto-resize=256,128,64,48,32,24,16 \
  Hanouti40/assets/app_icon.ico

# Also copy to root assets and public assets so all relative paths work
mkdir -p assets
cp Hanouti40/assets/app_icon.ico assets/app_icon.ico
cp Hanouti40/assets/app_icon.ico public/favicon.ico
cp Hanouti40/assets/app_icon_512.png public/assets/app_icon.png
cp Hanouti40/assets/app_icon_512.png Hanouti40/assets/app_icon.png

echo "Icon generated successfully!"

#!/bin/bash
# Generate simple colored placeholder images using ImageMagick or a fallback

IMAGES_DIR="$(dirname "$0")/../public/images"
mkdir -p "$IMAGES_DIR"

# Use simple placeholder approach with SVG converted to PNG-like
# Since we may not have ImageMagick, create simple HTML-canvas based approach
colors=("#0f1729" "#1a0a2e" "#0d4f4f" "#8b4513" "#4a0e0e" "#ff6b6b" "#2d5016" "#1a1a2e")
names=("podcast-1" "podcast-2" "podcast-3" "podcast-4" "podcast-5" "podcast-6" "podcast-7" "podcast-8")

for i in {0..7}; do
  color="${colors[$i]}"
  name="${names[$i]}"
  # Create an SVG that can be used as image
  cat > "$IMAGES_DIR/${name}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}88;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#grad)"/>
  <circle cx="200" cy="180" r="60" fill="white" opacity="0.15"/>
  <circle cx="200" cy="180" r="40" fill="white" opacity="0.1"/>
  <polygon points="185,160 185,200 220,180" fill="white" opacity="0.3"/>
</svg>
EOF
done

echo "Created placeholder SVG images in $IMAGES_DIR"

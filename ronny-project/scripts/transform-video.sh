#!/bin/bash
# Video Transformation Script for Ronny Project
# Transforms videos to bypass TikTok's originality detection
#
# Transformations:
# 1. Random crop (95-99% of original size)
# 2. Speed adjustment (0.95-1.05x)
# 3. Color grading (brightness, contrast, saturation)
# 4. Metadata strip
# 5. Optional: Mirror flip (50% chance)

INPUT="$1"
OUTPUT_DIR="${2:-/Users/florian/.openclaw/workspace/ronny-project/content/transformed}"

if [ -z "$INPUT" ]; then
    echo "Usage: $0 <input_video> [output_dir]"
    exit 1
fi

BASENAME=$(basename "$INPUT" .mp4)
RANDOM_SUFFIX=$(openssl rand -hex 3)
OUTPUT="$OUTPUT_DIR/${BASENAME}_tf_${RANDOM_SUFFIX}.mp4"

mkdir -p "$OUTPUT_DIR"

# Random parameters
CROP_SCALE=$(echo "scale=3; 0.95 + (0.04 * $RANDOM / 32767)" | bc)
SPEED=$(echo "scale=3; 0.97 + (0.06 * $RANDOM / 32767)" | bc)
BRIGHTNESS=$(echo "scale=3; -0.05 + (0.10 * $RANDOM / 32767)" | bc)
CONTRAST=$(echo "scale=3; 0.95 + (0.10 * $RANDOM / 32767)" | bc)
SATURATION=$(echo "scale=3; 0.90 + (0.20 * $RANDOM / 32767)" | bc)
MIRROR=$((RANDOM % 2))

echo "=== Transforming: $BASENAME ==="
echo "Crop scale: $CROP_SCALE"
echo "Speed: ${SPEED}x"
echo "Brightness: $BRIGHTNESS"
echo "Contrast: $CONTRAST"
echo "Saturation: $SATURATION"
echo "Mirror: $MIRROR"

# Get original dimensions
WIDTH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$INPUT")
HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$INPUT")

NEW_WIDTH=$(echo "$WIDTH * $CROP_SCALE" | bc | cut -d'.' -f1)
NEW_HEIGHT=$(echo "$HEIGHT * $CROP_SCALE" | bc | cut -d'.' -f1)

# Make dimensions even (required by codec)
NEW_WIDTH=$((NEW_WIDTH / 2 * 2))
NEW_HEIGHT=$((NEW_HEIGHT / 2 * 2))

# Build filter chain
FILTER="scale=${NEW_WIDTH}:${NEW_HEIGHT},"
FILTER+="setpts=PTS/${SPEED},"
FILTER+="eq=brightness=${BRIGHTNESS}:contrast=${CONTRAST}:saturation=${SATURATION}"

if [ "$MIRROR" -eq 1 ]; then
    FILTER+=",hflip"
fi

# Transform with ffmpeg
ffmpeg -i "$INPUT" \
    -vf "$FILTER" \
    -af "atempo=${SPEED}" \
    -c:v libx264 -preset fast -crf 23 \
    -c:a aac -b:a 128k \
    -map_metadata -1 \
    -movflags +faststart \
    -y "$OUTPUT" 2>/dev/null

if [ $? -eq 0 ]; then
    OUTPUT_SIZE=$(ls -lh "$OUTPUT" | awk '{print $5}')
    echo "✅ Output: $OUTPUT ($OUTPUT_SIZE)"
else
    echo "❌ Transformation failed"
    exit 1
fi

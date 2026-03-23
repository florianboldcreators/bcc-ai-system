#!/bin/bash
# Create Android Virtual Device for TikTok automation

export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator"
export JAVA_HOME="/Library/Java/JavaVirtualMachines/temurin-25.jdk/Contents/Home"

echo "🚀 Creating TikTok AVD..."

# Create AVD (Android Virtual Device)
avdmanager create avd \
  --force \
  --name "TikTok_AVD" \
  --package "system-images;android-34;google_apis;arm64-v8a" \
  --device "pixel_7"

echo "✅ AVD created: TikTok_AVD"
echo ""
echo "To start emulator:"
echo "  emulator -avd TikTok_AVD -no-snapshot-load"
echo ""
echo "To list AVDs:"
echo "  emulator -list-avds"

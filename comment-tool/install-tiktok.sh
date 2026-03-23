#!/bin/bash
# Download and install TikTok on emulator

export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$PATH:$ANDROID_HOME/platform-tools"

echo "📱 Installing TikTok on emulator..."

# Download TikTok APK from APKMirror (safe source)
TIKTOK_APK="/tmp/tiktok.apk"

if [ ! -f "$TIKTOK_APK" ]; then
  echo "Downloading TikTok APK..."
  # Latest TikTok US version
  curl -L "https://www.apkmirror.com/apk/tiktok-pte-ltd/tik-tok-including-musical-ly/tik-tok-including-musical-ly-33-4-4-release/tiktok-33-4-4-android-apk-download/download/" \
    -o "$TIKTOK_APK"
fi

# Wait for emulator to be ready
echo "Waiting for emulator..."
adb wait-for-device

# Install TikTok
echo "Installing TikTok..."
adb install -r "$TIKTOK_APK"

echo "✅ TikTok installed"
echo ""
echo "You can now run: python3 tiktok-appium.py"

#!/bin/bash

# Script to test macOS ad-hoc signing for Flomo Garden
echo "=== Flomo Garden macOS 签名测试 ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}错误：此脚本只能在 macOS 上运行${NC}"
    exit 1
fi

# Navigate to flomo-ui directory
cd "$(dirname "$0")/../flomo-ui" || exit 1

echo "1. 构建应用..."
echo "   使用临时签名 (signingIdentity: '-')"
echo ""

# Build the app (ensure using system xattr)
PATH=/usr/bin:$PATH pnpm tauri build

if [ $? -ne 0 ]; then
    echo -e "${RED}构建失败！${NC}"
    exit 1
fi

echo -e "${GREEN}构建成功！${NC}"
echo ""

# Find the built app
APP_PATH="src-tauri/target/release/bundle/macos/flomo-garden.app"
DMG_PATH="src-tauri/target/release/bundle/dmg/"

if [ -d "$APP_PATH" ]; then
    echo "2. 检查签名状态..."
    echo ""
    
    # Check code signature
    echo "运行 codesign 验证:"
    codesign -dv --verbose=4 "$APP_PATH" 2>&1
    echo ""
    
    # Check if it's ad-hoc signed
    if codesign -dv "$APP_PATH" 2>&1 | grep -q "Signature=adhoc"; then
        echo -e "${GREEN}✓ 应用已使用临时签名${NC}"
    else
        echo -e "${YELLOW}⚠ 签名状态未知${NC}"
    fi
    echo ""
    
    # Check spctl (Gatekeeper)
    echo "3. 检查 Gatekeeper 状态..."
    spctl -a -v "$APP_PATH" 2>&1 || true
    echo ""
    echo -e "${YELLOW}注意：临时签名的应用仍需要用户手动允许运行${NC}"
    echo ""
    
    # List created files
    echo "4. 生成的文件:"
    echo "   - 应用程序: $APP_PATH"
    if [ -d "$DMG_PATH" ]; then
        ls -la "$DMG_PATH"*.dmg 2>/dev/null | while read -r line; do
            echo "   - DMG: $(echo "$line" | awk '{print $NF}')"
        done
    fi
    echo ""
    
    echo "5. 测试运行说明:"
    echo "   a) 复制应用到 /Applications:"
    echo "      cp -R \"$APP_PATH\" /Applications/"
    echo ""
    echo "   b) 首次运行:"
    echo "      - 右键点击 Flomo Garden.app"
    echo "      - 选择 '打开'"
    echo "      - 在弹出的对话框中再次点击 '打开'"
    echo ""
    echo "   c) 或者在终端直接运行:"
    echo "      \"$APP_PATH/Contents/MacOS/flomo-garden\""
    
else
    echo -e "${RED}错误：找不到构建的应用${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}签名测试完成！${NC}"
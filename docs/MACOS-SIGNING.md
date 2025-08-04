# macOS 临时签名配置

## 概述

Flomo Garden 使用 macOS 临时签名（Ad-Hoc Signing）来避免"应用程序已损坏"的错误，同时不需要付费的 Apple Developer 账号。

## 配置说明

### 1. Tauri 配置
在 `flomo-ui/src-tauri/tauri.conf.json` 中配置：

```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "-"  // "-" 表示使用临时签名
    }
  }
}
```

### 2. 本地构建测试
```bash
# 运行测试脚本
./scripts/test-macos-signing.sh

# 或手动构建
cd flomo-ui
pnpm tauri build
```

### 3. GitHub Actions
workflow 已配置为自动使用临时签名构建 macOS 版本：
- Apple Silicon (M1/M2/M3): `aarch64.dmg`
- Intel Mac: `x86_64.dmg`

## 用户安装说明

由于使用临时签名，用户首次打开应用时需要：

### 方法 1：右键打开
1. 下载并安装 DMG 文件
2. 将 Flomo Garden 拖到 Applications 文件夹
3. **右键**点击应用，选择"打开"
4. 在弹出的对话框中再次点击"打开"

### 方法 2：系统设置允许
1. 尝试正常打开应用
2. 如果被阻止，打开"系统偏好设置 > 隐私与安全性"
3. 找到 Flomo Garden 相关提示
4. 点击"仍要打开"

## 签名验证

验证应用是否已正确签名：
```bash
# 检查签名
codesign -dv /Applications/Flomo\ Garden.app

# 应该看到类似输出：
# Signature=adhoc
```

## 优势与限制

### 优势
- ✅ 无需 Apple Developer 账号
- ✅ 避免"应用程序已损坏"错误
- ✅ 适用于所有 macOS 版本
- ✅ 特别适合 Apple Silicon 设备

### 限制
- ⚠️ 用户需要手动允许首次运行
- ⚠️ 无法进行公证（Notarization）
- ⚠️ 无法上架 Mac App Store

## 未来升级路径

如果将来需要完整的代码签名：
1. 注册 Apple Developer 账号（$99/年）
2. 创建 Developer ID Application 证书
3. 更新 `signingIdentity` 为证书名称
4. 配置公证（Notarization）流程
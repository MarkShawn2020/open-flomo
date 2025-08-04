# Flomo Garden 快速开始指南

## 构建成功！ 🎉

应用已成功构建并使用macOS临时签名。

### 生成的文件
- **应用**: `/flomo-ui/src-tauri/target/release/bundle/macos/flomo-garden.app`
- **DMG安装包**: `/flomo-ui/src-tauri/target/release/bundle/dmg/flomo-garden_0.1.0_aarch64.dmg`

### 安装方法

#### 方法1：从DMG安装（推荐）
```bash
# 打开DMG文件
open flomo-ui/src-tauri/target/release/bundle/dmg/flomo-garden_0.1.0_aarch64.dmg

# 将Flomo Garden拖到Applications文件夹
```

#### 方法2：直接复制.app
```bash
cp -R flomo-ui/src-tauri/target/release/bundle/macos/flomo-garden.app /Applications/
```

### 首次运行

由于使用临时签名，首次运行需要：

1. **右键打开**
   - 在Applications中找到Flomo Garden
   - 右键点击，选择"打开"
   - 在弹出的对话框中再次点击"打开"

2. **或在系统设置中允许**
   - 如果双击打开被阻止
   - 打开"系统偏好设置 > 隐私与安全性"
   - 找到Flomo Garden的提示
   - 点击"仍要打开"

### 开发调试

直接在终端运行（无需安装）：
```bash
./flomo-ui/src-tauri/target/release/bundle/macos/flomo-garden.app/Contents/MacOS/flomo-garden
```

### 验证签名

```bash
# 检查签名状态
codesign -dv /Applications/Flomo\ Garden.app

# 应该看到: Signature=adhoc
```

### 常见问题

**Q: 为什么需要右键打开？**
A: macOS要求所有从网络下载的应用都要经过用户确认，临时签名的应用需要手动允许。

**Q: 可以避免这个步骤吗？**
A: 需要付费的Apple Developer账号进行完整签名和公证。

**Q: 应用安全吗？**
A: 是的，临时签名不影响应用安全性，只是需要用户手动确认信任。
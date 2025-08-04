# Flomo UI 自动更新配置指南

## 当前状态
为了让GitHub Actions能够成功构建，我们暂时禁用了更新文件的签名功能。这意味着：
- ✅ 应用可以正常构建和发布
- ✅ 用户可以手动下载和安装
- ⚠️ 自动更新功能暂时不可用（因为没有签名验证）

## 启用自动更新的步骤

### 方法1：完全禁用签名（不推荐用于生产环境）
1. 编辑 `flomo-ui/src-tauri/tauri.conf.json`：
   - 删除 `plugins.updater.pubkey` 字段
   - 保持 `createUpdaterArtifacts: true`

2. 更新将在没有签名验证的情况下工作（安全风险）

### 方法2：使用Tauri CLI生成密钥（推荐）
1. 安装Tauri CLI：
   ```bash
   cargo install tauri-cli
   ```

2. 生成密钥对：
   ```bash
   cargo tauri signer generate -w ~/.tauri/flomo-garden.key
   ```
   输入一个密码（记住它！）

3. 获取公钥：
   ```bash
   cargo tauri signer sign -k ~/.tauri/flomo-garden.key -p "你的密码"
   ```
   这会显示你的公钥

4. 更新配置：
   - 将公钥添加到 `flomo-ui/src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`
   - 设置 `createUpdaterArtifacts: true`

5. 在GitHub设置密钥：
   - 读取私钥文件：`cat ~/.tauri/flomo-garden.key`
   - 在GitHub仓库Settings > Secrets中添加：
     - `TAURI_SIGNING_PRIVATE_KEY`: 私钥内容
     - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 你设置的密码

6. 更新GitHub Actions workflow，添加环境变量：
   ```yaml
   env:
     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
     TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
     TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
   ```

### 方法3：使用在线工具生成密钥
1. 访问：https://tauri.app/v1/guides/distribution/updater#signing-updates
2. 使用在线密钥生成器
3. 按照上述步骤配置

## 测试自动更新
1. 构建并发布一个版本（如 v0.1.0）
2. 安装该版本
3. 修改版本号到 v0.1.1
4. 发布新版本
5. 打开应用，检查更新功能是否工作

## 注意事项
- 签名密钥一旦设置，不要更改，否则旧版本无法更新
- 保管好私钥和密码，丢失后无法恢复
- 测试环境可以暂时禁用签名，生产环境强烈建议启用
# Release Process

This document describes how to create a new release for Flomo Garden with automatic updates.

## Prerequisites

1. **Generate signing keys** (one-time setup):
   ```bash
   ./scripts/generate-update-key.sh
   ```
   - Add the public key to `src-tauri/tauri.conf.json` under `plugins.updater.pubkey`
   - Add the private key to GitHub repository secrets as `TAURI_SIGNING_PRIVATE_KEY`

2. **Update the repository owner and name** in `src-tauri/tauri.conf.json`:
   ```json
   "endpoints": [
     "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/latest/download/latest.json"
   ]
   ```

## Creating a Release

1. **Update version** in `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "chore: bump version to v0.2.0"
   ```

3. **Create and push tag** (注意：tag必须以 `flomo-ui-v` 开头):
   ```bash
   git tag flomo-ui-v0.2.0
   git push origin main
   git push origin flomo-ui-v0.2.0
   ```

4. **GitHub Actions will automatically**:
   - Build the app for all platforms (macOS Intel, macOS Apple Silicon, Windows, Linux)
   - Create a draft release with all artifacts
   - Generate update manifests (latest.json)
   - Sign the update artifacts
   - Publish the release

## Update Flow

When users have the app installed:

1. The app checks for updates periodically (every hour by default)
2. If an update is available, a notification badge appears on the Updates button
3. Users can click to see release notes and download the update
4. The update is verified using the public key before installation
5. Users can restart immediately or postpone the restart

## Troubleshooting

### Update not detected
- Ensure the GitHub release is published (not draft)
- Check that `latest.json` is attached to the release
- Verify the endpoint URL matches your repository

### Signature verification failed
- Ensure the same key pair is used for signing and verification
- Check that the public key in `tauri.conf.json` is correct
- Verify the private key in GitHub secrets is properly formatted

### Platform-specific issues
- **macOS**: Ensure the app is code-signed for distribution
- **Windows**: May require additional code-signing certificates
- **Linux**: AppImage should work out of the box

## Best Practices

1. **Test updates** in a staging environment before releasing
2. **Include detailed release notes** for users
3. **Use semantic versioning** (major.minor.patch)
4. **Monitor update adoption** through analytics or user feedback
5. **Keep the update size minimal** by using Tauri's built-in optimizations
#!/bin/bash

# Script to generate signing keys for Tauri updater using the official method
# This should be run once and the keys should be stored securely

echo "Generating Tauri update signing keys..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Create a simple Node.js script to generate keys
cat > generate-keys.js << 'EOF'
const crypto = require('crypto');

// Generate a new key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'der'
  },
  publicKeyEncoding: {
    type: 'spki',
    format: 'der'
  }
});

// Convert to base64
const privateKeyBase64 = privateKey.toString('base64');
const publicKeyBase64 = publicKey.toString('base64');

// For Tauri, we need just the key part without headers
// Extract the actual key bytes (last 32 bytes for Ed25519)
const publicKeyBytes = publicKey.slice(-32);
const publicKeyForTauri = publicKeyBytes.toString('base64');

console.log('=== PUBLIC KEY (Add to tauri.conf.json) ===');
console.log(publicKeyForTauri);
console.log('');
console.log('=== PRIVATE KEY (Add to GitHub Secrets as TAURI_SIGNING_PRIVATE_KEY) ===');
console.log(privateKeyBase64);
console.log('');
console.log('=== ALTERNATIVE: Use npx to generate keys ===');
console.log('You can also use the official Tauri plugin to generate keys:');
console.log('npx @tauri-apps/plugin-updater generate-key');
EOF

# Run the script
node generate-keys.js

# Clean up
cd ..
rm -rf "$TEMP_DIR"

echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "1. Store the private key securely in GitHub Secrets as TAURI_SIGNING_PRIVATE_KEY"
echo "2. Add the public key to src-tauri/tauri.conf.json under plugins.updater.pubkey"
echo "3. Never commit the private key to the repository!"
echo ""
echo "If the keys above don't work, try using the official Tauri method:"
echo "npx @tauri-apps/plugin-updater generate-key"
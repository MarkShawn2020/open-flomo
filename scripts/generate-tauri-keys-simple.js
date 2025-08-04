// Simple script to generate Tauri updater keys
// Usage: node generate-tauri-keys-simple.js

const crypto = require('crypto');

console.log('Generating Tauri updater keys...\n');

// For Tauri updater, we can either:
// 1. Generate keys manually (complex)
// 2. Use empty string for development/testing
// 3. Disable signing temporarily

console.log('=== OPTION 1: Development Mode (No Signing) ===');
console.log('To disable signing temporarily:');
console.log('1. Remove the "pubkey" field from tauri.conf.json');
console.log('2. Remove TAURI_SIGNING_PRIVATE_KEY from GitHub Secrets');
console.log('3. Set createUpdaterArtifacts to false in tauri.conf.json\n');

console.log('=== OPTION 2: Use Tauri CLI (Recommended) ===');
console.log('Install Tauri CLI globally and generate keys:');
console.log('cargo install tauri-cli');
console.log('cargo tauri signer generate -w ~/.tauri/flomo-garden.key');
console.log('');
console.log('Then get your public key:');
console.log('cargo tauri signer sign -k ~/.tauri/flomo-garden.key -p ""');
console.log('(The public key will be displayed)\n');

console.log('=== OPTION 3: Manual Ed25519 Keys ===');

// Generate Ed25519 key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

// Export keys in the format Tauri expects
const privateKeyDer = privateKey.export({ type: 'pkcs8', format: 'der' });
const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });

// Extract raw Ed25519 public key (last 32 bytes)
const rawPublicKey = publicKeyDer.slice(-32);

// Convert to base64
const publicKeyBase64 = rawPublicKey.toString('base64');
const privateKeyBase64 = privateKeyDer.toString('base64');

console.log('PUBLIC KEY (for tauri.conf.json):');
console.log(publicKeyBase64);
console.log('');
console.log('PRIVATE KEY (for GitHub Secrets - with password):');
console.log('Note: Tauri expects the private key to be password-protected.');
console.log('Raw key (needs password protection):');
console.log(privateKeyBase64);
console.log('');
console.log('For GitHub Actions, you might need to:');
console.log('1. Save this private key with a password');
console.log('2. Set TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD in secrets');
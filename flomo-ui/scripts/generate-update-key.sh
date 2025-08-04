#!/bin/bash

# Script to generate signing keys for Tauri updater
# This should be run once and the keys should be stored securely

echo "Generating Tauri update signing keys..."

# Generate private key
openssl genpkey -algorithm ED25519 -out tauri-private.key

# Extract public key
openssl pkey -in tauri-private.key -pubout -out tauri-public.key

# Convert to base64 for easier storage
PRIVATE_KEY=$(cat tauri-private.key | base64 | tr -d '\n')
PUBLIC_KEY=$(cat tauri-public.key | grep -v "PUBLIC KEY" | tr -d '\n')

echo ""
echo "Keys generated successfully!"
echo ""
echo "=== PUBLIC KEY (Add to tauri.conf.json) ==="
echo "$PUBLIC_KEY"
echo ""
echo "=== PRIVATE KEY (Add to GitHub Secrets as TAURI_SIGNING_PRIVATE_KEY) ==="
echo "$PRIVATE_KEY"
echo ""
echo "⚠️  IMPORTANT: Store the private key securely and never commit it to the repository!"
echo ""

# Clean up key files
rm tauri-private.key tauri-public.key

echo "Temporary key files have been removed."
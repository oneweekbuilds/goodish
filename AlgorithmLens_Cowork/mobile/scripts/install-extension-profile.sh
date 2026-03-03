#!/bin/bash
set -e

PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$PROFILE_DIR"

for profile in profiles/*.mobileprovision; do
  UUID=$(security cms -D -i "$profile" 2>/dev/null | plutil -extract UUID raw -)
  echo "Installing profile: $profile with UUID: $UUID"
  cp "$profile" "$PROFILE_DIR/$UUID.mobileprovision"
done

echo "Installed profiles:"
ls -la "$PROFILE_DIR"

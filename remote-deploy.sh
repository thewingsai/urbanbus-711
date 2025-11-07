#!/bin/bash
set -euo pipefail
WEBROOT=/var/www/urbanbus
TMP=/root/urbanbus_deploy_$$
mkdir -p "$TMP"
cd "$TMP"
# Fetch current repo tarball
curl -L -o site.tar.gz https://codeload.github.com/thewingsai/urban-bus-app-master/tar.gz/refs/heads/main
# Extract
tar -xzf site.tar.gz
SRC=urban-bus-app-master-main
# Preserve .env if present
if [ -f "$WEBROOT/.env" ]; then cp -a "$WEBROOT/.env" "$TMP/.env.keep"; fi
# Ensure rsync is available
if ! command -v rsync >/dev/null 2>&1; then DEBIAN_FRONTEND=noninteractive apt-get update -y && apt-get install -y rsync || true; fi
# Sync files
if command -v rsync >/dev/null 2>&1; then rsync -a --delete "$SRC"/ "$WEBROOT"/; else cp -a "$SRC"/. "$WEBROOT"/; fi
# Restore .env
if [ -f "$TMP/.env.keep" ]; then mv -f "$TMP/.env.keep" "$WEBROOT/.env"; fi
chown -R www-data:www-data "$WEBROOT"
# Reload nginx and show first lines served
nginx -t && systemctl reload nginx || true
printf '\n== served (https) ==\n'
curl -sk -H 'Host: urbanbus.co.in' https://127.0.0.1/ | head -n 20
# Cleanup
rm -rf "$TMP"
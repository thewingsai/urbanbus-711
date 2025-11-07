#!/bin/bash
set -e
for f in /etc/nginx/sites-enabled/*; do
  base=$(basename "$f")
  if [ "$base" != "urbanbus.conf" ] && grep -q 'server_name .*urbanbus.co.in' "$f"; then
    echo "Removing conflict: $base"
    rm -f "$f"
  fi
done
nginx -t
systemctl reload nginx
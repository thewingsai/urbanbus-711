#!/bin/bash
set -euo pipefail
CONF="/etc/nginx/sites-available/urbanbus.conf"
cp -a "$CONF" "$CONF.bak.$(date +%s)"
# Insert HTML no-cache block after index line if not present
if ! grep -q "\.html$" "$CONF"; then
  awk '
    /index index\.html;/ && !ins { print; print "\n  # No-cache for HTML"; print "  location ~* \\.(html)$ { add_header Cache-Control \"no-store, no-cache, must-revalidate, max-age=0\"; }"; ins=1; next } { print }
  ' "$CONF" > "$CONF.tmp" && mv "$CONF.tmp" "$CONF"
fi
# Ensure assets have long cache header
awk '
  BEGIN{inblk=0}
  /location ~\* \\.\(\?:css\|js\|jpg\|jpeg\|png\|gif\|svg\|ico\|woff2\?\|ttf\)\$ \{/ {inblk=1}
  inblk && /expires 7d;/ && !added { sub(/expires 7d;/, "add_header Cache-Control \"public, max-age=604800, immutable\";\n    expires 7d;"); added=1 }
  /}/ && inblk { inblk=0 }
  { print }
' "$CONF" > "$CONF.tmp" && mv "$CONF.tmp" "$CONF"
nginx -t
systemctl reload nginx
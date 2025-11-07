set -e
PHP_SOCK=$(ls /run/php/php*-fpm.sock 2>/dev/null | head -n1 || true)
if [ -n "$PHP_SOCK" ]; then
  sed -i "s|unix:/run/php/php-fpm.sock|unix:$PHP_SOCK|" /etc/nginx/sites-available/urbanbus.conf
fi
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/urbanbus.conf /etc/nginx/sites-enabled/urbanbus.conf
nginx -t
systemctl enable --now nginx || true
systemctl enable --now php8.3-fpm || systemctl enable --now php8.2-fpm || systemctl enable --now php-fpm || true
systemctl reload nginx
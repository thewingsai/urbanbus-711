#!/bin/bash
set -e

# UrbanBus Manual Deployment Script
# Run this in your Hostinger web terminal

DOMAIN="urbanbus.co.in"
EMAIL="you@urbanbus.co.in"
APP_DIR="$HOME/apps/urban-bus-app"
APP_NAME="urbanbus"
UPI_KEY="MISSING_SET_ME"

echo "=== UrbanBus Deployment for $DOMAIN ==="

# Create directories
mkdir -p "$APP_DIR"
sudo mkdir -p /var/urbanbus/data /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo chown -R $USER:$USER /var/urbanbus

# Install Node.js if not present
if ! command -v node &>/dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install PM2 if not present
if ! command -v pm2 &>/dev/null; then
  echo "Installing PM2..."
  sudo npm i -g pm2
fi

# Extract application (assumes urbanbus-src.tgz is already uploaded to $APP_DIR)
cd "$APP_DIR"
if [ -f urbanbus-src.tgz ]; then
  echo "Extracting application..."
  tar -xzf urbanbus-src.tgz
  rm -f urbanbus-src.tgz
else
  echo "ERROR: urbanbus-src.tgz not found in $APP_DIR"
  echo "Please upload the file first via Hostinger File Manager"
  exit 1
fi

# Configure environment
touch .env
grep -q '^NEXT_PUBLIC_BASE_URL=' .env && sed -i "s|^NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN|" .env || echo "NEXT_PUBLIC_BASE_URL=https://$DOMAIN" >> .env
grep -q '^NEXTAUTH_URL=' .env && sed -i "s|^NEXTAUTH_URL=.*|NEXTAUTH_URL=https://$DOMAIN|" .env || echo "NEXTAUTH_URL=https://$DOMAIN" >> .env
grep -q '^UPI_GATEWAY_KEY=' .env && sed -i "s|^UPI_GATEWAY_KEY=.*|UPI_GATEWAY_KEY=$UPI_KEY|" .env || echo "UPI_GATEWAY_KEY=$UPI_KEY" >> .env

# Install dependencies
echo "Installing dependencies..."
npm ci

# Generate Prisma client
echo "Generating Prisma client..."
npm run prisma:generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Build application
echo "Building application..."
npm run build

# Start/reload with PM2
if pm2 describe "$APP_NAME" &>/dev/null; then
  echo "Reloading existing PM2 process..."
  pm2 reload "$APP_NAME"
else
  echo "Starting new PM2 process..."
  pm2 start "npm -- start" --name "$APP_NAME" --time
fi
pm2 save

# Configure Nginx
echo "Configuring Nginx..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx server block
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
  listen 80;
  listen [::]:80;
  server_name $DOMAIN www.$DOMAIN;

  location / {
    proxy_pass         http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header   Host \$host;
    proxy_set_header   X-Real-IP \$remote_addr;
    proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \$scheme;
    proxy_set_header   Upgrade \$http_upgrade;
    proxy_set_header   Connection "upgrade";
  }

  client_max_body_size 10m;
}
EOF

sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
sudo nginx -t
sudo systemctl reload nginx

# Configure firewall if UFW is available
if command -v ufw &>/dev/null; then
  sudo ufw allow 'Nginx Full' || true
fi

# Get SSL certificate
echo "Obtaining SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect -m $EMAIL --agree-tos -n

echo "=== Deployment Complete ==="
echo "Visit: https://$DOMAIN"
echo "Status: https://$DOMAIN/status"

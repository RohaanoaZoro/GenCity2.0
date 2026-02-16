#!/bin/bash
set -e

# ============================================
# GenCity 3D Builder - Ubuntu Deployment Script
# Builds the app and serves it via Nginx on port 80
# ============================================

APP_NAME="gencity"
REPO_URL="https://github.com/RohaanoaZoro/GenCity2.0.git"
APP_DIR="/var/www/$APP_NAME"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

echo "========================================"
echo " GenCity 3D Builder - Deployment"
echo "========================================"

# --- 1. System update ---
echo "[1/7] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# --- 2. Install Node.js 20.x ---
echo "[2/7] Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "       Node.js already installed: $(node -v)"
fi

# --- 3. Install Nginx ---
echo "[3/7] Installing Nginx..."
sudo apt install -y nginx

# --- 4. Clone or update the repository ---
echo "[4/7] Setting up application directory..."
if [ -d "$APP_DIR/repo" ]; then
    echo "       Repository already exists, pulling latest changes..."
    cd "$APP_DIR/repo"
    git pull
else
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER":"$USER" "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR/repo"
    cd "$APP_DIR/repo"
fi

# --- 5. Set Gemini API key ---
echo "[5/7] Configuring environment..."
if [ -z "$GEMINI_API_KEY" ]; then
    read -rp "       Enter your Gemini API key: " GEMINI_API_KEY
fi
echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local

# --- 6. Build the production bundle ---
echo "[6/7] Installing dependencies and building..."
npm install
npm run build

# Copy build output to the serve directory
sudo rm -rf "$APP_DIR/html"
sudo cp -r dist "$APP_DIR/html"

# --- 7. Configure Nginx ---
echo "[7/7] Configuring Nginx..."
sudo tee "$NGINX_CONF" > /dev/null <<'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/gencity/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;
}
NGINX

# Enable the site and remove default
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/"$APP_NAME"
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# --- Done ---
echo ""
echo "========================================"
echo " Deployment complete!"
echo " App is live at: http://$(curl -s ifconfig.me)"
echo "========================================"

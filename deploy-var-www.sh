#!/bin/bash

echo "🚀 Deploying AIMS to /var/www/aims..."

# Create directory
sudo mkdir -p /var/www/aims
sudo chown $USER:$USER /var/www/aims

# Copy project files
cp -r . /var/www/aims/
cd /var/www/aims

# Set proper permissions
sudo chown -R $USER:$USER /var/www/aims
sudo chmod -R 755 /var/www/aims

# Set up SSL certificates
sudo mkdir -p ssl
sudo certbot certonly --standalone -d assetwise.glue-si.com -d www.assetwise.glue-si.com --non-interactive --agree-tos --email admin@glue-si.com
sudo cp /etc/letsencrypt/live/assetwise.glue-si.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/assetwise.glue-si.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem

# Deploy
docker-compose -f docker-compose.prod.yml up -d --build

echo "✅ Deployment complete!"
echo "🌐 Application available at: https://assetwise.glue-si.com"
certbot certonly --standalone -d assetwise.glue-si.com -d www.assetwise.glue-si.com --non-interactive --agree-tos --email sumaculub_t@glue-si.com

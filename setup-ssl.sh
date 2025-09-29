#!/bin/bash

echo "🔒 Setting up SSL certificates for assetwise.glue-si.com..."

# Install certbot if not already installed
apt install -y certbot

# Stop nginx if running
systemctl stop nginx

# Get SSL certificate
echo "📜 Requesting SSL certificate..."
certbot certonly --standalone -d assetwise.glue-si.com -d www.assetwise.glue-si.com --non-interactive --agree-tos --email admin@glue-si.com

# Create SSL directory for Docker
mkdir -p ssl

# Copy certificates to Docker SSL directory
echo "📋 Copying certificates..."
cp /etc/letsencrypt/live/assetwise.glue-si.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/assetwise.glue-si.com/privkey.pem ssl/key.pem

# Set proper permissions
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem

# Create renewal script
echo "🔄 Creating certificate renewal script..."
cat > renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/assetwise.glue-si.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/assetwise.glue-si.com/privkey.pem ssl/key.pem
chmod 644 ssl/cert.pem
chmod 600 ssl/key.pem
docker-compose -f docker-compose.prod.yml restart nginx
EOF

chmod +x renew-ssl.sh

# Add to crontab for automatic renewal
echo "⏰ Setting up automatic renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /opt/aims/renew-ssl.sh") | crontab -

echo "✅ SSL setup complete!"
echo "🔒 Certificates are valid for 90 days and will auto-renew"

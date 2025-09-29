#!/bin/bash

echo "🧹 Cleaning up VPS for fresh AIMS deployment..."

# Stop any running Docker containers
echo "🛑 Stopping Docker containers..."
cd /var/www/aims 2>/dev/null || cd /opt/aims 2>/dev/null || echo "No existing project directory found"
docker-compose down 2>/dev/null || echo "No Docker Compose running"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || echo "No production Docker Compose running"

# Remove Docker containers and images
echo "🗑️ Removing Docker containers and images..."
docker container prune -f
docker image prune -f
docker volume prune -f
docker network prune -f

# Remove any existing project directories
echo "📁 Removing existing project directories..."
rm -rf /var/www/aims
rm -rf /opt/aims

# Stop and disable any existing nginx
echo "🌐 Stopping existing nginx..."
systemctl stop nginx 2>/dev/null || echo "Nginx not running"
systemctl disable nginx 2>/dev/null || echo "Nginx not enabled"

# Remove any existing SSL certificates for the domain
echo "🔒 Cleaning up SSL certificates..."
certbot delete --cert-name assetwise.glue-si.com --non-interactive 2>/dev/null || echo "No SSL certificates to delete"

# Clean up any existing cron jobs
echo "⏰ Cleaning up cron jobs..."
crontab -l 2>/dev/null | grep -v "renew-ssl.sh" | crontab - 2>/dev/null || echo "No cron jobs to clean"

# Remove any existing Docker networks
echo "🌐 Cleaning up Docker networks..."
docker network ls -q | xargs -r docker network rm 2>/dev/null || echo "No networks to remove"

# Clean up system
echo "🧽 Cleaning up system..."
apt autoremove -y
apt autoclean

echo "✅ VPS cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your local project to the VPS"
echo "2. Run the VPS setup script"
echo "3. Deploy the application"
echo ""
echo "💡 Recommended upload method:"
echo "   scp -r ./aims user@your-vps-ip:/opt/aims/"

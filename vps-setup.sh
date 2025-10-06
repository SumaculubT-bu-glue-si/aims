#!/bin/bash

echo "🚀 Setting up VPS for AIMS deployment..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install additional tools
echo "🛠️ Installing additional tools..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /opt/aims
cd /opt/aims

# Create non-root user for Docker
echo "👤 Creating Docker user..."
useradd -m -s /bin/bash docker-user
usermod -aG docker docker-user

echo "✅ VPS setup complete!"
echo "📝 Next steps:"
echo "1. Upload your project files to /opt/aims"
echo "2. Set up SSL certificates"
echo "3. Run the deployment script"

#!/bin/bash

echo "🚀 Deploying AIMS to VPS..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ docker-compose.prod.yml not found. Please run this from the project root."
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/key.pem" ]; then
    echo "⚠️  SSL certificates not found. Setting up SSL..."
    ./setup-ssl.sh
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Remove old images to free space
echo "🧹 Cleaning up old images..."
docker system prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Test the application
echo "🧪 Testing application..."
sleep 10
curl -I https://assetwise.glue-si.com || echo "⚠️  Application might still be starting..."

# Show logs
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

echo "✅ Deployment complete!"
echo "🌐 Your application is available at:"
echo "   - HTTPS: https://assetwise.glue-si.com"
echo ""
echo "📊 Management commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   - Stop: docker-compose -f docker-compose.prod.yml down"
echo "   - Update: git pull && ./deploy-vps.sh"

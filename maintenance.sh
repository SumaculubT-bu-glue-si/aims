#!/bin/bash

# Maintenance script for AIMS
echo "🔧 AIMS Maintenance Script"
echo "========================="

# Update application
echo "📥 Updating application..."
git pull origin main

# Rebuild containers
echo "🔨 Rebuilding containers..."
docker-compose -f docker-compose.prod.yml build

# Restart services
echo "🔄 Restarting services..."
docker-compose -f docker-compose.prod.yml up -d

# Clean up old Docker images
echo "🧹 Cleaning up old images..."
docker system prune -f

# Check status
echo "✅ Maintenance complete!"
docker-compose -f docker-compose.prod.yml ps

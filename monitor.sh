#!/bin/bash

echo "📊 AIMS System Monitor"
echo "====================="

# Check Docker status
echo "🐳 Docker Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Disk Usage:"
df -h

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📈 Container Resource Usage:"
docker stats --no-stream

echo ""
echo "📋 Recent Logs (last 10 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=10

echo ""
echo "🔍 Service Health:"
echo "Database: $(docker-compose -f docker-compose.prod.yml exec database mysqladmin ping -h localhost -u admin_user -padmin123 2>/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Nginx: $(curl -s -o /dev/null -w "%{http_code}" https://assetwise.glue-si.com 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"

#!/bin/bash

# Production monitoring script
echo "📊 AIMS Production Monitor - $(date)"
echo "=================================="

# Check Docker containers
echo "🐳 Docker Containers:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "💾 Disk Usage:"
df -h | grep -E "(Filesystem|/opt)"

echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "📈 Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "🔍 Service Health:"
echo "Database: $(docker-compose -f docker-compose.prod.yml exec database mysqladmin ping -h localhost -u admin_user -padmin123 2>/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Nginx: $(curl -s -o /dev/null -w "%{http_code}" https://assetwise.glue-si.com 2>/dev/null | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")"

echo ""
echo "📋 Recent Logs (last 5 lines):"
docker-compose -f docker-compose.prod.yml logs --tail=5

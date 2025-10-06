#!/bin/bash

echo "🚀 Setting up AIMS Docker Environment..."

# Create .env files if they don't exist
if [ ! -f "./server/.env" ]; then
    echo "📝 Creating server/.env from .env.example..."
    cp ./server/.env.example ./server/.env
fi

if [ ! -f "./client/.env.local" ]; then
    echo "📝 Creating client/.env.local..."
    cat > ./client/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost/api
EOF
fi

echo "🔨 Building Docker containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d database

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "📦 Installing Laravel dependencies..."
docker-compose exec backend composer install

echo "🔑 Generating Laravel application key..."
docker-compose exec backend php artisan key:generate

echo "🗄️ Running database migrations..."
docker-compose exec backend php artisan migrate

echo "📦 Installing frontend dependencies..."
docker-compose exec frontend npm install

echo "🚀 Starting all services..."
docker-compose up -d

echo "✅ Setup complete! Your application should be available at:"
echo "   🌐 Frontend: http://localhost"
echo "   🔧 Backend API: http://localhost/api"
echo "   🗄️ Database: localhost:3306"
echo ""
echo "📊 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"

#!/bin/bash

echo "🚀 Starting Laravel application..."

# Wait for database
echo "⏳ Waiting for database..."
until nc -z database 3306; do 
  echo "Database not ready, waiting..."
  sleep 1
done
echo "✅ Database ready!"

# Install dependencies
echo "📦 Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader

# Generate application key
echo "🔑 Generating application key..."
php artisan key:generate --force

# Run migrations
echo "🗄️ Running database migrations..."
php artisan migrate --force

# Clear and cache config
echo "⚡ Optimizing application..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start the server
echo "🌐 Starting Laravel development server..."

# Start queue worker in background
echo "⚡ Starting queue worker..."
php artisan queue:work --daemon &

# Start the main server
php artisan serve --host=0.0.0.0 --port=9000

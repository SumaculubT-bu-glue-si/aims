#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
until nc -z -v -w30 database 3306; do
    echo "Waiting for database connection..."
    sleep 5
done
echo "Database is ready!"

# Set proper permissions
chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html/storage
chmod -R 755 /var/www/html/bootstrap/cache

# Generate application key if not set
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env file..."
    cp /var/www/html/.env.example /var/www/html/.env
fi

# Run Laravel setup
echo "Setting up Laravel..."
php artisan key:generate --force
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Try to run migrations
echo "Running migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

# Start Apache
echo "Starting Apache..."
apache2-foreground#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
until nc -z database 3306; do
    sleep 1
done
echo "Database is ready!"

# Run Laravel setup
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start Apache
apache2-foreground
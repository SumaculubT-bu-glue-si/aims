# Use PHP 8.2 CLI for running Artisan commands (OK for development)
FROM php:8.2-cli

# Set working directory
WORKDIR /var/www/html

# Install core dependencies, including netcat (nc)
# Use 'gnupg' for key management if needed, and clean up afterwards
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    netcat-traditional \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
# Copy from the official Composer image for simplicity
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application files (This content will be overwritten by the volume mount)
# KEEP this line, as it ensures all files are present initially for the build context
COPY . .

# Install dependencies (commented out for development with volume mounts)
# RUN composer install --no-dev --optimize-autoloader

# Set permissions for the web server user
# Note: The bind mount will override these, but it's good practice.
RUN chmod -R 775 storage bootstrap/cache

# Expose port for the 'php artisan serve' command
EXPOSE 9000

# Copy the startup script
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Set the entrypoint to the start script
CMD ["/start.sh"]
#!/bin/bash

# Database backup script
BACKUP_DIR="/opt/aims/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aims_database_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
docker-compose -f docker-compose.prod.yml exec -T database mysqldump -u admin_user -padmin123 studio_db > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Database backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"

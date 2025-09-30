#!/bin/bash

# Application backup script
BACKUP_DIR="/opt/aims/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="aims_application_${DATE}.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules and .git)
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=backups \
    --exclude=ssl \
    -C /opt/aims .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "aims_application_*.tar.gz" -mtime +7 -delete

echo "Application backup created: $BACKUP_DIR/$BACKUP_FILE"

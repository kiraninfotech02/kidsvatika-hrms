#!/bin/bash
# Kids Vatika HRMS - Automated Backup Script
# Usage: ./backup_runner.sh

set -e

BACKUP_DIR="/etc/kidsvatika/backups"
KEY_FILE="/etc/kidsvatika/backup_key.bin"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
ENCRYPTED_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.enc"

# 1. Execute dump
mysqldump -u root -p"$DB_PASSWORD" --single-transaction --quick --routines --triggers hrms_db > "$BACKUP_FILE"

# 2. Encrypt
openssl enc -aes-256-cbc -salt -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" -pass file:"$KEY_FILE"

# 3. Upload (Placeholder for actual cloud provider, e.g., AWS S3)
aws s3 cp "$ENCRYPTED_FILE" s3://kidsvatika-backups/production/

# 4. Pruning
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +30 -delete
rm "$BACKUP_FILE"

# 5. Notify
curl -X POST -d "chat_id=123&text=Backup Success: $ENCRYPTED_FILE" https://api.telegram.org/bot<TOKEN>/sendMessage

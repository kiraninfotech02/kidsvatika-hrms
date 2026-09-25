#!/bin/bash
# Kids Vatika HRMS - Database Restore Script
# Usage: ./restore_db.sh <encrypted_backup_file>

set -e

KEY_FILE="/etc/kidsvatika/backup_key.bin"
BACKUP_FILE=$1
DECRYPTED_FILE="/tmp/db_restore.sql"

# 1. Decrypt
openssl enc -d -aes-256-cbc -in "$BACKUP_FILE" -out "$DECRYPTED_FILE" -pass file:"$KEY_FILE"

# 2. Restore
mysql -u root -p"$DB_PASSWORD" hrms_db < "$DECRYPTED_FILE"

# 3. Cleanup
rm "$DECRYPTED_FILE"
echo "Restore completed successfully."

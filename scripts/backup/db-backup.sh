#!/bin/bash
#
# Financial Literacy Database Backup Script
# Runs daily via cron, keeps 7 days of backups
#
# Usage: ./db-backup.sh
# Cron:  0 3 * * * /root/Financial-Literacy-Toolkit/scripts/backup/db-backup.sh >> /var/log/finlit-backup.log 2>&1

set -e

# Configuration
BACKUP_DIR="/root/Financial-Literacy-Toolkit/backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="finlit_backup_${TIMESTAMP}.sql.gz"

# Database connection (via PgBouncer)
DB_HOST="localhost"
DB_PORT="6432"
DB_NAME="financial_literacy"
DB_USER="finlit_user"
DB_PASS="FinLit2025SecurePassword"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "Financial Literacy DB Backup"
echo "Started: $(date)"
echo "=========================================="

# Run pg_dump via docker (pgbouncer has psql)
echo "Creating backup: $BACKUP_FILE"

docker exec finlit-pgbouncer sh -c "PGPASSWORD='$DB_PASS' pg_dump -h finlit-postgres-db-g6ifwu -p 5432 -U $DB_USER -d $DB_NAME" | gzip > "$BACKUP_DIR/$BACKUP_FILE"

# Verify backup was created and has content
if [ -f "$BACKUP_DIR/$BACKUP_FILE" ] && [ -s "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "Backup created successfully: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "ERROR: Backup failed or empty!"
    exit 1
fi

# Clean up old backups (keep last N days)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "finlit_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/finlit_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "Backup completed: $(date)"
echo "=========================================="

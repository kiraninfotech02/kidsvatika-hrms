# Kids Vatika HRMS - Operations Runbook

## Server Bootstrapping
1. Deploy docker-compose stack: `docker-compose up -d`
2. Initialize DB: `cat schema.sql | docker exec -i mariadb mysql -u root -p hrms_db`
3. Seed Admin: `docker exec -i mariadb mysql -u root -p hrms_db < seed_admin.sql`

## Automated Maintenance (Crontab)
```cron
# Nightly Backup
0 2 * * * /app/scripts/backup_runner.sh
# Telemetry Pruning
0 0 * * * /app/scripts/prune_logs.sh
# Auto-Mark Attendance
0 18 * * * curl -X POST https://api.kidsvatika.com/api.php?action=auto-mark
```

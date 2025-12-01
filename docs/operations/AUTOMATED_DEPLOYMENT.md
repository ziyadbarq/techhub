# Automated Deployment System - Operations Guide

**Last Updated:** 2025-01-01
**System:** Barq Assets CMDB
**Deployment Type:** Automated Git polling with zero-downtime PM2 reloads

---

## Overview

The automated deployment system polls GitHub every 2 minutes and automatically deploys changes pushed to the `main` branch. It provides:

- **Zero-downtime deployments** via PM2 graceful reload
- **Automatic database backups** before each deployment
- **Health monitoring** with Pushover notifications
- **Manual rollback capability** via database restore

**Architecture:** 2-script solution
1. **`git-auto-deploy.sh`** - Cron orchestrator (polls GitHub, triggers deployments)
2. **`production-deploy.sh`** - 8-stage deployment pipeline

---

## How It Works

### **Deployment Flow**

```
Every 2 minutes → git-auto-deploy.sh (cron)
  ↓
Check for changes (git fetch + compare HEADs)
  ↓
If changes detected → production-deploy.sh
  ├─ Stage 1: Pre-flight checks
  ├─ Stage 2: Database backup (automatic)
  ├─ Stage 3: Dependencies + TypeScript type-check + Prisma generate
  ├─ Stage 4: Build application
  ├─ Stage 5: Database migrations
  ├─ Stage 6: Cache clear + smart seed
  ├─ Stage 7: PM2 graceful reload (0s downtime)
  └─ Stage 8: Health verification
  ↓
Pushover notification (success or failure)
```

**Deployment Time:** 2-5 minutes (typical: 3 minutes)
**Downtime:** 0 seconds (graceful reload)

---

## Server Configuration

### **Required Environment**

- **Server:** Oracle Cloud VM
- **Path:** `/home/opc/node-projects/barq-assets`
- **Users:**
  - `opc` - Git operations and deployment
  - `www` - Web server process owner
- **PM2:** Globally installed (`npm install -g pm2`)
- **PostgreSQL:** Running natively (not Docker)
- **Redis:** Running natively (Homebrew)

### **Cron Configuration**

**Location:** `opc` user crontab (`crontab -e`)

```bash
# Barq Assets Auto-Deployment (every 2 minutes)
*/2 * * * * /home/opc/node-projects/barq-assets/scripts/git-auto-deploy.sh >> /home/opc/node-projects/barq-assets/local/logs/cron.log 2>&1
```

**Verify cron is running:**
```bash
crontab -l  # List cron jobs
```

### **sudo Configuration**

**File:** `/etc/sudoers.d/barq-deploy`

```bash
# Allow opc user to manage file permissions without password
opc ALL=(ALL) NOPASSWD: /bin/chown -R www\:www /home/opc/node-projects/barq-assets
opc ALL=(ALL) NOPASSWD: /bin/chown -R opc\:opc /home/opc/node-projects/barq-assets
opc ALL=(ALL) NOPASSWD: /bin/chmod -R g+w /home/opc/node-projects/barq-assets
```

---

## Monitoring Deployments

### **Real-Time Monitoring**

**Monitor auto-deployment logs (monthly aggregated):**
```bash
tail -f /home/opc/node-projects/barq-assets/local/logs/auto-deploy-$(date +%Y%m).log
```

**Monitor cron execution:**
```bash
tail -f /home/opc/node-projects/barq-assets/local/logs/cron.log
```

**Monitor specific deployment (per-deployment logs):**
```bash
ls -lt /home/opc/node-projects/barq-assets/local/logs/deploy-*.log | head -5
tail -f /home/opc/node-projects/barq-assets/local/logs/deploy-YYYYMMDD_HHMMSS.log
```

### **PM2 Process Status**

```bash
pm2 status         # View process status
pm2 logs           # View real-time logs (all processes)
pm2 logs barq-web  # View web server logs only
pm2 logs barq-worker  # View worker logs only
```

### **Pushover Notifications**

Automatic notifications sent for:
- ✅ **Deployment Success** (commit range, duration, compare link)
- ❌ **Deployment Failure** (failed stage, exit code, log location)
- 🟢 **Health Recovery** (service restored, downtime)
- 🔴 **Health Alert** (service down, throttled to prevent spam)

---

## Manual Deployment (Testing)

**Trigger a full deployment manually:**

```bash
cd /home/opc/node-projects/barq-assets

# Fix permissions (required before deployment)
sudo chown -R opc:opc .

# Run deployment pipeline
bash scripts/production-deploy.sh

# Fix permissions back to www user
sudo chown -R www:www .
sudo chmod -R g+w .
```

**Use cases:**
- Testing deployment pipeline before enabling cron
- Deploying without waiting for next cron cycle
- Debugging deployment issues

---

## Rollback Procedures

### **Scenario 1: Deployment Failed (Migrations)**

**Symptoms:**
- Pushover notification: "Deployment failed at Migrations"
- Exit code: 50
- Old code still running (deployment halted before PM2 reload)

**Recovery Steps:**

```bash
# 1. SSH to server
ssh opc@your-server
cd /home/opc/node-projects/barq-assets

# 2. Find the failed deployment's backup
ls -lt local/backups/ | head -5

# 3. Restore database (latest backup auto-selected)
bash scripts/db-backup.sh restore --force --drop-schema

# 4. Reset git to previous working commit
git log --oneline -5  # Find last working commit
git reset --hard <previous-commit-sha>

# 5. Verify services still running
npm run pm2:status

# 6. Health check
curl http://localhost:2212/api/system-health
```

**Time:** ~2-3 minutes

---

### **Scenario 2: Deployment Succeeded but App Broken**

**Symptoms:**
- Deployment completed successfully
- Health checks pass
- Application has runtime errors (500 errors, crashes, etc.)

**Recovery Steps:**

```bash
# 1. SSH to server
ssh opc@your-server
cd /home/opc/node-projects/barq-assets

# 2. Restore database to pre-deployment state
bash scripts/db-backup.sh restore  # Interactive - select backup

# 3. Reset code to previous version
git log --oneline -10  # Find previous commit
git reset --hard HEAD~1  # Or specific commit SHA

# 4. Rebuild and restart
npm run build:fast
npm run pm2:restart

# 5. Verify health
curl http://localhost:2212/api/system-health
npm run pm2:logs
```

**Time:** ~5 minutes

---

### **Scenario 3: Emergency Rollback (Complete)**

**When:** Critical production issue, need immediate rollback

```bash
# 1. Stop auto-deployments (disable cron temporarily)
crontab -e  # Comment out the deployment cron job

# 2. Rollback database
bash scripts/db-backup.sh restore

# 3. Rollback code
git log --oneline -10
git reset --hard <known-good-commit>

# 4. Full rebuild
npm install
npm run db:generate
npm run build
npm run db:migrate:deploy

# 5. Restart services
npm run pm2:restart

# 6. Verify health
curl http://localhost:2212/api/system-health
npm run pm2:logs

# 7. Re-enable auto-deployments
crontab -e  # Uncomment the cron job
```

**Time:** ~10 minutes

---

## Troubleshooting

### **Problem: Deployment not triggering**

**Check:**
1. Cron running?
   ```bash
   crontab -l
   ```

2. Lock file stuck?
   ```bash
   ls -la /tmp/barq-deploy.lock
   # If older than 30 minutes, remove it:
   rm /tmp/barq-deploy.lock
   ```

3. Git fetch working?
   ```bash
   cd /home/opc/node-projects/barq-assets
   git fetch origin
   git status
   ```

4. Script permissions?
   ```bash
   ls -la scripts/git-auto-deploy.sh  # Should be 700 (executable)
   chmod +x scripts/git-auto-deploy.sh
   ```

---

### **Problem: Backup failing (Stage 2)**

**Check:**
1. `db-backup.sh` executable?
   ```bash
   chmod +x scripts/db-backup.sh
   ```

2. `local/backups/` writable?
   ```bash
   ls -ld local/backups
   mkdir -p local/backups
   chmod 700 local/backups
   ```

3. Database connectivity?
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

4. Disk space?
   ```bash
   df -h
   ```

---

### **Problem: PM2 reload failing (Stage 7)**

**Check:**
1. PM2 installed?
   ```bash
   pm2 --version
   # If not installed:
   npm install -g pm2
   ```

2. Ecosystem config valid?
   ```bash
   cat ecosystem.config.cjs  # Verify syntax
   ```

3. Processes exist?
   ```bash
   pm2 list
   # If empty, start manually:
   pm2 start ecosystem.config.cjs --env production
   pm2 save
   ```

4. Fallback to restart?
   ```bash
   # Script should auto-fallback, but manual restart:
   pm2 restart ecosystem.config.cjs --env production
   ```

---

### **Problem: Health check always failing (Stage 8)**

**Check:**
1. Health endpoint accessible?
   ```bash
   curl http://localhost:2212/api/system-health
   ```

2. Response format correct?
   ```bash
   # Should contain "overall":true
   curl http://localhost:2212/api/system-health | grep '"overall":true'
   ```

3. Database/Redis running?
   ```bash
   # Check services in health response
   curl http://localhost:2212/api/system-health | jq .
   ```

4. Timeout too short?
   ```bash
   # Health check retries 5 times with 10s intervals (50s total)
   # If services are slow to start, this may not be enough
   # Check Stage 8 in production-deploy.sh
   ```

---

## Log Management

### **Log Locations**

```
/home/opc/node-projects/barq-assets/local/logs/
├── auto-deploy-YYYYMM.log      # Monthly aggregated deployment logs
├── deploy-YYYYMMDD_HHMMSS.log  # Per-deployment detailed logs
└── cron.log                    # Cron execution logs
```

### **Log Rotation**

**Manual rotation (run monthly):**

```bash
cd /home/opc/node-projects/barq-assets/local/logs

# Archive old logs
tar -czf archive-$(date +%Y%m).tar.gz auto-deploy-*.log deploy-*.log
rm auto-deploy-*.log deploy-*.log

# Keep only last 3 months of archives
ls -t archive-*.tar.gz | tail -n +4 | xargs rm -f
```

**Or use logrotate (automated):**

Create `/etc/logrotate.d/barq-assets`:
```
/home/opc/node-projects/barq-assets/local/logs/*.log {
    monthly
    rotate 3
    compress
    missingok
    notifempty
}
```

---

## Backup Management

### **Automatic Backups**

- **Created:** Before every deployment (Stage 2)
- **Location:** `/home/opc/node-projects/barq-assets/local/backups/`
- **Format:** `barq-assets-YYYYMMDD_HHMMSS.sql`
- **Latest backup path:** Stored in `/tmp/barq-last-backup.txt`

### **Manual Backup**

```bash
# Create backup
bash scripts/db-backup.sh backup --force

# Create backup with custom filename
bash scripts/db-backup.sh backup --file local/backups/pre-maintenance-backup.sql --force
```

### **Restore from Backup**

```bash
# Interactive restore (auto-selects latest)
bash scripts/db-backup.sh restore

# Restore specific backup
bash scripts/db-backup.sh restore --file local/backups/barq-assets-20250101_120000.sql --force

# Restore with schema wipe (fixes drifted DB)
bash scripts/db-backup.sh restore --drop-schema --force
```

### **Backup Cleanup**

```bash
# List backups by size and date
ls -lhS local/backups/*.sql

# Remove backups older than 30 days
find local/backups/ -name "*.sql" -type f -mtime +30 -delete

# Keep only last 10 backups
ls -t local/backups/*.sql | tail -n +11 | xargs rm -f
```

---

## Exit Codes Reference

### **git-auto-deploy.sh**

| Code | Meaning |
|------|---------|
| 0 | Success (no changes or deployment succeeded) |
| 1 | Git fetch failed |
| 2 | Pre-validation failed (DB/Redis unreachable) |
| 3 | Deployment script failed (see production-deploy.sh exit code) |
| 4 | Health check failed post-deployment |

### **production-deploy.sh**

| Code | Stage | Meaning |
|------|-------|---------|
| 0 | - | Success |
| 10 | Stage 1 | Pre-flight checks failed (disk, env, connectivity) |
| 20 | Stage 2 | Database backup failed |
| 30 | Stage 3 | Dependencies/Prisma generate failed |
| 40 | Stage 4 | Build failed |
| 50 | Stage 5 | Migrations failed (CRITICAL) |
| 60 | Stage 6 | Cache/seed failed (non-critical) |
| 70 | Stage 7 | PM2 reload failed |
| 80 | Stage 8 | Health check failed (warning only) |

---

## Security Considerations

### **File Permissions**

```bash
# Scripts: executable by opc user only
chmod 700 scripts/*.sh

# Logs: readable by opc and www
chmod 750 local/logs/
chmod 640 local/logs/*.log

# Backups: readable by opc only (contains data)
chmod 700 local/backups/
chmod 600 local/backups/*.sql
```

### **Secrets Management**

- **Pushover credentials:** Stored in `.env.local` (not in git)
- **DATABASE_URL:** Loaded from `.env.local`
- **REDIS_URL:** Loaded from `.env.local`
- Scripts use `set +x` to avoid logging secrets
- Lock files use PIDs (not sensitive)

---

## Performance Benchmarks

### **Deployment Time Breakdown**

| Stage | Task | Time | Notes |
|-------|------|------|-------|
| 1 | Pre-flight checks | 5s | DB/Redis ping |
| 2 | Database backup | 10-30s | Depends on DB size |
| 3 | Dependencies + Type-check | 10-70s | npm install (cached) + tsc (5-10s) + Prisma |
| 4 | Build | 60-120s | Turbopack (fast mode) |
| 5 | Migrations | 5-30s | Depends on migration complexity |
| 6 | Cache/seed | 5-10s | Redis flush + smart seed |
| 7 | PM2 reload | 10-20s | Graceful reload |
| 8 | Health check | 10-50s | 5 retries, 10s interval |
| **Total** | | **2-5 min** | **Typical: 3 minutes** |

### **Downtime**

- **PM2 graceful reload:** 0 seconds
- **PM2 restart (fallback):** 5-10 seconds

---

## Operational Runbook

### **Daily Tasks**

- Monitor Pushover notifications for deployment failures
- Check health alerts for service disruptions

### **Weekly Tasks**

```bash
# Review deployment logs for patterns
cd /home/opc/node-projects/barq-assets/local/logs
grep "DEPLOYMENT FAILED" auto-deploy-*.log

# Check backup sizes
du -sh local/backups/*.sql | tail -10

# Verify PM2 processes
pm2 status
```

### **Monthly Tasks**

```bash
# Archive old logs
cd /home/opc/node-projects/barq-assets/local/logs
tar -czf archive-$(date +%Y%m).tar.gz auto-deploy-*.log deploy-*.log
rm auto-deploy-*.log deploy-*.log

# Clean old backups (keep 30 days)
find local/backups/ -name "*.sql" -type f -mtime +30 -delete

# Review PM2 memory usage
pm2 status  # Check memory restart count
```

---

## Emergency Contacts

**For deployment failures:**
1. Check Pushover notification for error details
2. Review deployment logs: `local/logs/deploy-YYYYMMDD_HHMMSS.log`
3. Rollback if necessary (see Rollback Procedures)

**For persistent issues:**
- Disable cron temporarily: `crontab -e` (comment out job)
- Contact development team with log files
- Document issue in deployment retrospective

---

## Related Documentation

- **[DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md)** - Development workflows
- **[PRISMA_GUIDE.md](../guides/PRISMA_GUIDE.md)** - Database operations
- **[SYSTEM_SETUP.md](../features/SYSTEM_SETUP.md)** - System administration
- **[DATABASE_SEEDING.md](../guides/DATABASE_SEEDING.md)** - Seeding system

---

**Document Version:** 1.0
**Last Reviewed:** 2025-01-01
**Next Review:** 2025-04-01

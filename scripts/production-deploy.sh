#!/bin/bash
# Production deployment pipeline for barq-assets
# Called by git-auto-deploy.sh when changes are detected
#
# Exit codes:
#   0  - Success
#   10 - Stage 1 failed (pre-flight)
#   20 - Stage 2 failed (backup)
#   30 - Stage 3 failed (dependencies)
#   40 - Stage 4 failed (build)
#   50 - Stage 5 failed (migrations)
#   60 - Stage 6 failed (cache/seed)
#   70 - Stage 7 failed (PM2 reload)
#   80 - Stage 8 failed (health check - warning only)

set -euo pipefail

# ========================================
# Configuration
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="$ROOT_DIR/local/logs"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d_%H%M%S).log"

# Flags
FORCE_INSTALL=false
for arg in "$@"; do
    if [ "$arg" = "--install" ]; then
        FORCE_INSTALL=true
    fi
done

# Load environment variables
if [ -f "$ROOT_DIR/.env.local" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$ROOT_DIR/.env.local"
    set +a
fi

# Health check URL
HEALTH_URL="${HEALTH_URL:-http://localhost:${PORT:-2212}/api/system-health}"

# ========================================
# Logging Functions
# ========================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

log_stage() {
    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "STAGE $1: $2"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

log_success() {
    log "✅ $1"
}

log_error() {
    log "❌ $1" >&2
}

log_warning() {
    log "⚠️  $1"
}

log_skip() {
    log "⏭️  $1"
}

# ========================================
# Utility Functions
# ========================================

# Run command with output logging
run_command() {
    local description="$1"
    shift
    log "Running: $description"

    if "$@" >> "$DEPLOY_LOG" 2>&1; then
        log_success "$description completed"
        return 0
    else
        log_error "$description failed"
        return 1
    fi
}

# Check if file/directory exists
file_exists() {
    [ -e "$1" ]
}

# Get file size in human-readable format
file_size() {
    du -sh "$1" 2>/dev/null | awk '{print $1}' || echo "unknown"
}

# ========================================
# STAGE 1: Pre-flight Checks
# ========================================

stage_preflight() {
    log_stage 1 "Pre-flight Checks"

    # Change to project directory
    if ! cd "$ROOT_DIR"; then
        log_error "Failed to change to project directory: $ROOT_DIR"
        exit 10
    fi
    log_success "Working directory: $ROOT_DIR"

    # Check disk space (require at least 5GB free)
    log "Checking disk space..."
    local available_kb
    if df -k "$ROOT_DIR" >/dev/null 2>&1; then
        available_kb=$(df -k "$ROOT_DIR" | tail -1 | awk '{print $4}')
        local available_gb=$((available_kb / 1024 / 1024))

        if [ "$available_gb" -lt 5 ]; then
            log_error "Insufficient disk space: ${available_gb}GB available (minimum 5GB required)"
            exit 10
        fi
        log_success "Disk space: ${available_gb}GB available"
    else
        log_warning "Could not check disk space (non-critical)"
    fi

    # Check Node.js version
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found"
        exit 10
    fi
    local node_version
    node_version=$(node --version)
    log_success "Node.js version: $node_version"

    # Check npm version
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        exit 10
    fi
    local npm_version
    npm_version=$(npm --version)
    log_success "npm version: $npm_version"

    # Validate environment variables
    log "Validating environment variables..."
    local missing_vars=()

    if [ -z "${DATABASE_URL:-}" ]; then
        missing_vars+=("DATABASE_URL")
    fi

    if [ -z "${REDIS_URL:-}" ]; then
        missing_vars+=("REDIS_URL")
    fi

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log "Create .env.local with required variables"
        exit 10
    fi

    log_success "Environment variables validated"

    # Check database connectivity
    log "Checking PostgreSQL connection..."
    if ! psql --dbname="$DATABASE_URL" --set ON_ERROR_STOP=1 -c "SELECT 1;" >/dev/null 2>&1; then
        log_error "PostgreSQL connection failed"
        log "Verify DATABASE_URL and ensure PostgreSQL is running"
        exit 10
    fi
    log_success "PostgreSQL connection successful"

    log_success "Pre-flight checks complete"
}

# ========================================
# STAGE 2: Database Backup
# ========================================

stage_backup() {
    log_stage 2 "Database Backup"

    # Create backup directory if missing
    local backup_dir="$ROOT_DIR/local/backups/db-script"
    mkdir -p "$backup_dir"

    # Ensure local temp directory exists for tracking last backup
    local tmp_dir="$ROOT_DIR/local/tmp"
    mkdir -p "$tmp_dir"

    # Retention policy: keep last 10 backups, remove older ones
    local retention_count=10
    local backup_glob="$backup_dir/barq-assets-"*".sql"
    # shellcheck disable=SC2206
    local backups=( $backup_glob )
    # If glob doesn't match, it returns the pattern itself; filter that out
    local valid_backups=()
    for f in "${backups[@]}"; do
        if [ -f "$f" ]; then
            valid_backups+=("$f")
        fi
    done
    if [ ${#valid_backups[@]} -gt "$retention_count" ]; then
        # Sort by modification time descending, keep newest N, delete the rest
        IFS=$'\n' read -r -d '' -a sorted_backups < <(ls -1t "${valid_backups[@]}" && printf '\0')
        local to_delete=("${sorted_backups[@]:$retention_count}")
        if [ ${#to_delete[@]} -gt 0 ]; then
            log "Pruning old backups (keeping last $retention_count)..."
            for old_backup in "${to_delete[@]}"; do
                if rm -f "$old_backup"; then
                    log "Deleted old backup: $(basename "$old_backup")"
                else
                    log_warning "Failed to delete old backup: $(basename "$old_backup")"
                fi
            done
        fi
    fi

    # Generate backup filename
    local backup_file="$backup_dir/barq-assets-$(date +%Y%m%d_%H%M%S).sql"

    # Call existing db-backup.sh script
    log "Creating database backup: $(basename "$backup_file")"

    if ! bash "$SCRIPT_DIR/db-backup.sh" backup --file "$backup_file" --env-file "$ROOT_DIR/.env.local" --force >> "$DEPLOY_LOG" 2>&1; then
        log_error "Database backup failed"
        exit 20
    fi

    # Verify backup was created
    if ! file_exists "$backup_file"; then
        log_error "Backup file was not created: $backup_file"
        exit 20
    fi

    local backup_size
    backup_size=$(file_size "$backup_file")
    log_success "Database backup created: $(basename "$backup_file") (${backup_size})"

    # Store backup path for potential rollback
    local last_backup_file="$tmp_dir/barq-last-backup.txt"
    echo "$backup_file" > "$last_backup_file"
    log "Backup path saved for rollback: $last_backup_file"
}

# ========================================
# STAGE 3: Dependencies & Prisma Generate
# ========================================

stage_dependencies() {
    log_stage 3 "Dependencies, Type-Check & Prisma Generation"

    # Install dependencies (include dev deps for type-checking)
    if [ "$FORCE_INSTALL" = true ]; then
        log "Force reinstall requested (--install): running npm ci --include=dev..."
        if ! run_command "npm ci --include=dev" npm ci --include=dev; then
            exit 30
        fi
    elif ! file_exists "$ROOT_DIR/node_modules"; then
        log "node_modules not found, running npm ci --include=dev for reproducible install (includes dev deps)..."
        if ! run_command "npm ci --include=dev" npm ci --include=dev; then
            exit 30
        fi
    else
        log_skip "node_modules exists (add --install to reinstall with dev deps)"
    fi

    # Run TypeScript type-check (safety net even though pre-commit hooks should catch this)
    log "Running TypeScript type-check..."
    if ! run_command "TypeScript type-check" npm run type-check; then
        log_error "Type-check failed - deployment halted"
        log "Fix TypeScript errors before deploying"
        exit 30
    fi

    # Generate Prisma client
    log "Generating Prisma client..."
    if ! run_command "Prisma generate" npm run db:generate; then
        exit 30
    fi

    log_success "Dependencies, type-check, and Prisma client ready"
}

# ========================================
# STAGE 4: Build Application
# ========================================

stage_build() {
    log_stage 4 "Build Application"

    # Remove existing build for clean build
    if file_exists "$ROOT_DIR/.next"; then
        log "Removing existing build..."
        rm -rf "$ROOT_DIR/.next"
        log_success "Old build removed"
    fi

    # Build application (fast mode - type-check already done in Stage 3)
    log "Building application..."
    if ! run_command "Next.js build" npm run build:fast; then
        log_error "Build failed"
        exit 40
    fi

    # Verify build directory was created
    if ! file_exists "$ROOT_DIR/.next"; then
        log_error "Build directory not created (.next missing)"
        exit 40
    fi

    local build_size
    build_size=$(file_size "$ROOT_DIR/.next")
    log_success "Build complete (${build_size})"
}

# ========================================
# STAGE 5: Database Migrations
# ========================================

stage_migrations() {
    log_stage 5 "Database Migrations"

    log "Applying database migrations..."

    # Run migrations using prisma migrate deploy
    # This is the production-safe migration command (no schema changes, only applies pending migrations)
    if ! run_command "Database migrations" npx dotenv -e .env.local -- prisma migrate deploy; then
        log_error "Database migrations failed"
        log "CRITICAL: Deployment halted before PM2 reload. Old code still running."
        log "To rollback database: bash scripts/db-backup.sh restore"
        exit 50
    fi

    log_success "Database migrations applied successfully"
}

# ========================================
# STAGE 6: Cache Clear & Smart Seed
# ========================================

stage_cache_seed() {
    log_stage 6 "Cache Clear & Smart Seed"

    # Clear Redis cache
    log "Clearing Redis cache..."

    # Use Node.js script for Redis cache clear (more reliable than redis-cli)
    # Run from project directory to access node_modules
    cat > "$ROOT_DIR/.cache-clear-temp.mjs" << 'EOF'
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
    connectTimeout: 5000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
});

try {
    await redis.connect();
    await redis.flushdb();
    await redis.quit();
    console.log('✓ Redis cache cleared');
    process.exit(0);
} catch (error) {
    console.error('✗ Redis cache clear failed:', error.message);
    await redis.quit().catch(() => {});
    process.exit(1);
}
EOF

    if cd "$ROOT_DIR" && npx dotenv -e .env.local -- node .cache-clear-temp.mjs >> "$DEPLOY_LOG" 2>&1; then
        log_success "Redis cache cleared"
    else
        log_warning "Redis cache clear failed (non-critical, continuing)"
    fi

    rm -f "$ROOT_DIR/.cache-clear-temp.mjs"

    # Always run production seeder (idempotent)
    log "Running database seeding (production preset)..."
    if ! run_command "Database seeding" npx dotenv -e .env.local -- npx tsx src/infrastructure/database/prisma/seed.ts production; then
        log_warning "Database seeding failed (non-critical, continuing)"
    else
        log_success "Database seeded successfully"
    fi

    log_success "Cache and seed stage complete"
}

# ========================================
# STAGE 7: PM2 Graceful Reload
# ========================================

stage_pm2_reload() {
    log_stage 7 "PM2 Graceful Reload (Zero-Downtime)"

    # Check if PM2 is installed
    if ! command -v pm2 >/dev/null 2>&1; then
        log_error "PM2 is not installed"
        log "Install PM2 globally: npm install -g pm2"
        exit 70
    fi

    local pm2_version
    pm2_version=$(pm2 --version)
    log "PM2 version: $pm2_version"

    # Check if ecosystem config exists
    if ! file_exists "$ROOT_DIR/ecosystem.config.cjs"; then
        log_error "ecosystem.config.cjs not found"
        exit 70
    fi

    # Try graceful reload first (zero-downtime)
    log "Attempting PM2 graceful reload..."

    if pm2 reload ecosystem.config.cjs --env production >> "$DEPLOY_LOG" 2>&1; then
        log_success "PM2 graceful reload successful (zero-downtime)"
    else
        log_warning "PM2 reload failed, falling back to restart (5-10s downtime)"

        # Fallback to restart
        if ! pm2 restart ecosystem.config.cjs --env production >> "$DEPLOY_LOG" 2>&1; then
            log_error "PM2 restart failed"
            exit 70
        fi

        log_success "PM2 restart successful"
    fi

    # Save PM2 process list
    if pm2 save >> "$DEPLOY_LOG" 2>&1; then
        log "PM2 process list saved"
    fi

    # Get PM2 status
    log "PM2 process status:"
    pm2 list | tee -a "$DEPLOY_LOG"

    log_success "PM2 reload complete"
}

# ========================================
# STAGE 8: Health Verification
# ========================================

stage_health_check() {
    log_stage 8 "Health Verification"

    local max_attempts=5
    local interval=10
    local attempt=1

    # Helper to evaluate health JSON (supports top-level overall or success+data.overall)
    is_health_ok() {
        local response="$1"
        local compact
        compact=$(echo "$response" | tr -d '\n\r\t ')

        echo "$compact" | grep -q '"overall":true' && return 0

        if echo "$compact" | grep -q '"success":true' && echo "$compact" | grep -q '"data":{.*"overall":true'; then
            return 0
        fi

        return 1
    }

    log "Health check URL: $HEALTH_URL"
    log "Retry policy: $max_attempts attempts, ${interval}s interval"

    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"

        # Attempt health check
        local response
        if response=$(curl -fsS --max-time 5 "$HEALTH_URL" 2>/dev/null); then
            # Check if response contains "overall":true (top-level or nested under data)
            if is_health_ok "$response"; then
                log_success "Health check passed ✓"
                log "Response: $response"
                return 0
            else
                log_warning "Health check returned unhealthy status"
                log "Response: $response"
            fi
        else
            log_warning "Health check request failed (endpoint unreachable)"
        fi

        # Wait before retry (unless last attempt)
        if [ $attempt -lt $max_attempts ]; then
            log "Waiting ${interval}s before retry..."
            sleep $interval
        fi

        attempt=$((attempt + 1))
    done

    log_error "Health check failed after $max_attempts attempts"
    log "Deployment is considered successful, but services may be unhealthy"
    log "Manual verification recommended: curl $HEALTH_URL"

    # Exit with warning code (deployment still considered successful)
    exit 80
}

# ========================================
# Main Execution
# ========================================

main() {
    local start_time
    start_time=$(date +%s)

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Log deployment start
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "BARQ ASSETS - PRODUCTION DEPLOYMENT PIPELINE"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    log "Log file: $DEPLOY_LOG"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Execute deployment stages
    stage_preflight
    stage_backup
    stage_dependencies
    stage_build
    stage_migrations
    stage_cache_seed
    stage_pm2_reload
    stage_health_check

    # Calculate duration
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Log success
    log ""
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "✅ DEPLOYMENT COMPLETE"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log "Duration: ${duration}s"
    log "Log file: $DEPLOY_LOG"
    log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log ""

    exit 0
}

# Execute main function
main "$@"

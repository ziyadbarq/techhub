#!/bin/bash
# Production deployment pipeline for techhub
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

# Source common deployment utilities
COMMON_LIB="$SCRIPT_DIR/lib/common.sh"
if [ -f "$COMMON_LIB" ]; then
    # shellcheck disable=SC1090
    source "$COMMON_LIB"
fi

# Initial guess: repo root (script lives in scripts/deploy)
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
LOG_DIR=""
DEPLOY_LOG=""

# Flags
FORCE_INSTALL=false
for arg in "$@"; do
    if [ "$arg" = "--install" ]; then
        FORCE_INSTALL=true
    fi
done

# Resolve project root by locating package.json and next.config.ts
ensure_project_root() {
    # Try git to get the real repo root first
    if command -v git >/dev/null 2>&1; then
        local git_root
        git_root=$(cd "$SCRIPT_DIR" && git rev-parse --show-toplevel 2>/dev/null || true)
        if [ -n "$git_root" ] && [ -d "$git_root" ]; then
            ROOT_DIR="$git_root"
        fi
    fi

    # If still missing markers, walk up from script dir until we find them
    if [ ! -f "$ROOT_DIR/package.json" ] || [ ! -f "$ROOT_DIR/next.config.ts" ]; then
        local dir="$SCRIPT_DIR"
        while [ "$dir" != "/" ]; do
            if [ -f "$dir/package.json" ] && [ -f "$dir/next.config.ts" ]; then
                ROOT_DIR="$dir"
                break
            fi
            dir=$(dirname "$dir")
        done
    fi

    if [ ! -f "$ROOT_DIR/package.json" ] || [ ! -f "$ROOT_DIR/next.config.ts" ]; then
        echo "❌ ERROR: Could not locate project root (package.json + next.config.ts)" >&2
        exit 10
    fi
}

ensure_project_root

# Now that ROOT_DIR is confirmed, set log paths
LOG_DIR="$ROOT_DIR/local/logs"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d_%H%M%S).log"

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

# Run command with retries (default 3 attempts)
run_with_retry() {
    local attempts="$1"
    local description="$2"
    shift 2

    local try=1
    while [ "$try" -le "$attempts" ]; do
        local label="$description (attempt $try/$attempts)"
        if run_command "$label" "$@"; then
            return 0
        fi

        if [ "$try" -lt "$attempts" ]; then
            log_warning "$description failed on attempt $try, retrying..."
            sleep 2
        fi

        try=$((try + 1))
    done

    return 1
}

log_latest_npm_debug() {
    local latest_log
    latest_log=$(ls -1t "$ROOT_DIR/local/.npm-cache/_logs/"* "$HOME/.npm/_logs/"* 2>/dev/null | head -1 || true)

    if [ -n "$latest_log" ] && [ -f "$latest_log" ]; then
        log "npm debug log: $(basename "$latest_log")"
        tail -n 120 "$latest_log" | sed 's/^/    /' | tee -a "$DEPLOY_LOG" || true
    fi
}

repair_husky_permissions() {
    if [ -d "$ROOT_DIR/.husky" ]; then
        chmod -R u+rwX,g+rwX "$ROOT_DIR/.husky" >/dev/null 2>&1 || true
        # Remove stale generated file that often triggers EPERM during husky prepare
        rm -f "$ROOT_DIR/.husky/_/h" >/dev/null 2>&1 || true
        mkdir -p "$ROOT_DIR/.husky/_" >/dev/null 2>&1 || true
    fi
}

clean_node_modules() {
    if [ -d "$ROOT_DIR/node_modules" ]; then
        local nm_size
        nm_size=$(du -sh "$ROOT_DIR/node_modules" 2>/dev/null | awk '{print $1}' || echo "unknown")
        log "Removing existing node_modules (size: ${nm_size:-unknown})..."
        rm -rf "$ROOT_DIR/node_modules" >/dev/null 2>&1 || true
    fi
}

get_mtime() {
    local path="$1"
    # Linux stat
    if stat -c %y "$path" >/dev/null 2>&1; then
        stat -c %y "$path" 2>/dev/null | head -n 1
    # macOS stat
    elif stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$path" >/dev/null 2>&1; then
        stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$path" 2>/dev/null | head -n 1
    else
        echo "unknown"
    fi
}

log_node_modules_state() {
    if [ -d "$ROOT_DIR/node_modules" ]; then
        local nm_size nm_mtime
        nm_size=$(du -sh "$ROOT_DIR/node_modules" 2>/dev/null | awk '{print $1}' || echo "unknown")
        nm_mtime=$(get_mtime "$ROOT_DIR/node_modules")
        log "node_modules present (size: ${nm_size:-unknown}, mtime: ${nm_mtime:-unknown})"
    else
        log "node_modules not present"
    fi
}

prepare_npm_environment() {
    mkdir -p "$ROOT_DIR/local/.npm-cache" >/dev/null 2>&1 || true
    chmod -R u+rwX,g+rwX "$ROOT_DIR/local/.npm-cache" >/dev/null 2>&1 || true
    export NPM_CONFIG_CACHE="$ROOT_DIR/local/.npm-cache"
    export NPM_CONFIG_PROGRESS=false
    export NPM_CONFIG_FUND=false
    export NPM_CONFIG_AUDIT=false
}

ensure_workspace_access() {
    # Make sure opc owns the project tree (including build/install dirs) even if www touched it
    log "Normalizing ownership to $(whoami):$(whoami) for project workspace..."
    sudo chown -R "$(whoami)":"$(whoami)" "$ROOT_DIR" >/dev/null 2>&1 || true
    chmod -R u+rwX "$ROOT_DIR" >/dev/null 2>&1 || true

    # Explicitly ensure these critical directories are writable
    for path in "$ROOT_DIR/node_modules" "$ROOT_DIR/.next"; do
        if [ -d "$path" ]; then
            chmod -R u+rwX "$path" >/dev/null 2>&1 || true
        fi
    done
}

install_dependencies_resilient() {
    local max_attempts=3
    local attempt=1

    prepare_npm_environment

    while [ "$attempt" -le "$max_attempts" ]; do
        # Use npm ci for deterministic installs; last attempt falls back to npm install
        # Install with dev deps for type-checking and CLI tools (prisma, dotenv) needed throughout deployment
        local cmd
        if [ "$attempt" -lt "$max_attempts" ]; then
            cmd="npm ci --include=dev"
        else
            cmd="npm install"
        fi

        log "Running: $cmd (HUSKY=0, attempt $attempt/$max_attempts)"

        # Check npm version to determine if --unsafe-perm is needed (deprecated in npm 7+)
        local npm_major
        npm_major=$(npm --version | cut -d. -f1)
        local npm_flags="--foreground-scripts --no-progress"
        if [ "$npm_major" -lt 7 ]; then
            npm_flags="--unsafe-perm $npm_flags"
        fi

        # Allow scripts to run with current user and skip husky hooks
        if env HUSKY=0 $cmd $npm_flags >> "$DEPLOY_LOG" 2>&1; then
            log_success "$cmd completed"
            return 0
        fi

        local npm_exit=$?
        log_error "$cmd failed (attempt $attempt, exit $npm_exit)"
        log_latest_npm_debug

        if [ "$attempt" -lt "$max_attempts" ]; then
        log_warning "Repairing install state before retry..."
        repair_husky_permissions
        clean_node_modules
        npm cache verify >> "$DEPLOY_LOG" 2>&1 || true
        sleep 3
        log_node_modules_state
        fi

        attempt=$((attempt + 1))
    done

    log_node_modules_state

    return 1
}

# Check if file/directory exists
file_exists() {
    [ -e "$1" ]
}

# Get file size in human-readable format
file_size() {
    du -sh "$1" 2>/dev/null | awk '{print $1}' || echo "unknown"
}

get_pm2_status() {
    local name="$1"
    local raw status fallback

    # Try jlist (with noisy banners stripped)
    raw=$(pm2 jlist --silent 2>/dev/null | sed -n '/^\[/,$p')

    # Fallback: describe single process
    if [ -z "$raw" ]; then
        raw=$(pm2 describe "$name" --json 2>/dev/null | sed -n '/^\[/,$p')
    fi

    if [ -n "$raw" ]; then
        status=$(echo "$raw" | jq -r '.[] | select(.name=="'"$name"'") | .pm2_env.status' 2>/dev/null || true)
    fi

    # Last resort: parse pm2 list table for "online"
    if [ -z "$status" ] || [ "$status" = "null" ]; then
        if pm2 list 2>/dev/null | grep -E "[[:space:]]$name[[:space:]]" | grep -q "online"; then
            status="online"
        fi
    fi

    echo "${status:-unknown}"
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
    log "Resolved project root: $ROOT_DIR"

    # Guard: required root files
    if [ ! -f "$ROOT_DIR/next.config.ts" ]; then
        log_error "next.config.ts not found at $ROOT_DIR (invalid project root)"
        exit 10
    fi
    if [ ! -f "$ROOT_DIR/package.json" ]; then
        log_error "package.json not found at $ROOT_DIR (invalid project root)"
        exit 10
    fi

    # Ensure current user can read/write key directories (may be owned by www)
    ensure_workspace_access

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

    # Check jq availability (required for JSON parsing)
    if ! check_jq_available; then
        log_error "jq not found (required for JSON parsing)"
        log "Install: brew install jq"
        exit 10
    fi
    local jq_version
    jq_version=$(jq --version)
    log_success "jq available: $jq_version"

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

    # Validate PORT environment variable
    if [ -z "${PORT:-}" ]; then
        log_warning "PORT not set, using default 2212"
        export PORT=2212
    fi
    log_success "Application port: $PORT"

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
    local backup_glob="$backup_dir/techhub-"*".sql"
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
    local backup_file="$backup_dir/techhub-$(date +%Y%m%d_%H%M%S).sql"

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
    local last_backup_file="$tmp_dir/techhub-last-backup.txt"
    echo "$backup_file" > "$last_backup_file"
    log "Backup path saved for rollback: $last_backup_file"
}

# ========================================
# STAGE 3: Dependencies & Prisma Generate
# ========================================

stage_dependencies() {
    log_stage 3 "Dependencies, Type-Check & Prisma Generation"

    # Ensure husky directory is writable (deployment runs without hooks)
    if [ -d "$ROOT_DIR/.husky" ]; then
        chmod -R u+rwX,g+rwX "$ROOT_DIR/.husky" >/dev/null 2>&1 || true
    fi

    log_node_modules_state

    # Install dependencies (include dev deps for type-checking and CLI tools)
    # Note: Dev deps required for TypeScript type-check during deployment (acts as CI/CD gate)
    # and for CLI tools (prisma, dotenv) used in later stages (migrations, seeding)
    if [ "$FORCE_INSTALL" = true ]; then
        log "Force reinstall requested (--install): running npm ci --include=dev (HUSKY=0, resilient)..."
        clean_node_modules
        if ! install_dependencies_resilient; then
            exit 30
        fi
    elif ! file_exists "$ROOT_DIR/node_modules"; then
        log "node_modules not found, running npm ci --include=dev with HUSKY=0 (includes dev deps, resilient)..."
        if ! install_dependencies_resilient; then
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
    log_node_modules_state
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

    # Verify build output and normalize to .next if needed
    local build_dir_path=""
    local build_dir_label=""
    for candidate in ".next" ".next-turbo" "out" "dist"; do
        if file_exists "$ROOT_DIR/$candidate"; then
            build_dir_path="$ROOT_DIR/$candidate"
            build_dir_label="$candidate"
            break
        fi
    done

    # Fallback: search for .next anywhere in the project (e.g., Next output redirect)
    if [ -z "$build_dir_path" ]; then
        build_dir_path=$(find "$ROOT_DIR" -maxdepth 2 -type d -name ".next" | head -1 || true)
        if [ -n "$build_dir_path" ]; then
            build_dir_label=$(basename "$build_dir_path")
        fi
    fi

    if [ -z "$build_dir_path" ]; then
        log_error "Build directory not created (.next missing)"
        log "Root directory listing (recent):"
        ls -lhat "$ROOT_DIR" | head -n 40 | sed 's/^/    /' | tee -a "$DEPLOY_LOG" || true
        log "Find .next result:"
        find "$ROOT_DIR" -maxdepth 2 -type d -name ".next" | sed 's/^/    /' | tee -a "$DEPLOY_LOG" || true
        exit 40
    fi

    if [ "$build_dir_path" != "$ROOT_DIR/.next" ]; then
        log_warning "Build output located at ${build_dir_label:-$build_dir_path} (expected .next). Normalizing..."
        rm -rf "$ROOT_DIR/.next" >/dev/null 2>&1 || true
        mv "$build_dir_path" "$ROOT_DIR/.next"
        log_success "Build output moved to .next"
    fi

    local build_size
    build_size=$(file_size "$ROOT_DIR/.next")
    log_success "Build complete (${build_size})"

    # NOTE: Pruning dev dependencies previously caused deploy failures because CLI tools (prisma, dotenv)
    # live in devDependencies. Skip pruning to keep required executables available during deployment.
    log "Skipping dev dependency pruning to retain required CLI tools"
}

# ========================================
# STAGE 5: Database Migrations
# ========================================

stage_migrations() {
    log_stage 5 "Database Migrations"

    log "Applying database migrations..."

    # Run migrations using prisma migrate deploy
    # This is the production-safe migration command (no schema changes, only applies pending migrations)
    if ! run_command "Database migrations" npx prisma migrate deploy; then
        log_error "Database migrations failed"
        log "CRITICAL: Deployment halted before PM2 reload. Old code still running."
        log "To rollback database: bash scripts/deploy/db-backup.sh restore"
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

    if cd "$ROOT_DIR" && node .cache-clear-temp.mjs >> "$DEPLOY_LOG" 2>&1; then
        log_success "Redis cache cleared"
    else
        log_warning "Redis cache clear failed (non-critical, continuing)"
    fi

    rm -f "$ROOT_DIR/.cache-clear-temp.mjs"

    # Always run production seeder (idempotent)
    log "Running database seeding (production preset)..."
    if ! run_command "Database seeding" npx tsx src/infrastructure/database/prisma/seed.ts production; then
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

    # ========================================
    # Verify both processes started (web + worker)
    # ========================================

    log "Verifying PM2 processes..."

    # Check if jq is available for JSON parsing
    if ! command -v jq >/dev/null 2>&1; then
        log_warning "jq not installed, skipping detailed process verification"
        log "Install jq for better process monitoring: brew install jq"
    else
        # Verify web process
        local web_status
        web_status=$(get_pm2_status "barq-web")

        if [ "$web_status" = "online" ]; then
            log_success "barq-web is online ✓"
        else
            log_error "barq-web is not online (status: $web_status)"
            log "PM2 process list:"
            pm2 list | tee -a "$DEPLOY_LOG"
            log "Check logs: pm2 logs barq-web --lines 50"
            exit 70
        fi

        # Verify worker process (non-blocking)
        local worker_status
        worker_status=$(get_pm2_status "barq-worker")

        if [ "$worker_status" = "online" ]; then
            log_success "barq-worker is online ✓"
        else
            log_warning "barq-worker is not online (status: $worker_status)"

            # Get worker restart count for debugging
            local worker_restarts
            worker_restarts=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="barq-worker") | .pm2_env.restart_time' || echo "0")
            log "Worker restart count: $worker_restarts"

            # Show recent worker errors
            log "Recent worker errors:"
            pm2 logs barq-worker --lines 20 --nostream --err 2>&1 | tail -n 20 | tee -a "$DEPLOY_LOG" || true

            log_warning "Worker failed to start, but deployment continues"
            log "Background jobs will not execute until worker is started"
            log "Manual fix: pm2 restart barq-worker && pm2 logs barq-worker"
        fi
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

    # Helper to evaluate health JSON (checks core services for deployment gate)
    is_health_ok() {
        local response="$1"
        local compact
        compact=$(echo "$response" | tr -d '\n\r\t ')

        # NEW: Check coreServicesHealthy first (deployment gate - core services only)
        echo "$compact" | grep -q '"coreServicesHealthy":true' && return 0

        # FALLBACK: Check overall if coreServicesHealthy field missing (backward compatibility)
        echo "$compact" | grep -q '"overall":true' && return 0

        # Support nested data structure (success + data.coreServicesHealthy or data.overall)
        if echo "$compact" | grep -q '"success":true' && echo "$compact" | grep -q '"data":{.*"coreServicesHealthy":true'; then
            return 0
        fi

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

    # Record deployment start metric
    if command -v record_deployment_metric >/dev/null 2>&1; then
        record_deployment_metric "deployment_started" "1"
    fi

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

    # Record deployment metrics
    if command -v record_deployment_metric >/dev/null 2>&1; then
        record_deployment_metric "deployment_duration_seconds" "$duration"
        record_deployment_metric "deployment_success" "1"

        # Record build size if available
        if [ -d "$ROOT_DIR/.next" ]; then
            local build_size_mb
            build_size_mb=$(du -sm "$ROOT_DIR/.next" 2>/dev/null | awk '{print $1}' || echo "0")
            record_deployment_metric "build_size_mb" "$build_size_mb"
        fi
    fi

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

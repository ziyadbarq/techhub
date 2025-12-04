#!/bin/bash
# Auto-deployment script for barq-assets
# Polls GitHub and deploys when changes detected on main branch
#
# CONFIGURATION:
#   Repository: azzuwayed/barq-assets (Private GitHub)
#   Server: Oracle Cloud VM at /home/opc/node-projects/barq-assets
#   Deployment Method: Git polling (no webhooks - VPN-only inbound)
#   Branch: main only
#   Notifications: Pushover (success, failure, health alerts)
#   Validation: Skipped (pre-commit hooks handle it)
#   Rollback: Manual via scripts/db-backup.sh
#   Downtime: ~0s via PM2 graceful reload
#   aaPanel: Keep for monitoring, PM2 handles deployments
#
# Run via cron: */2 * * * * /home/opc/node-projects/barq-assets/scripts/git-auto-deploy.sh
# Manual: scripts/deploy/git-auto-deploy.sh [--force|--skip-git-check]

set -euo pipefail

# ========================================
# Configuration
# ========================================

PROJECT_DIR="/home/opc/node-projects/barq-assets"
LOG_DIR="$PROJECT_DIR/local/logs"
LOG_FILE="$LOG_DIR/auto-deploy-$(date +%Y%m).log"  # Monthly aggregated log
LOCK_FILE="/tmp/barq-deploy.lock"
LOCK_TIMEOUT=1800  # 30 minutes - stale lock threshold
WEB_USER="www"
WEB_GROUP="www"

# Source environment variables from .env.local if it exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
    set -a
    # shellcheck disable=SC1090
    source "$PROJECT_DIR/.env.local"
    set +a
fi

# Pushover notifications (set these in environment or .env.local)
PUSHOVER_USER_KEY="${PUSHOVER_USER_KEY:-}"
PUSHOVER_API_TOKEN="${PUSHOVER_API_TOKEN:-}"

# Healthcheck URL (can be overridden via HEALTH_URL env)
HEALTH_URL="${HEALTH_URL:-http://10.100.12.108:${PORT:-2212}/api/system-health}"

# Sound for critical health alerts (can override in env)
HEALTH_ALERT_SOUND="${HEALTH_ALERT_SOUND:-siren}"

# Health alert throttling - state file to prevent spam during outages
# Uses /tmp directory to persist across runs
HEALTH_ALERT_FILE="/tmp/barq-health-alert-sent"

# GitHub repo URL for compare links
GITHUB_REPO_URL="https://github.com/azzuwayed/barq-assets"

# Optional flags
FORCE_DEPLOY=0

# ========================================
# Helpers
# ========================================

# Try to infer last deployment stage from the most recent deploy log
infer_stage_from_latest_deploy_log() {
    # Find most recent deploy log (sorted by mtime)
    local latest_log
    latest_log=$(ls -1t "$LOG_DIR"/deploy-*.log 2>/dev/null | head -1 || true)

    if [ -z "$latest_log" ] || [ ! -f "$latest_log" ]; then
        return
    fi

    # Extract the last logged stage title: "STAGE X: <name>"
    local inferred
    inferred=$(grep -a "STAGE " "$latest_log" | tail -1 | sed -E 's/.*STAGE [0-9]+: //')

    if [ -n "$inferred" ]; then
        echo "$inferred"
    fi
}

# ========================================
# Argument Parsing
# ========================================

parse_args() {
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --force|--skip-git-check)
                FORCE_DEPLOY=1
                ;;
            -h|--help)
                echo "Usage: $0 [--force|--skip-git-check]" >&2
                echo "  --force / --skip-git-check   Deploy even if git shows no changes" >&2
                exit 0
                ;;
            *)
                echo "Unknown option: $1" >&2
                exit 1
                ;;
        esac
        shift
    done
}

# ========================================
# Logging Functions
# ========================================

log() {
    echo "→ $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "✗ ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_separator() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
}

# ========================================
# Notification Functions
# ========================================

# Send Pushover notification
# Usage: notify "Title" "Message" [priority] [sound]
notify() {
    local title="$1"
    local message="$2"
    local priority="${3:-0}"
    local sound="${4:-}"

    if [ -z "$PUSHOVER_USER_KEY" ] || [ -z "$PUSHOVER_API_TOKEN" ]; then
        return 0
    fi

    # Build curl command with optional sound
    if [ -n "$sound" ]; then
        response=$(curl -s --retry 2 --max-time 10 \
            --form-string "token=$PUSHOVER_API_TOKEN" \
            --form-string "user=$PUSHOVER_USER_KEY" \
            --form-string "title=$title" \
            --form-string "message=$message" \
            --form-string "priority=$priority" \
            --form-string "sound=$sound" \
            https://api.pushover.net/1/messages.json 2>&1)
    else
        response=$(curl -s --retry 2 --max-time 10 \
            --form-string "token=$PUSHOVER_API_TOKEN" \
            --form-string "user=$PUSHOVER_USER_KEY" \
            --form-string "title=$title" \
            --form-string "message=$message" \
            --form-string "priority=$priority" \
            https://api.pushover.net/1/messages.json 2>&1)
    fi

    if echo "$response" | grep -q '"status":1'; then
        echo "→ Push notification sent" | tee -a "$LOG_FILE"
    else
        echo "✗ Push notification failed: $response" | tee -a "$LOG_FILE" >&2
    fi
}

notify_deployment_success() {
    local from_sha="$1"
    local to_sha="$2"
    local duration="$3"
    local from_short="${from_sha:0:7}"
    local to_short="${to_sha:0:7}"

    local msg="✅ Deployed ${from_short} → ${to_short}"
    msg+=$'\n'"⏱️  Duration: ${duration}s"
    msg+=$'\n'"🔗 ${GITHUB_REPO_URL}/compare/${from_short}...${to_short}"

    notify "Barq Deployment Success" "$msg" 0
}

notify_deployment_failure() {
    local from_sha="$1"
    local to_sha="$2"
    local stage="$3"
    local exit_code="$4"
    local from_short="${from_sha:0:7}"
    local to_short="${to_sha:0:7}"

    local msg="❌ Deployment failed at ${stage}"
    msg+=$'\n'"📝 ${from_short} → ${to_short}"
    msg+=$'\n'"🔴 Exit code: ${exit_code}"
    msg+=$'\n'"📋 Check logs: local/logs/"
    msg+=$'\n'"🔗 ${GITHUB_REPO_URL}/compare/${from_short}...${to_short}"

    notify "Barq Deployment Failed" "$msg" 1
}

notify_deployment_warning() {
    local from_sha="$1"
    local to_sha="$2"
    local reason="$3"
    local details="$4"
    local from_short="${from_sha:0:7}"
    local to_short="${to_sha:0:7}"

    local msg="⚠️  Deployment succeeded with warnings"
    msg+=$'\n'"📝 ${from_short} → ${to_short}"
    msg+=$'\n'"🟡 ${reason}"
    msg+=$'\n'"💬 ${details}"
    msg+=$'\n'"📋 Check: pm2 list | grep worker"
    msg+=$'\n'"🔗 ${GITHUB_REPO_URL}/compare/${from_short}...${to_short}"

    # Priority 0 (normal), default sound (not siren)
    notify "Barq Deployment Warning" "$msg" 0
}

notify_worker_unavailable() {
    local msg="⚠️  Background worker is not running"
    msg+=$'\n'"❌ Worker: Offline"
    msg+=$'\n'""
    msg+=$'\n'"Impact:"
    msg+=$'\n'"  • Scheduled jobs won't execute"
    msg+=$'\n'"  • Maintenance tasks paused"
    msg+=$'\n'"  • Intune sync disabled"
    msg+=$'\n'""
    msg+=$'\n'"Diagnostics:"
    msg+=$'\n'"  npm run worker:health"
    msg+=$'\n'"  pm2 logs barq-worker"
    msg+=$'\n'""
    msg+=$'\n'"Action Required:"
    msg+=$'\n'"  pm2 restart barq-worker"

    # Priority 0 (normal - informational), default sound
    notify "Barq Worker Unavailable" "$msg" 0
}

notify_health_critical() {
    local msg="$1"
    # Health-specific, very clear title, high priority, loud sound
    notify "BARQ-ASSETS HEALTH ALERT" "$msg" 1 "$HEALTH_ALERT_SOUND"
}

# ========================================
# Health Check Functions
# ========================================

# Parse health response JSON into readable format (no jq dependency)
# Usage: parse_health_response "$json_response"
parse_health_response() {
    local response="$1"
    local msg=""

    # Normalize: remove newlines and extra spaces for consistent matching
    local normalized
    normalized=$(echo "$response" | tr -d '\n\r\t' | sed 's/  */ /g')

    # Database - look for "database" section with "connected":true (flexible whitespace)
    if echo "$normalized" | grep -qE '"database"[^}]*"connected"\s*:\s*true'; then
        msg+="✅ DB"
    elif echo "$normalized" | grep -q '"database"'; then
        msg+="❌ DB"
    else
        msg+="❓ DB"
    fi

    # Redis
    if echo "$normalized" | grep -qE '"redis"[^}]*"connected"\s*:\s*true'; then
        msg+=" ✅ Redis"
    elif echo "$normalized" | grep -q '"redis"'; then
        msg+=" ❌ Redis"
    else
        msg+=" ❓ Redis"
    fi

    # Environment
    if echo "$normalized" | grep -qE '"environment"[^}]*"valid"\s*:\s*true'; then
        msg+=" ✅ Env"
    elif echo "$normalized" | grep -q '"environment"'; then
        msg+=" ❌ Env"
    else
        msg+=" ❓ Env"
    fi

    # Migrations
    if echo "$normalized" | grep -qE '"migrations"[^}]*"applied"\s*:\s*true'; then
        msg+=" ✅ Migrations"
    elif echo "$normalized" | grep -q '"migrations"'; then
        local pending
        pending=$(echo "$normalized" | grep -oE '"pending"\s*:\s*[0-9]+' | grep -o '[0-9]*' | head -1)
        msg+=" ⚠️ ${pending:-?} pending migrations"
    else
        msg+=" ❓ Migrations"
    fi

    # Extract first error if present (handle escaped quotes in error message)
    local error
    error=$(echo "$normalized" | grep -oE '"error"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"error"\s*:\s*"//;s/"$//')
    if [ -n "$error" ] && [ "$error" != "null" ]; then
        msg+=$'\n'"🔴 $error"
    fi

    echo "$msg"
}

# Determine if health response indicates overall success
is_health_ok() {
    local response="$1"
    local compact
    compact=$(echo "$response" | tr -d '\n\r\t ')

    # Match either top-level overall or nested under data
    if echo "$compact" | grep -q '"overall":true'; then
        return 0
    fi

    if echo "$compact" | grep -q '"success":true' && echo "$compact" | grep -q '"data":{.*"overall":true'; then
        return 0
    fi

    return 1
}

# Handle health check failure with throttling
# Only sends notification on FIRST failure, then suppresses until recovery
handle_health_failure() {
    local reason="$1"
    local response="$2"

    if [ -f "$HEALTH_ALERT_FILE" ]; then
        # Already alerted, suppress notification
        log "Health still failing (alert suppressed)"
        return
    fi

    # First failure - send alert and create state file
    local msg
    if [ -n "$response" ]; then
        msg=$(parse_health_response "$response")
    else
        msg="❌ $reason"
    fi

    log_error "$reason"
    notify_health_critical "$msg"

    # Create state file with timestamp
    date '+%Y-%m-%d %H:%M:%S' > "$HEALTH_ALERT_FILE"
}

# Handle health check success
# Sends recovery notification if previously failed
handle_health_success() {
    if [ -f "$HEALTH_ALERT_FILE" ]; then
        # Was down, now recovered
        local down_since
        down_since=$(cat "$HEALTH_ALERT_FILE" 2>/dev/null || echo "unknown")
        [ -z "$down_since" ] && down_since="unknown"
        rm -f "$HEALTH_ALERT_FILE"

        local recovery_msg="⏱️ Down since: $down_since"$'\n'"✅ All services healthy"
        notify "🟢 Barq Back Online" "$recovery_msg" 0 "magic"
        log "Health recovered - notification sent"
    fi

    echo "✓ Healthcheck OK" | tee -a "$LOG_FILE"
}

# Healthcheck function with alert throttling
# - Only notifies on FIRST failure (prevents spam during outages)
# - Notifies on recovery when service comes back up
check_health() {
    local url="$HEALTH_URL"
    log "Checking health at $url"

    local response
    # curl inside if so set -e doesn't kill the whole script on failure
    if ! response=$(curl -fsS --max-time 5 "$url" 2>/dev/null); then
        handle_health_failure "Endpoint unreachable at $url" ""
        return 1
    fi

    # Check for overall=true
    if is_health_ok "$response"; then
        handle_health_success
        return 0
    else
        handle_health_failure "Services unhealthy" "$response"
        return 1
    fi
}

# ========================================
# Lock File Management
# ========================================

# Handle stale lock files (older than LOCK_TIMEOUT seconds)
handle_stale_lock() {
    if [ ! -f "$LOCK_FILE" ]; then
        return 0
    fi

    # Calculate lock age (macOS and Linux compatible)
    local lock_age
    if stat -f%m "$LOCK_FILE" >/dev/null 2>&1; then
        # macOS
        lock_age=$(($(date +%s) - $(stat -f%m "$LOCK_FILE")))
    elif stat -c%Y "$LOCK_FILE" >/dev/null 2>&1; then
        # Linux
        lock_age=$(($(date +%s) - $(stat -c%Y "$LOCK_FILE")))
    else
        # Fallback - assume not stale
        lock_age=0
    fi

    if [ "$lock_age" -gt "$LOCK_TIMEOUT" ]; then
        echo "→ Removing stale lock file (age: ${lock_age}s)" | tee -a "$LOG_FILE"
        rm -f "$LOCK_FILE"
        return 0
    fi

    # Lock exists and is not stale
    return 1
}

# ========================================
# Main Deployment Logic
# ========================================

main() {
    parse_args "$@"

    # Create log directory if missing
    mkdir -p "$LOG_DIR"

    log_separator
    echo "=== Barq Auto-Deploy [$(date '+%Y-%m-%d %H:%M:%S')] ===" | tee -a "$LOG_FILE"
    log "Checking for updates..."
    if [ "$FORCE_DEPLOY" -eq 1 ]; then
        log "Force redeploy requested - skipping git change detection"
    fi

    # If force requested, clear any existing lock so we don't bail early
    if [ "$FORCE_DEPLOY" -eq 1 ] && [ -f "$LOCK_FILE" ]; then
        log "Force redeploy: removing existing lock file $LOCK_FILE"
        rm -f "$LOCK_FILE" || true
    fi

    # Handle stale lock files
    if ! handle_stale_lock; then
        log "Another deployment is in progress (lock file present). Exiting."
        exit 0
    fi

    # Create lock file and ensure cleanup
    trap 'rm -f "$LOCK_FILE"' EXIT
    echo $$ > "$LOCK_FILE"

    cd "$PROJECT_DIR" || {
        log_error "Failed to cd to $PROJECT_DIR"
        notify "Barq Deploy Error" "Failed to cd to $PROJECT_DIR" 1
        exit 1
    }

    # Mark directory as safe for git (handles ownership differences)
    git config --global safe.directory "$PROJECT_DIR" 2>/dev/null || true

    # Fetch latest from origin
    if ! git fetch origin --quiet 2>&1; then
        log_error "git fetch failed"
        notify "Barq Deploy Error" "git fetch failed" 1
        # Still run healthcheck so you know if app is alive
        check_health || true
        exit 1
    fi

    # Get current and remote HEADs
    LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null) || {
        log_error "Failed to get local HEAD"
        notify "Barq Deploy Error" "Failed to get local HEAD" 1
        exit 1
    }

    REMOTE_HEAD=$(git rev-parse origin/main 2>/dev/null) || {
        log_error "Failed to get remote HEAD (origin/main)"
        notify "Barq Deploy Error" "Failed to get remote HEAD (origin/main)" 1
        exit 1
    }

    # If already up to date, still run healthcheck unless forced
    if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ] && [ "$FORCE_DEPLOY" -eq 0 ]; then
        echo "✓ Already up to date (${LOCAL_HEAD:0:7})" | tee -a "$LOG_FILE"
        check_health || true
        exit 0
    fi

    if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ] && [ "$FORCE_DEPLOY" -eq 1 ]; then
        log "Force redeploy: deploying ${LOCAL_HEAD:0:7} without git changes"
    else
        log "Changes detected: ${LOCAL_HEAD:0:7} -> ${REMOTE_HEAD:0:7}"
    fi

    # Sync local branch to remote before deployment to avoid repeated triggers
    log "Syncing local main to origin/main..."
    if ! git checkout -f main >/dev/null 2>&1; then
        log_error "Failed to checkout main"
        notify "Barq Deploy Error" "Failed to checkout main" 1
        exit 1
    fi

    if ! git reset --hard "$REMOTE_HEAD" >/dev/null 2>&1; then
        log_error "Failed to reset to origin/main"
        notify "Barq Deploy Error" "Failed to reset to origin/main" 1
        exit 1
    fi
    log "Local repository updated to ${REMOTE_HEAD:0:7}"

    # Pre-deployment validation (quick DB/Redis check)
    log "Pre-deployment validation..."

    # Check database connectivity
    if ! psql --dbname="$DATABASE_URL" --set ON_ERROR_STOP=1 -c "SELECT 1;" >/dev/null 2>&1; then
        log_error "Database validation failed - cannot deploy"
        notify "Barq Deploy Error" "Database unreachable - deployment aborted" 1
        exit 2
    fi
    log "Database connectivity: OK"

    # Check Redis connectivity (using redis-cli if available, otherwise skip)
    if command -v redis-cli >/dev/null 2>&1; then
        # Extract host and port from REDIS_URL (format: redis://host:port)
        REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://([^:]+):.*|\1|')
        REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|redis://[^:]+:([0-9]+).*|\1|')

        if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" PING >/dev/null 2>&1; then
            log_error "Redis validation failed - cannot deploy"
            notify "Barq Deploy Error" "Redis unreachable - deployment aborted" 1
            exit 2
        fi
        log "Redis connectivity: OK"
    else
        log "Redis validation skipped (redis-cli not available)"
    fi

    # Record start time
    DEPLOY_START=$(date +%s)

    # Fix permissions BEFORE deployment (www user owns files, need write access for deployment)
    log "Fixing permissions for deployment..."
    sudo chown -R opc:opc "$PROJECT_DIR" || true

    # Call production-deploy.sh
    log "Starting production deployment..."
    DEPLOY_EXIT_CODE=0
    set +e
    bash "$PROJECT_DIR/scripts/deploy/production-deploy.sh"
    DEPLOY_EXIT_CODE=$?
    set -e

    if [ $DEPLOY_EXIT_CODE -ne 0 ]; then

        # Categorize exit codes: critical (10-70) vs warning (80)
        if [ $DEPLOY_EXIT_CODE -ge 10 ] && [ $DEPLOY_EXIT_CODE -le 70 ]; then
            # CRITICAL FAILURE (stages 1-7)
            log_error "Deployment failed with exit code $DEPLOY_EXIT_CODE"

            # Map exit code to stage name
            case $DEPLOY_EXIT_CODE in
                10) STAGE="Pre-flight checks" ;;
                20) STAGE="Database backup" ;;
                30) STAGE="Dependencies" ;;
                40) STAGE="Build" ;;
                50) STAGE="Migrations" ;;
                60) STAGE="Cache/seed" ;;
                70) STAGE="PM2 reload" ;;
                *) STAGE="Unknown stage" ;;
            esac

            # If stage is unknown, try to infer from the latest deployment log
            if [ "$STAGE" = "Unknown stage" ]; then
                local inferred_stage
                inferred_stage=$(infer_stage_from_latest_deploy_log || true)
                if [ -n "$inferred_stage" ]; then
                    STAGE="${inferred_stage} (inferred)"
                    log "Inferred stage from deploy log: $STAGE"
                fi
            fi

            # Send failure notification
            notify_deployment_failure "$LOCAL_HEAD" "$REMOTE_HEAD" "$STAGE" "$DEPLOY_EXIT_CODE"

            # Fix permissions back to www user
            sudo chown -R "$WEB_USER:$WEB_GROUP" "$PROJECT_DIR" || true
            sudo chmod -R g+w "$PROJECT_DIR" || true

            # Run health check
            check_health || true

            exit 3

        elif [ $DEPLOY_EXIT_CODE -eq 80 ]; then
            # WARNING: Health check - services degraded (treat as success)
            log "Deployment succeeded with warnings (exit code 80)"
            log "Note: Worker status will be checked separately after deployment"

            # Continue to success path (deployment succeeded)
            # Worker notification will be sent separately in post-deployment check
            DEPLOY_EXIT_CODE=0

        else
            # Unknown exit code (treat as critical failure)
            log_error "Deployment failed with unknown exit code $DEPLOY_EXIT_CODE"
            notify_deployment_failure "$LOCAL_HEAD" "$REMOTE_HEAD" "Unknown stage" "$DEPLOY_EXIT_CODE"

            # Fix permissions back to www user
            sudo chown -R "$WEB_USER:$WEB_GROUP" "$PROJECT_DIR" || true
            sudo chmod -R g+w "$PROJECT_DIR" || true

            exit 3
        fi
    fi

    # Calculate deployment duration
    DEPLOY_END=$(date +%s)
    DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))

    # Fix permissions back to www user
    log "Fixing permissions for web server..."
    if ! sudo chown -R "$WEB_USER:$WEB_GROUP" "$PROJECT_DIR"; then
        log_error "chown failed"
    fi

    # Ensure opc can still write (for future deployments)
    if ! sudo chmod -R g+w "$PROJECT_DIR"; then
        log_error "chmod failed"
    fi

    log "Permissions fixed"

    # Send success notification
    notify_deployment_success "$LOCAL_HEAD" "$REMOTE_HEAD" "$DEPLOY_DURATION"

    echo "✓ Deployment complete! ${LOCAL_HEAD:0:7} → ${REMOTE_HEAD:0:7} (${DEPLOY_DURATION}s)" | tee -a "$LOG_FILE"

    # ========================================
    # Post-Deployment Worker Status Check
    # ========================================

    log "Checking worker status post-deployment..."

    # Check if worker is online via PM2
    if command -v pm2 >/dev/null 2>&1 && command -v jq >/dev/null 2>&1; then
        local worker_status
        worker_status=$(pm2 jlist 2>/dev/null | jq -r '.[] | select(.name=="barq-worker") | .pm2_env.status' || echo "unknown")

        if [ "$worker_status" = "online" ]; then
            log "✓ Worker is online"
        else
            log_error "Worker is not online (status: $worker_status)"

            # Send separate notification about worker unavailability
            notify_worker_unavailable

            log "Worker notification sent"
        fi
    else
        log "Skipping worker check (pm2 or jq not available)"
    fi

    # Final healthcheck after deployment
    check_health || true

    exit 0
}

# ========================================
# Execute Main
# ========================================

main "$@"

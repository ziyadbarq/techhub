#!/bin/bash
# Auto-sync script for barq-assets
# Polls GitHub and syncs when changes detected
# Run via cron: */2 * * * * /home/opc/node-projects/barq-assets/scripts/git-auto-sync.sh

set -euo pipefail

# Configuration
PROJECT_DIR="/home/opc/node-projects/barq-assets"
LOCK_FILE="/tmp/barq-sync.lock"
LOCK_TIMEOUT=600  # 10 minutes - stale lock threshold
WEB_USER="www"
WEB_GROUP="www"

# Source environment variables from .env.local if it exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
    set -a
    source "$PROJECT_DIR/.env.local"
    set +a
fi

# Pushover notifications (set these in environment or .env.local)
PUSHOVER_USER_KEY="${PUSHOVER_USER_KEY:-}"
PUSHOVER_API_TOKEN="${PUSHOVER_API_TOKEN:-}"

log() {
    echo "→ $1"
}

log_error() {
    echo "✗ ERROR: $1" >&2
}

# Send Pushover notification
notify() {
    local title="$1"
    local message="$2"
    local priority="${3:-0}"

    if [ -z "$PUSHOVER_USER_KEY" ] || [ -z "$PUSHOVER_API_TOKEN" ]; then
        return 0
    fi

    local response
    response=$(curl -s --retry 2 --max-time 10 \
        --form-string "token=$PUSHOVER_API_TOKEN" \
        --form-string "user=$PUSHOVER_USER_KEY" \
        --form-string "title=$title" \
        --form-string "message=$message" \
        --form-string "priority=$priority" \
        https://api.pushover.net/1/messages.json 2>&1)

    if echo "$response" | grep -q '"status":1'; then
        echo "→ Push notification sent"
    else
        echo "✗ Push notification failed: $response" >&2
    fi
}

notify_success() {
    notify "Barq Sync" "$1" 0
}

notify_error() {
    notify "Barq Sync Failed" "$1" 1
}

# Handle stale lock files (older than LOCK_TIMEOUT seconds)
if [ -f "$LOCK_FILE" ]; then
    lock_age=$(($(date +%s) - $(stat -c%Y "$LOCK_FILE" 2>/dev/null || stat -f%m "$LOCK_FILE" 2>/dev/null || echo 0)))
    if [ "$lock_age" -gt "$LOCK_TIMEOUT" ]; then
        echo "→ Removing stale lock file (age: ${lock_age}s)"
        rm -f "$LOCK_FILE"
    else
        exit 0
    fi
fi

# Create lock file and ensure cleanup
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT
echo $$ > "$LOCK_FILE"

cd "$PROJECT_DIR" || { log_error "Failed to cd to $PROJECT_DIR"; notify_error "Failed to cd to $PROJECT_DIR"; exit 1; }

echo "=== Barq Auto-Sync ==="
echo "→ Checking for updates..."

# Mark directory as safe for git (handles ownership differences)
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true

# Fetch latest from origin
if ! git fetch origin --quiet 2>&1; then
    log_error "git fetch failed"
    notify_error "git fetch failed"
    exit 1
fi

# Get current and remote HEADs
LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null) || { log_error "Failed to get local HEAD"; notify_error "Failed to get local HEAD"; exit 1; }
REMOTE_HEAD=$(git rev-parse origin/main 2>/dev/null) || { log_error "Failed to get remote HEAD (origin/main)"; notify_error "Failed to get remote HEAD"; exit 1; }

# Exit if already up to date
if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
    echo "✓ Already up to date (${LOCAL_HEAD:0:7})"
    exit 0
fi

log "Changes detected: ${LOCAL_HEAD:0:7} -> ${REMOTE_HEAD:0:7}"

# Sync files (force reset to match remote exactly)
if ! git reset --hard origin/main; then
    log_error "git reset failed"
    notify_error "git reset failed"
    exit 1
fi

if ! git clean -fd; then
    log_error "git clean failed"
    notify_error "git clean failed"
    exit 1
fi

log "Files synced"

# Fix permissions for aaPanel/www user
if ! sudo chown -R "$WEB_USER:$WEB_GROUP" "$PROJECT_DIR"; then
    log_error "chown failed"
    notify_error "chown failed"
    exit 1
fi

# Ensure opc can still write (for future syncs)
if ! sudo chmod -R g+w "$PROJECT_DIR"; then
    log_error "chmod failed"
    notify_error "chmod failed"
    exit 1
fi

log "Permissions fixed"

# Run build
log "Starting build..."
if npm run build:fast; then
    echo "✓ Done! Ready for manual restart."
    notify_success "Synced ${LOCAL_HEAD:0:7} → ${REMOTE_HEAD:0:7} and built. Ready for restart."
else
    build_exit_code=$?
    log_error "Build failed with exit code $build_exit_code"
    notify_error "Build failed (exit code $build_exit_code)"
    exit 1
fi

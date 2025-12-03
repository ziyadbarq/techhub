#!/bin/bash
# Master stop switch for barq-assets services
# Usage: ./scripts/stop-services.sh [--force] [--debug]
#
# The nuclear option: fuser -k is the only reliable way to kill processes
# on the port when aaPanel or other managers are involved.

set +e  # Don't exit on error - we want to try all stop methods

# Load environment variables from .env.local (for PORT)
if [ -f .env.local ]; then
    export $(grep -E '^PORT=' .env.local | xargs 2>/dev/null) 2>/dev/null
fi

# Parse flags
FORCE_MODE=false
DEBUG_MODE=false
for arg in "$@"; do
    case $arg in
        --force) FORCE_MODE=true ;;
        --debug) DEBUG_MODE=true ;;
    esac
done

MODE_TEXT="force"
if [ "$FORCE_MODE" = false ]; then
    MODE_TEXT="graceful"
fi

debug() {
    if [ "$DEBUG_MODE" = true ]; then
        echo "  [DEBUG] $1"
    fi
}

echo "Stopping barq-assets services ($MODE_TEXT shutdown)..."
echo ""

# Get PORT
APP_PORT=${PORT:-3000}
echo "Target port: $APP_PORT"
echo ""

# ========================================
# Step 1: NUCLEAR OPTION - fuser -k (most reliable)
# ========================================
echo "Step 1: Killing processes on port $APP_PORT (fuser)..."

if command -v fuser &> /dev/null; then
    # Try without sudo first
    fuser -k "$APP_PORT/tcp" 2>/dev/null && echo "  - Killed processes on port $APP_PORT"

    # Small delay to let processes die
    sleep 1

    # Check if port is still in use, try with sudo
    if fuser "$APP_PORT/tcp" 2>/dev/null; then
        echo "  - Port still in use, trying with sudo..."
        sudo fuser -k "$APP_PORT/tcp" 2>/dev/null && echo "  - Killed processes with sudo"
    else
        echo "  - Port $APP_PORT is now free"
    fi
else
    echo "  - fuser not available, skipping"
fi

# ========================================
# Step 2: PM2 Stop (if PM2 is managing processes)
# ========================================
echo ""
echo "Step 2: Stopping PM2 managed processes..."

if command -v pm2 &> /dev/null; then
    PM2_LIST=$(pm2 jlist 2>/dev/null || echo "[]")

    if echo "$PM2_LIST" | grep -q "barq-web\|barq-worker"; then
        pm2 stop barq-web 2>/dev/null && echo "  - Stopped barq-web (PM2)"
        pm2 stop barq-worker 2>/dev/null && echo "  - Stopped barq-worker (PM2)"
    else
        echo "  - No PM2 managed processes found"
    fi
else
    echo "  - PM2 not installed"
fi

# ========================================
# Step 3: Kill by process pattern (backup)
# ========================================
echo ""
echo "Step 3: Killing by process name..."

# Get parent chain to avoid killing ourselves
SELF_PID=$$
PARENT_PID=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
GRANDPARENT_PID=$(ps -o ppid= -p "$PARENT_PID" 2>/dev/null | tr -d ' ')

is_safe_to_kill() {
    local pid=$1
    [[ "$pid" != "$SELF_PID" ]] && [[ "$pid" != "$PARENT_PID" ]] && [[ "$pid" != "$GRANDPARENT_PID" ]]
}

# Kill next-server processes
for pattern in "next-server" "next dev" "next start"; do
    PIDS=$(pgrep -f "$pattern" 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        for PID in $PIDS; do
            if is_safe_to_kill "$PID"; then
                kill -9 "$PID" 2>/dev/null && echo "  - Killed $pattern (PID: $PID)"
            fi
        done
    fi
done

echo "  - Process cleanup done"

# ========================================
# Step 4: Final verification with fuser again
# ========================================
echo ""
echo "Step 4: Final verification..."
sleep 1

if command -v fuser &> /dev/null; then
    if fuser "$APP_PORT/tcp" 2>/dev/null; then
        echo "  WARNING: Port $APP_PORT still in use!"
        echo "  Attempting final kill with sudo..."
        sudo fuser -k "$APP_PORT/tcp" 2>/dev/null
        sleep 1

        if fuser "$APP_PORT/tcp" 2>/dev/null; then
            echo ""
            echo "ERROR: Could not free port $APP_PORT"
            echo "Manual intervention required: sudo fuser -k $APP_PORT/tcp"
            exit 1
        fi
    fi
fi

# Final check with ss/netstat
PORT_FREE=true
if command -v ss &> /dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
        PORT_FREE=false
    fi
elif command -v netstat &> /dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
        PORT_FREE=false
    fi
fi

echo ""
if [ "$PORT_FREE" = true ]; then
    echo "SUCCESS: Port $APP_PORT is free and ready"
    exit 0
else
    echo "WARNING: Port $APP_PORT may still be in use"
    echo "Try manually: sudo fuser -k $APP_PORT/tcp"
    exit 1
fi

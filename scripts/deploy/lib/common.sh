#!/bin/bash
# Common deployment utilities
# Shared functions for git-auto-deploy.sh and production-deploy.sh

# ========================================
# Dependency Validation
# ========================================

# Check if jq is available for JSON parsing
check_jq_available() {
    if ! command -v jq >/dev/null 2>&1; then
        echo "✗ ERROR: jq not found (required for JSON parsing)" >&2
        echo "Install: brew install jq" >&2
        return 1
    fi
    return 0
}

# ========================================
# Redis Utilities
# ========================================

# Parse Redis URL into host and port
# Usage: parsed=$(parse_redis_url "$REDIS_URL") && read -r host port <<< "$parsed"
# Returns: "host port" on success, empty string on failure
parse_redis_url() {
    local redis_url="$1"

    if [[ "$redis_url" =~ redis://([^:]+):([0-9]+) ]]; then
        echo "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}"
        return 0
    fi

    return 1
}

# Validate Redis connectivity
# Usage: validate_redis_connectivity "$REDIS_URL"
# Returns: 0 if Redis is reachable, 1 otherwise
validate_redis_connectivity() {
    local redis_url="$1"

    if ! command -v redis-cli >/dev/null 2>&1; then
        return 1
    fi

    local parsed host port
    if ! parsed=$(parse_redis_url "$redis_url"); then
        return 1
    fi

    read -r host port <<< "$parsed"

    if redis-cli -h "$host" -p "$port" PING >/dev/null 2>&1; then
        return 0
    fi

    return 1
}

# ========================================
# Deployment Metrics
# ========================================

# Record deployment metric to CSV file
# Usage: record_deployment_metric "metric_name" "value"
# Requires: LOG_DIR environment variable
record_deployment_metric() {
    local metric_name="$1"
    local value="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Ensure LOG_DIR is set
    if [ -z "${LOG_DIR:-}" ]; then
        return 1
    fi

    # Create metrics file if it doesn't exist
    local metrics_file="$LOG_DIR/deployment-metrics.csv"

    if [ ! -f "$metrics_file" ]; then
        # Create with header
        echo "timestamp,metric_name,value" > "$metrics_file"
    fi

    # Append metric
    echo "${timestamp},${metric_name},${value}" >> "$metrics_file"
}

#!/bin/bash
set -e

# Helper script for local Docker testing with pre-built artifacts
# This script:
# 1. Builds the app on host (fast - native filesystem)
# 2. Temporarily swaps .dockerignore to include .next/
# 3. Builds Docker image with pre-built artifacts
# 4. Restores original .dockerignore
# 5. Runs the containers

echo "🚀 Local Docker Testing Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Build on host
echo "📦 Step 1/4: Building application on host (native macOS)..."
echo ""
npm run build:fast
echo ""
echo "✅ Build completed successfully!"
echo ""

# Step 2: Swap .dockerignore
echo "🔄 Step 2/4: Preparing Docker context..."
if [ -f .dockerignore ]; then
    mv .dockerignore .dockerignore.tmp
fi
if [ -f .dockerignore.local ]; then
    cp .dockerignore.local .dockerignore
fi
echo "✅ Docker context prepared"
echo ""

# Step 3: Build and run Docker containers
echo "🐳 Step 3/4: Building Docker image and starting containers..."
echo ""
docker compose -f docker-compose.local.yml up --build "$@"

# Step 4: Cleanup (runs on script exit)
cleanup() {
    echo ""
    echo "🧹 Step 4/4: Cleaning up..."
    if [ -f .dockerignore.tmp ]; then
        mv .dockerignore.tmp .dockerignore
        echo "✅ Restored original .dockerignore"
    fi
}

trap cleanup EXIT

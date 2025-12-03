#!/bin/bash
# Restart Development Server Script
# Kills any running Next.js dev servers and starts fresh

echo "🔄 Restarting development server..."
echo ""

# Kill any running Next.js processes
echo "1. Stopping existing dev server..."
pkill -f "next dev" 2>/dev/null && echo "   ✓ Stopped existing server" || echo "   ℹ No server was running"

# Kill any node processes on port 3000
echo "2. Freeing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   ✓ Port 3000 freed" || echo "   ℹ Port 3000 was already free"

echo ""
echo "✅ Ready to start fresh!"
echo ""
echo "Run: npm run dev"

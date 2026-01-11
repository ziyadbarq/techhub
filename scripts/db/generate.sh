#!/bin/bash
set -e

# CI-aware Prisma generate script
# Supports both direct env vars and Spring Cloud Config Server
# In CI: Creates .env from GitLab CI environment variables or config server
# Local: Uses .env.local via dotenv-cli

if [ "$CI" = "true" ]; then
  echo "ℹ️  Running in CI environment"

  # Check if Spring Cloud Config is enabled
  if [ -n "$CONFIG_SERVER_URL" ]; then
    echo "🌐 Spring Cloud Config Server detected: $CONFIG_SERVER_URL"
    echo ""
    echo "⚠️  IMPORTANT: Spring Cloud Config is not yet implemented in CI pipeline"
    echo ""
    echo "To use Spring Cloud Config in CI, you need to:"
    echo "  1. Create config server and configure it for 'techhub' application"
    echo "  2. Add CONFIG_SERVER_URL to GitLab CI/CD variables"
    echo "  3. Ensure config server is reachable from GitLab runners"
    echo "  4. Config server should provide DATABASE_URL and other critical env vars"
    echo ""
    echo "For now, falling back to direct environment variables..."
    echo ""
  fi

  # Create .env file with DATABASE_URL from CI environment
  # Prisma's dotenv loader needs this file to exist during schema validation
  if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL=$DATABASE_URL" > .env
    echo "✅ Created .env with DATABASE_URL from GitLab CI variables"
  else
    echo ""
    echo "❌ ERROR: DATABASE_URL not set in CI environment"
    echo ""
    echo "Spring Cloud Config Setup Instructions:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Option 1: Use Spring Cloud Config Server (Recommended)"
    echo "  1. Set up Spring Cloud Config Server for 'techhub' application"
    echo "  2. Add CONFIG_SERVER_URL to GitLab CI/CD variables:"
    echo "     CONFIG_SERVER_URL=http://config-server.baraq.com:8888"
    echo "  3. Configure server to provide DATABASE_URL for each profile"
    echo "  4. Ensure config server is reachable from GitLab runners"
    echo ""
    echo "Option 2: Use Direct Environment Variables (Quick Fix)"
    echo "  Add DATABASE_URL to GitLab CI/CD variables:"
    echo "  GitLab UI > Settings > CI/CD > Variables > Add variable"
    echo "  Name: DATABASE_URL"
    echo "  Value: postgresql://user:pass@host:5432/db"
    echo ""
    echo "For more information, see:"
    echo "  docs/infrastructure/SPRING_CLOUD_CONFIG.md"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    exit 1
  fi

  prisma generate

  # Clean up .env file after generation
  rm -f .env
  echo "🧹 Cleaned up .env file"
else
  # Local development: Load from .env.local
  echo "ℹ️  Running locally - loading .env.local"
  dotenv -e .env.local -- prisma generate
fi

# Recreate Prisma index file (both CI and local)
node scripts/build/recreate-prisma-index.js

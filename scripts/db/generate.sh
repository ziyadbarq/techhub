#!/bin/bash
set -e

# CI-aware Prisma generate script
# In CI: Creates .env from GitLab CI environment variables
# Local: Uses .env.local via dotenv-cli

if [ "$CI" = "true" ]; then
  # CI environment: Create .env file from GitLab CI variables
  echo "ℹ️  Running in CI - creating .env from GitLab environment variables"

  # Create .env file with DATABASE_URL from CI environment
  # Prisma's dotenv loader needs this file to exist during schema validation
  if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL=$DATABASE_URL" > .env
    echo "✅ Created .env with DATABASE_URL"
  else
    echo "❌ ERROR: DATABASE_URL not set in CI environment"
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

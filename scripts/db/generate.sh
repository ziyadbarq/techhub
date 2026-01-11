#!/bin/bash
set -e

# CI-aware Prisma generate script
# In CI: Uses environment variables from GitLab CI
# Local: Uses .env.local via dotenv-cli

if [ "$CI" = "true" ]; then
  # CI environment: GitLab CI provides env vars directly
  echo "ℹ️  Running in CI - using GitLab environment variables"
  prisma generate
else
  # Local development: Load from .env.local
  echo "ℹ️  Running locally - loading .env.local"
  dotenv -e .env.local -- prisma generate
fi

# Recreate Prisma index file (both CI and local)
node scripts/build/recreate-prisma-index.js

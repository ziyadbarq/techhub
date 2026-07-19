#!/bin/bash
set -e

# CI-aware Prisma generate script
# Supports direct CI env vars for build-time Prisma generation.
# Runtime Spring Cloud Config is loaded by docker-start.mjs in the pod.
# Local: Uses .env.local via dotenv-cli

if [ "$CI" = "true" ]; then
  echo "ℹ️  Running in CI environment"

  if [ -n "$CONFIG_SERVER_URL" ]; then
    echo "🌐 Spring Cloud Config Server detected: $CONFIG_SERVER_URL"
    echo ""
    echo "ℹ️  CI still uses direct DATABASE_URL for Prisma generation."
    echo "ℹ️  Runtime config is loaded later in Kubernetes by docker-start.mjs."
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
    echo "Build-time DATABASE_URL setup:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  Add DATABASE_URL to GitLab CI/CD variables:"
    echo "  GitLab UI > Settings > CI/CD > Variables > Add variable"
    echo "  Name: DATABASE_URL"
    echo "  Value: postgresql://user:pass@host:5432/db"
    echo "  Protected: No, if the dev branch needs this variable"
    echo ""
    echo "For more information, see:"
    echo "  docs/infrastructure/GITLAB_CI_VARIABLES_SETUP.md"
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

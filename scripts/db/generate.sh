#!/usr/bin/env bash
set -e

# CI-aware Prisma generate script
# prisma generate never connects to Postgres — it only needs a URL-shaped
# DATABASE_URL for prisma.config.ts / schema validation.
# Runtime DB access comes from Spring Cloud Config via docker-start.mjs.
# Local: Uses .env.local via dotenv-cli

if [ "$CI" = "true" ]; then
  echo "ℹ️  Running in CI environment"

  if [ -n "$CONFIG_SERVER_URL" ]; then
    echo "🌐 Spring Cloud Config Server detected: $CONFIG_SERVER_URL"
    echo "ℹ️  Runtime DATABASE_URL is loaded later in Kubernetes by docker-start.mjs."
  fi

  # Placeholder only — generate does not open a DB connection.
  # Override via GitLab CI variable if you ever need a different shape.
  CI_DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@127.0.0.1:5432/techhub_ci}"

  # Prisma's dotenv loader needs this file during schema validation
  echo "DATABASE_URL=$CI_DATABASE_URL" > .env
  if [ -n "$DATABASE_URL" ]; then
    echo "✅ Created .env with DATABASE_URL from CI environment"
  else
    echo "✅ Created .env with CI placeholder DATABASE_URL (no live DB required)"
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

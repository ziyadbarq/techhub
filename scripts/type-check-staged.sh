#!/usr/bin/env bash

# Collect staged TS/TSX files (if grep finds none, prevent non-zero exit)
STAGED_TS_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' || true)

if [ -z "$STAGED_TS_FILES" ]; then
  echo "No TypeScript files staged, skipping type check"
  exit 0
fi

echo "Type-checking staged files:"
echo "$STAGED_TS_FILES" | sed 's/^/  - /'
echo ""

# Run tsc on staged files
# Note: We use --noEmit to only check, not emit files
# We use xargs to pass files as arguments (handles spaces and newlines correctly)
echo "$STAGED_TS_FILES" | xargs npx tsc --noEmit

exit $?

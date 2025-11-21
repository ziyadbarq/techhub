#!/usr/bin/env bash

set -euo pipefail

# Collect staged TS/TSX files (if grep finds none, prevent non-zero exit)
# Skip generated Prisma output; we never type-check or format those
STAGED_TS_FILES=$(
  git diff --cached --name-only --diff-filter=ACM \
    | grep -E '\.(ts|tsx)$' \
    | grep -v '^src/generated/prisma/' \
    || true
)

if [ -z "$STAGED_TS_FILES" ]; then
  echo "No TypeScript files staged, skipping type check"
  exit 0
fi

echo "Type-checking staged files:"
echo "$STAGED_TS_FILES" | sed 's/^/  - /'
echo ""

# Build a temporary tsconfig that extends the project config but scopes to staged files
TMP_TSCONFIG=$(mktemp)
cleanup() {
  rm -f "$TMP_TSCONFIG"
}
trap cleanup EXIT

FILES_JSON=$(STAGED_TS_FILES="$STAGED_TS_FILES" node - <<'NODE'
const files = (process.env.STAGED_TS_FILES || "")
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (!files.length) {
  process.exit(1);
}

process.stdout.write(JSON.stringify(files, null, 2));
NODE
)

cat >"$TMP_TSCONFIG" <<EOF
{
  "extends": "./tsconfig.json",
  "include": [],
  "files": $FILES_JSON
}
EOF

# Use the temporary project config so compiler options (paths, decorators, target) apply
npx tsc --noEmit --project "$TMP_TSCONFIG"

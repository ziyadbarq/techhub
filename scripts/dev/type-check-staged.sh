#!/usr/bin/env bash

set -euo pipefail

# Collect staged TS/TSX files (if grep finds none, prevent non-zero exit)
# Skip generated Prisma output and scripts (scripts use tsx runtime, not compiled)
STAGED_TS_FILES=$(
  git diff --cached --name-only --diff-filter=ACM \
    | grep -E '\.(ts|tsx)$' \
    | grep -v '^src/generated/prisma/' \
    | grep -v '^scripts/' \
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
# Must be created inside the project root so TypeScript can resolve node_modules/@types
TMP_TSCONFIG=$(mktemp "./tsconfig-staged-XXXXXXXX.json")
# Resolve with Node so extends path works on Windows (Git Bash gives /c/... which tsc.exe may not read)
ROOT_TSCONFIG="$(
  node -e "const p=require('path');console.log(p.resolve('tsconfig.json').replace(/\\\\/g,'/'))"
)"
cleanup() {
  rm -f "$TMP_TSCONFIG"
}
trap cleanup EXIT

FILES_JSON=$(STAGED_TS_FILES="$STAGED_TS_FILES" node - <<'NODE'
import path from "node:path";

const files = (process.env.STAGED_TS_FILES || "")
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (!files.length) {
  process.exit(1);
}

const absFiles = files.map((file) => path.resolve(process.cwd(), file));

process.stdout.write(JSON.stringify(absFiles, null, 2));
NODE
)

cat >"$TMP_TSCONFIG" <<EOF
{
  "extends": "$ROOT_TSCONFIG",
  "include": ["next-env.d.ts", "global.d.ts"],
  "files": $FILES_JSON
}
EOF

# Use the temporary project config so compiler options (paths, decorators, target) apply
npx tsc --noEmit --project "$TMP_TSCONFIG"

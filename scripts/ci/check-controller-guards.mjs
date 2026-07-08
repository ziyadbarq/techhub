#!/usr/bin/env node
/**
 * Controller Guard Enforcement
 *
 * Fails when an exported server action in src/interface-adapters/controllers/
 * has no authorization call. Controllers are the real security boundary:
 * proxy.ts only checks session-cookie presence, and API routes bypass the
 * dashboard template's session validation entirely, so every exported action
 * must open with requirePermission / requireAuth / requireFeature (or a
 * session-derived guard).
 *
 * Usage: node scripts/ci/check-controller-guards.mjs
 * Runs as part of `npm run validate` and the CI validate stage.
 */

import { promises as fs } from "node:fs";
import { join, basename } from "node:path";

const CONTROLLERS_DIR = "src/interface-adapters/controllers";

// Calls that count as an authorization guard when they appear in a function body
const GUARD_PATTERN =
  /\b(requirePermission|requireAuth|requireFeature|requireFeatureAndPermission|requireSession|getSession|getCurrentUserId|hasPermission)\s*\(/;

// function name (or file:function) → reason it is exempt from the guard rule.
// Keep this list SHORT and justified; new exemptions need a review.
const ALLOWLIST = new Map([
  // Setup flow runs before any user exists; guarded by setup-token/state checks internally
  ["setup.controller.ts:*", "first-run setup flow, no users exist yet"],
  // Two-factor actions run mid-login, before a full session exists
  ["two-factor.controller.ts:*", "mid-login 2FA flow, pre-session by design"],
]);

function isAllowed(file, fn) {
  return (
    ALLOWLIST.has(`${file}:${fn}`) ||
    ALLOWLIST.has(`${file}:*`) ||
    ALLOWLIST.has(fn)
  );
}

async function main() {
  const files = (await fs.readdir(CONTROLLERS_DIR)).filter((f) =>
    f.endsWith(".controller.ts"),
  );

  const violations = [];

  for (const file of files) {
    const source = await fs.readFile(join(CONTROLLERS_DIR, file), "utf-8");
    if (!source.includes('"use server"')) continue;

    // Split on exported async functions; each chunk is one action body
    // (up to the next export or end of file).
    const exportRegex = /export\s+async\s+function\s+(\w+)/g;
    const matches = [...source.matchAll(exportRegex)];

    for (let i = 0; i < matches.length; i++) {
      const fnName = matches[i][1];
      const start = matches[i].index;
      const end =
        i + 1 < matches.length ? matches[i + 1].index : source.length;
      const body = source.slice(start, end);

      if (!GUARD_PATTERN.test(body) && !isAllowed(basename(file), fnName)) {
        violations.push(`${file} → ${fnName}`);
      }
    }
  }

  if (violations.length > 0) {
    console.error(
      `\n❌ ${violations.length} exported server action(s) without an authorization guard:\n`,
    );
    for (const v of violations) console.error(`   ${v}`);
    console.error(
      "\nEvery exported controller action must call requirePermission / requireAuth / requireFeature.",
    );
    console.error(
      "If an action is intentionally unauthenticated, add it to the ALLOWLIST in scripts/ci/check-controller-guards.mjs with a justification.\n",
    );
    process.exit(1);
  }

  console.log(`✅ Controller guards OK (${files.length} controllers scanned)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

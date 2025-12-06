#!/usr/bin/env tsx
/**
 * Temporary helper that renames unused caught error parameters (e.g. `catch (error)`)
 * to start with an underscore so they satisfy the ESLint rule that enforces
 * `caughtErrorsIgnorePattern: "^_"`.
 *
 * Usage: `npx tsx scripts/dev/temp-fix-unused-caught-errors.ts`
 *
 * The script runs ESLint in JSON mode, finds every violation whose message matches
 * "Allowed unused caught errors must match /^_/u", and rewrites the offending
 * identifier to be prefixed with `_`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import ts from "typescript";

type LintMessage = {
  ruleId: string | null;
  message: string;
  line: number;
};

type LintResult = {
  filePath: string;
  messages: LintMessage[];
};

const ESLINT_RULE_ID = "@typescript-eslint/no-unused-vars";
const ESLINT_MESSAGE_SUBSTRING =
  "Allowed unused caught errors must match /^_/u";

function runEslint(): LintResult[] {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "eslint-unused-catch-"),
  );
  const outputFile = path.join(tempDir, "eslint-results.json");
  const args = [
    "eslint",
    ".",
    "--format",
    "json",
    "--output-file",
    outputFile,
    "--no-color",
  ];

  const result = spawnSync("npx", args, {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status > 1) {
    throw new Error(
      `ESLint exited with status ${result.status}. Re-run ESLint manually for more details.`,
    );
  }

  const rawOutput = fs.readFileSync(outputFile, "utf8");
  try {
    const parsed = JSON.parse(rawOutput);
    fs.rmSync(tempDir, { recursive: true, force: true });
    return parsed;
  } catch (error) {
    console.error(
      `\nFailed to parse ESLint JSON output (${(error as Error).message}).`,
    );
    console.error(
      `Raw results have been left at: ${outputFile}. Inspect that file to diagnose truncation or syntax issues.`,
    );
    throw error;
  }
}

function groupViolations(results: LintResult[]): Map<string, Set<number>> {
  const files = new Map<string, Set<number>>();
  for (const result of results) {
    for (const message of result.messages) {
      if (
        message.ruleId === ESLINT_RULE_ID &&
        message.message.includes(ESLINT_MESSAGE_SUBSTRING)
      ) {
        const filePath = path.resolve(result.filePath);
        if (!files.has(filePath)) {
          files.set(filePath, new Set());
        }
        files.get(filePath)!.add(message.line);
      }
    }
  }
  return files;
}

type Replacement = {
  start: number;
  end: number;
  text: string;
};

function createReplacements(
  filePath: string,
  linesToFix: Set<number>,
  sourceText: string,
): Replacement[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const replacements: Replacement[] = [];

  const visit = (node: ts.Node) => {
    if (
      ts.isCatchClause(node) &&
      node.variableDeclaration &&
      ts.isIdentifier(node.variableDeclaration.name)
    ) {
      const identifier = node.variableDeclaration.name;
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        identifier.getStart(sourceFile),
      );
      const lineNumber = line + 1;
      if (linesToFix.has(lineNumber) && !identifier.text.startsWith("_")) {
        replacements.push({
          start: identifier.getStart(sourceFile),
          end: identifier.getEnd(),
          text: `_${identifier.text}`,
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
  return replacements;
}

function applyReplacements(
  filePath: string,
  sourceText: string,
  replacements: Replacement[],
) {
  if (replacements.length === 0) {
    return;
  }
  let updated = sourceText;
  const sorted = [...replacements].sort((a, b) => b.start - a.start);
  for (const replacement of sorted) {
    updated =
      updated.slice(0, replacement.start) +
      replacement.text +
      updated.slice(replacement.end);
  }
  if (updated !== sourceText) {
    fs.writeFileSync(filePath, updated, "utf8");
    console.log(
      `✓ Prefixed ${replacements.length} caught error(s) in ${path.relative(
        process.cwd(),
        filePath,
      )}`,
    );
  }
}

function main() {
  console.log("Running ESLint to gather unused caught error violations...");
  const lintResults = runEslint();
  const filesToFix = groupViolations(lintResults);

  if (filesToFix.size === 0) {
    console.log("No unused caught error violations found 🎉");
    return;
  }

  for (const [filePath, lines] of filesToFix.entries()) {
    const sourceText = fs.readFileSync(filePath, "utf8");
    const replacements = createReplacements(filePath, lines, sourceText);
    if (replacements.length === 0) {
      console.warn(
        `⚠️  No replacements generated for ${path.relative(
          process.cwd(),
          filePath,
        )}. Manual review recommended.`,
      );
    } else {
      applyReplacements(filePath, sourceText, replacements);
    }
  }

  console.log(
    "\nDone. Re-run `npm run lint` to verify that the unused caught error violations are resolved.",
  );
}

main();

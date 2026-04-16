#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH_TYPES = new Set(["fix", "perf", "refactor", "revert"]);
const MINOR_TYPES = new Set(["feat"]);
const TAG_PATTERN = "v[0-9]*.[0-9]*.[0-9]*";

function runGit(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const stderr =
      typeof error?.stderr === "string" ? error.stderr.trim() : "git failed";
    throw new Error(stderr || "git failed");
  }
}

function getPackageVersion() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  if (typeof packageJson.version !== "string") {
    throw new Error("package.json is missing a valid version field");
  }

  return packageJson.version;
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
  };
}

function formatVersion(version) {
  return `${version.major}.${version.minor}.${version.patch}`;
}

function incrementVersion(version, releaseType) {
  const parsed = parseVersion(version);

  switch (releaseType) {
    case "major":
      return formatVersion({
        major: parsed.major + 1,
        minor: 0,
        patch: 0,
      });
    case "minor":
      return formatVersion({
        major: parsed.major,
        minor: parsed.minor + 1,
        patch: 0,
      });
    case "patch":
      return formatVersion({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch + 1,
      });
    case "none":
      return version;
    default:
      throw new Error(`Unsupported release type: ${releaseType}`);
  }
}

function getFirstLine(output) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function getExactTagOnHead() {
  const output = runGit([
    "tag",
    "--points-at",
    "HEAD",
    "--list",
    TAG_PATTERN,
    "--sort=-version:refname",
  ]);

  return getFirstLine(output) ?? null;
}

function getLatestReleaseTag() {
  const output = runGit([
    "tag",
    "--merged",
    "HEAD",
    "--list",
    TAG_PATTERN,
    "--sort=-version:refname",
  ]);

  return getFirstLine(output) ?? null;
}

function listCommits(range) {
  const output = runGit(["log", "--format=%H%x1f%s%x1f%b%x1e", range]);

  if (!output) {
    return [];
  }

  return output
    .split("\x1e")
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [sha, subject = "", body = ""] = record.split("\x1f");
      return {
        sha: sha.trim(),
        subject: subject.trim(),
        body: body.trim(),
      };
    });
}

function getReleaseType(commits) {
  let patchDetected = false;
  let minorDetected = false;

  for (const commit of commits) {
    const { subject, body } = commit;
    const breakingInBody = /(^|\n)BREAKING CHANGE:/m.test(body);
    const headerMatch = /^([a-z]+)(?:\([^)]+\))?(!)?:/.exec(subject);

    if (breakingInBody || headerMatch?.[2] === "!") {
      return "major";
    }

    const type = headerMatch?.[1];
    if (!type) {
      continue;
    }

    if (MINOR_TYPES.has(type)) {
      minorDetected = true;
      continue;
    }

    if (PATCH_TYPES.has(type)) {
      patchDetected = true;
    }
  }

  if (minorDetected) {
    return "minor";
  }

  if (patchDetected) {
    return "patch";
  }

  return "none";
}

function toEnvValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n");
}

function main() {
  const formatArg =
    process.argv.find((arg) => arg.startsWith("--format=")) ?? "--format=text";
  const outputFormat = formatArg.slice("--format=".length);
  const packageVersion = getPackageVersion();
  const exactTag = getExactTagOnHead();

  if (exactTag) {
    const exactVersion = exactTag.replace(/^v/, "");
    emit(
      {
        appVersion: exactVersion,
        releaseType: "tag",
        releaseNeeded: false,
        versionSourceTag: exactTag,
        versionSourceBase: exactVersion,
        versionExactTag: true,
        versionCommitsAnalyzed: 0,
      },
      outputFormat,
    );
    return;
  }

  const latestTag = getLatestReleaseTag();
  if (!latestTag) {
    emit(
      {
        appVersion: packageVersion,
        releaseType: "bootstrap",
        releaseNeeded: true,
        versionSourceTag: "package.json",
        versionSourceBase: packageVersion,
        versionExactTag: false,
        versionCommitsAnalyzed: 0,
      },
      outputFormat,
    );
    return;
  }

  const baseVersion = latestTag.replace(/^v/, "");
  const range = `${latestTag}..HEAD`;
  const commits = listCommits(range);
  const releaseType = getReleaseType(commits);
  const appVersion = incrementVersion(baseVersion, releaseType);

  emit(
    {
      appVersion,
      releaseType,
      releaseNeeded: releaseType !== "none",
      versionSourceTag: latestTag ?? "package.json",
      versionSourceBase: baseVersion,
      versionExactTag: false,
      versionCommitsAnalyzed: commits.length,
    },
    outputFormat,
  );
}

function emit(result, outputFormat) {
  if (outputFormat === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (outputFormat === "env") {
    process.stdout.write(
      `export APP_VERSION=${toEnvValue(result.appVersion)}\n`,
    );
    process.stdout.write(
      `export RELEASE_TYPE=${toEnvValue(result.releaseType)}\n`,
    );
    process.stdout.write(
      `export RELEASE_NEEDED=${toEnvValue(result.releaseNeeded)}\n`,
    );
    process.stdout.write(
      `export VERSION_SOURCE_TAG=${toEnvValue(result.versionSourceTag)}\n`,
    );
    process.stdout.write(
      `export VERSION_SOURCE_BASE=${toEnvValue(result.versionSourceBase)}\n`,
    );
    process.stdout.write(
      `export VERSION_EXACT_TAG=${toEnvValue(result.versionExactTag)}\n`,
    );
    process.stdout.write(
      `export VERSION_COMMITS_ANALYZED=${toEnvValue(result.versionCommitsAnalyzed)}\n`,
    );
    return;
  }

  process.stdout.write(`Computed version: ${result.appVersion}\n`);
  process.stdout.write(`Release type: ${result.releaseType}\n`);
  process.stdout.write(`Source tag: ${result.versionSourceTag}\n`);
  process.stdout.write(`Base version: ${result.versionSourceBase}\n`);
  process.stdout.write(`Commits analyzed: ${result.versionCommitsAnalyzed}\n`);
  process.stdout.write(`Release needed: ${result.releaseNeeded}\n`);
}

main();

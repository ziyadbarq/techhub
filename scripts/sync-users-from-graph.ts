#!/usr/bin/env tsx
/**
 * Microsoft Graph User Sync Script
 *
 * CLI script to synchronize users from Microsoft Entra ID (Azure AD)
 * to local Person records.
 *
 * Usage:
 *   npm run sync:users              # Interactive mode
 *   npm run sync:users -- --dry-run # Preview changes without applying
 *   npm run sync:users -- --help    # Show help
 */

import "reflect-metadata";
import { prisma, pool } from "../src/infrastructure/database/prisma/client.js";
import { confirm, select } from "@inquirer/prompts";
import chalk from "chalk";
import ora, { type Ora } from "ora";
import { initContainer, getContainer } from "../src/di/container.js";
import { DI_TOKENS } from "../src/di/types.js";
import type { SyncUsersFromGraphUseCase } from "../src/core/use-cases/foundation/person/index.js";
import { IMicrosoftGraphService } from "../src/core/services/microsoft-graph.service.interface.js";
import type {
  GraphSyncProgress,
  GraphSyncPhase,
} from "../src/lib/schemas/graph-sync-progress.types.js";

// Global state
let isDryRun = false;
let currentSpinner: Ora | null = null;
let lastPhase: GraphSyncPhase | null = null;

/**
 * Handle progress updates from the sync use case
 */
function handleProgress(progress: GraphSyncProgress): void {
  const { phase, phaseLabel, currentIndex, totalItems, stats } = progress;

  // Phase changed - complete previous spinner and start new one
  if (phase !== lastPhase) {
    if (currentSpinner) {
      currentSpinner.succeed();
    }

    // Don't start spinner for 'complete' phase
    if (phase !== "complete") {
      currentSpinner = ora({
        text: phaseLabel,
        color: "cyan",
      }).start();
    }

    lastPhase = phase;
  } else if (currentSpinner && phase !== "complete") {
    // Same phase - update spinner text with progress
    const statsText = buildStatsText(stats);
    if (totalItems > 1 && currentIndex > 0) {
      currentSpinner.text = `${phaseLabel} ${statsText}`;
    } else {
      currentSpinner.text = phaseLabel;
    }
  }
}

/**
 * Build stats text for spinner
 */
function buildStatsText(stats: GraphSyncProgress["stats"]): string {
  const parts: string[] = [];
  if (stats.created > 0) parts.push(chalk.green(`+${stats.created}`));
  if (stats.updated > 0) parts.push(chalk.blue(`↻${stats.updated}`));
  if (stats.excluded > 0) parts.push(chalk.gray(`⊖${stats.excluded}`));
  if (stats.errors > 0) parts.push(chalk.red(`✗${stats.errors}`));
  return parts.length > 0 ? `(${parts.join(" ")})` : "";
}

/**
 * Display welcome banner
 */
function displayBanner(): void {
  console.clear();
  console.log(
    chalk.cyan.bold(
      "\n╔═══════════════════════════════════════════════════════╗",
    ),
  );
  console.log(
    chalk.cyan.bold(
      "║      Microsoft Graph User Sync                        ║",
    ),
  );
  console.log(
    chalk.cyan.bold(
      "╚═══════════════════════════════════════════════════════╝\n",
    ),
  );
  console.log(
    chalk.gray("Synchronize users from Microsoft Entra ID (Azure AD)"),
  );
  console.log(chalk.gray("to local Person records.\n"));

  if (isDryRun) {
    console.log(
      chalk.yellow.bold("⚠️  DRY-RUN MODE: No changes will be applied\n"),
    );
  }
}

/**
 * Display help information
 */
function displayHelp(): void {
  console.log(chalk.cyan.bold("\nMicrosoft Graph User Sync - Help\n"));
  console.log(chalk.white("Usage:"));
  console.log(
    chalk.gray("  npm run sync:users              # Interactive mode"),
  );
  console.log(
    chalk.gray("  npm run sync:users -- --dry-run # Preview without applying"),
  );
  console.log(
    chalk.gray("  npm run sync:users -- --help    # Show this help\n"),
  );

  console.log(chalk.white("Environment Variables Required:"));
  console.log(chalk.gray("  AZURE_TENANT_ID      - Your Azure tenant ID"));
  console.log(
    chalk.gray("  AZURE_CLIENT_ID      - App registration client ID"),
  );
  console.log(
    chalk.gray("  AZURE_CLIENT_SECRET  - App registration client secret\n"),
  );

  console.log(chalk.white("What this script does:"));
  console.log(chalk.gray("  1. Fetches all users from Microsoft Graph API"));
  console.log(
    chalk.gray("  2. Creates new Person records for users not in the system"),
  );
  console.log(
    chalk.gray("  3. Updates existing Person records with latest data"),
  );
  console.log(
    chalk.gray("  4. Links manager relationships using Azure AD object IDs"),
  );
  console.log(
    chalk.gray("  5. Optionally deactivates users no longer in Azure AD\n"),
  );

  console.log(chalk.white("Notes:"));
  console.log(
    chalk.gray("  - Uses azureAdId as immutable identifier (not email)"),
  );
  console.log(chalk.gray("  - Runs backfill-azure-ad-ids first if needed"));
  console.log(chalk.gray("  - Guest users are excluded by default\n"));
}

/**
 * Validate environment and test connection
 */
async function validateEnvironment(): Promise<boolean> {
  try {
    // Check database connection
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log(chalk.red("✗ DATABASE_URL not found"));
      return false;
    }

    await prisma.$queryRaw`SELECT 1`;
    console.log(chalk.green("✓ Database connection successful"));

    // Check Azure credentials
    const missingVars: string[] = [];
    if (!process.env.AZURE_TENANT_ID) missingVars.push("AZURE_TENANT_ID");
    if (!process.env.AZURE_CLIENT_ID) missingVars.push("AZURE_CLIENT_ID");
    if (!process.env.AZURE_CLIENT_SECRET)
      missingVars.push("AZURE_CLIENT_SECRET");

    if (missingVars.length > 0) {
      console.log(
        chalk.red(`✗ Missing Azure credentials: ${missingVars.join(", ")}`),
      );
      return false;
    }

    // Initialize DI container
    initContainer();
    console.log(chalk.green("✓ DI container initialized"));

    // Test Microsoft Graph connection
    const container = getContainer();
    const graphService = container.get<IMicrosoftGraphService>(
      IMicrosoftGraphService,
    );

    const isConnected = await graphService.testConnection();
    if (!isConnected) {
      console.log(
        chalk.red("✗ Microsoft Graph connection failed. Check credentials."),
      );
      return false;
    }
    console.log(chalk.green("✓ Microsoft Graph connection successful\n"));

    return true;
  } catch (error) {
    console.error(chalk.red("✗ Environment validation failed:"), error);
    return false;
  }
}

/**
 * Select fallback organization unit for users whose department doesn't map
 * Note: Most users will be assigned org units automatically based on department
 */
async function selectFallbackOrgUnit(): Promise<string | null> {
  const orgUnits = await prisma.organizationUnit.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  if (orgUnits.length === 0) {
    console.log(chalk.red("✗ No organization units found. Create one first."));
    return null;
  }

  // Sort to put BARQ first (root company), then alphabetical
  const sortedOrgUnits = [...orgUnits].sort((a, b) => {
    if (a.code === "BARQ") return -1;
    if (b.code === "BARQ") return 1;
    return a.name.localeCompare(b.name);
  });

  // Find BARQ's id to set as default
  const barqOrgUnit = sortedOrgUnits.find((ou) => ou.code === "BARQ");

  console.log(
    chalk.gray(
      "\nNote: Users are assigned to org units based on their Azure AD department.",
    ),
  );
  console.log(
    chalk.gray(
      "This fallback is used when a department doesn't have a mapping.\n",
    ),
  );

  const selectedId = await select({
    message: "Select fallback organization unit:",
    choices: sortedOrgUnits.map((ou) => ({
      name: `${ou.name} (${ou.code})`,
      value: ou.id,
    })),
    default: barqOrgUnit?.id,
  });

  return selectedId;
}

/**
 * Select primary role for new users
 */
async function selectPrimaryRole(): Promise<string | null> {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    select: { id: true, name: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  if (roles.length === 0) {
    console.log(chalk.red("✗ No roles found. Create one first."));
    return null;
  }

  // Sort to put viewer first (minimal access role), then alphabetical
  const sortedRoles = [...roles].sort((a, b) => {
    if (a.name === "viewer") return -1;
    if (b.name === "viewer") return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  // Find viewer's id to set as default
  const viewerRole = sortedRoles.find((r) => r.name === "viewer");

  const selectedId = await select({
    message: "Select default primary role for new users:",
    choices: sortedRoles.map((r) => ({
      name: `${r.displayName} (${r.name})`,
      value: r.id,
    })),
    default: viewerRole?.id,
  });

  return selectedId;
}

/**
 * Run the sync process
 */
async function runSync(): Promise<void> {
  // Select defaults for new users
  console.log(chalk.white("Configure sync options:\n"));

  console.log(chalk.cyan.bold("📋 Department → Org Unit Mapping (Automatic):"));
  console.log(
    chalk.gray(
      "  Users are assigned to org units based on their Azure AD department field.",
    ),
  );
  console.log(
    chalk.gray(
      "  See graph-normalization.ts for the department mapping rules.\n",
    ),
  );

  const defaultOrgUnitId = await selectFallbackOrgUnit();
  if (!defaultOrgUnitId) {
    return;
  }

  const defaultPrimaryRoleId = await selectPrimaryRole();
  if (!defaultPrimaryRoleId) {
    return;
  }

  // Sync options
  const includeDisabled = await confirm({
    message: "Include disabled Azure AD users?",
    default: false,
  });

  const includeGuests = await confirm({
    message: "Include guest/external users?",
    default: false,
  });

  const deactivateMissing = await confirm({
    message: "Deactivate users not found in Azure AD?",
    default: true,
  });

  console.log("");

  // Dry run warning
  if (isDryRun) {
    console.log(
      chalk.yellow(
        "⚠️  DRY-RUN MODE: Showing what would happen, but not applying changes.\n",
      ),
    );

    // In dry-run mode, just show a preview
    const container = getContainer();
    const graphService = container.get<IMicrosoftGraphService>(
      IMicrosoftGraphService,
    );

    const graphUsers = await graphService.fetchAllUsers({
      includeDisabled,
      includeGuests,
    });

    // Get existing persons with azureAdId
    const existingPersons = await prisma.person.findMany({
      where: { azureAdId: { not: null } },
      select: { azureAdId: true },
    });

    const existingIds = new Set(existingPersons.map((p) => p.azureAdId));

    const newUsers = graphUsers.filter((u) => !existingIds.has(u.id));
    const updateUsers = graphUsers.filter((u) => existingIds.has(u.id));

    console.log(chalk.cyan.bold("┌─────────────────────────────────────────┐"));
    console.log(chalk.cyan.bold("│ Dry-Run Preview                         │"));
    console.log(chalk.cyan.bold("└─────────────────────────────────────────┘"));
    console.log(chalk.green(`  Would create: ${newUsers.length} new persons`));
    console.log(
      chalk.blue(`  Would update: ${updateUsers.length} existing persons`),
    );
    if (deactivateMissing) {
      const graphIds = new Set(graphUsers.map((u) => u.id));
      const toDeactivate = existingPersons.filter(
        (p) => p.azureAdId && !graphIds.has(p.azureAdId),
      );
      console.log(
        chalk.yellow(`  Would deactivate: ${toDeactivate.length} persons`),
      );
    }
    console.log("");

    // Show sample new users
    if (newUsers.length > 0) {
      console.log(chalk.gray("Sample new users (first 5):"));
      for (const user of newUsers.slice(0, 5)) {
        console.log(
          chalk.gray(
            `  ${user.displayName} <${user.mail || user.userPrincipalName}>`,
          ),
        );
      }
      if (newUsers.length > 5) {
        console.log(chalk.gray(`  ... and ${newUsers.length - 5} more\n`));
      } else {
        console.log("");
      }
    }

    console.log(
      chalk.blue(
        "✓ Dry-run complete. Run without --dry-run to apply changes.\n",
      ),
    );
    return;
  }

  // Confirm before running
  const confirmSync = await confirm({
    message: "Start user synchronization?",
    default: true,
  });

  if (!confirmSync) {
    console.log(chalk.yellow("\nSync cancelled by user"));
    return;
  }

  // Run sync
  console.log(chalk.gray("\n⏳ Starting user synchronization...\n"));

  // Reset spinner state
  currentSpinner = null;
  lastPhase = null;

  const container = getContainer();
  const syncUseCase = container.get<SyncUsersFromGraphUseCase>(
    DI_TOKENS.SyncUsersFromGraphUseCase,
  );

  const startTime = Date.now();

  const result = await syncUseCase.execute({
    includeDisabled,
    includeGuests,
    defaultOrgUnitId,
    defaultPrimaryRoleId,
    deactivateMissing,
    onProgress: handleProgress,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Display results
  console.log(chalk.cyan.bold("\n┌─────────────────────────────────────────┐"));
  console.log(chalk.cyan.bold("│ Sync Complete                           │"));
  console.log(chalk.cyan.bold("└─────────────────────────────────────────┘"));
  console.log(chalk.green(`  ✓ Created:     ${result.created}`));
  console.log(chalk.blue(`  ↻ Updated:     ${result.updated}`));
  console.log(chalk.yellow(`  ⊘ Deactivated: ${result.deactivated}`));
  if (result.excluded > 0) {
    console.log(
      chalk.gray(`  ⊖ Excluded:    ${result.excluded} (no department)`),
    );
  }
  if (result.errors.length > 0) {
    console.log(chalk.red(`  ✗ Errors:      ${result.errors.length}`));
  }
  console.log(chalk.gray(`  ⏱ Duration:    ${duration}s\n`));

  // Show errors if any
  if (result.errors.length > 0) {
    console.log(chalk.red("Errors:"));
    for (const error of result.errors.slice(0, 10)) {
      console.log(
        chalk.red(`  ✗ ${error.email || error.azureAdId}: ${error.error}`),
      );
    }
    if (result.errors.length > 10) {
      console.log(chalk.red(`  ... and ${result.errors.length - 10} more\n`));
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Parse command-line arguments
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
      displayHelp();
      process.exit(0);
    }
    if (args.includes("--dry-run")) {
      isDryRun = true;
    }

    // Display banner
    displayBanner();

    // Validate environment
    const isValid = await validateEnvironment();
    if (!isValid) {
      console.log(chalk.red("\n✗ Environment validation failed. Exiting."));
      process.exit(1);
    }

    // Run sync
    await runSync();

    console.log(chalk.cyan("\nDone! 👋\n"));
  } catch (error) {
    const err = error as { isTtyError?: boolean; name?: string };
    if (err.isTtyError) {
      console.error(
        chalk.red("\n✗ Prompt couldn't be rendered in the current environment"),
      );
    } else if (err.name === "ExitPromptError") {
      console.log(chalk.yellow("\n\nOperation cancelled by user"));
    } else {
      console.error(chalk.red("\n✗ Fatal error:"), error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the script
main();

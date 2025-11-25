#!/usr/bin/env tsx
/**
 * Backfill Azure AD IDs Script
 *
 * One-time script to match existing Person records with Azure AD users
 * by email address and populate the azureAdId field.
 *
 * This is a prerequisite for ongoing user sync to work correctly.
 *
 * Usage:
 *   npm run backfill:azure-ids              # Interactive mode
 *   npm run backfill:azure-ids -- --dry-run # Preview changes without applying
 *   npm run backfill:azure-ids -- --help    # Show help
 */

import "reflect-metadata";
import { prisma, pool } from "../src/infrastructure/database/prisma/client.js";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { initContainer, getContainer } from "../src/di/container.js";
import { IMicrosoftGraphService } from "../src/core/services/microsoft-graph.service.interface.js";
import type { GraphUser } from "../src/lib/schemas/graph-user.schema.js";

// Global state
let isDryRun = false;

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
      "║      Azure AD ID Backfill Script                      ║",
    ),
  );
  console.log(
    chalk.cyan.bold(
      "╚═══════════════════════════════════════════════════════╝\n",
    ),
  );
  console.log(
    chalk.gray("Match existing Person records with Azure AD users by email"),
  );
  console.log(chalk.gray("and populate the azureAdId field.\n"));

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
  console.log(chalk.cyan.bold("\nAzure AD ID Backfill - Help\n"));
  console.log(chalk.white("Usage:"));
  console.log(
    chalk.gray("  npm run backfill:azure-ids              # Interactive mode"),
  );
  console.log(
    chalk.gray(
      "  npm run backfill:azure-ids -- --dry-run # Preview without applying",
    ),
  );
  console.log(
    chalk.gray("  npm run backfill:azure-ids -- --help    # Show this help\n"),
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
    chalk.gray(
      "  2. Finds matching Person records by email (case-insensitive)",
    ),
  );
  console.log(chalk.gray("  3. Updates matched records with azureAdId\n"));

  console.log(chalk.white("Notes:"));
  console.log(
    chalk.gray("  - Only matches by email, not by name or other fields"),
  );
  console.log(
    chalk.gray("  - Persons without matching Azure AD users are skipped"),
  );
  console.log(
    chalk.gray("  - Persons with existing azureAdId are not modified\n"),
  );
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
 * Fetch all Graph users and create email lookup map
 */
async function fetchGraphUsers(): Promise<Map<string, GraphUser>> {
  console.log(chalk.gray("⏳ Fetching users from Microsoft Graph...\n"));

  const container = getContainer();
  const graphService = container.get<IMicrosoftGraphService>(
    IMicrosoftGraphService,
  );

  const graphUsers = await graphService.fetchAllUsers({
    includeDisabled: true,
    includeGuests: false,
  });

  console.log(chalk.green(`✓ Fetched ${graphUsers.length} users from Graph\n`));

  // Create email-to-user lookup map (case-insensitive)
  const emailToUser = new Map<string, GraphUser>();
  for (const user of graphUsers) {
    if (user.mail) {
      emailToUser.set(user.mail.toLowerCase(), user);
    }
    // Also index by UPN for users without mail
    emailToUser.set(user.userPrincipalName.toLowerCase(), user);
  }

  return emailToUser;
}

/**
 * Run the backfill process
 */
async function runBackfill(): Promise<void> {
  // Fetch Graph users
  const graphUsersByEmail = await fetchGraphUsers();

  // Fetch all persons without azureAdId
  const personsWithoutAzureId = await prisma.person.findMany({
    where: {
      azureAdId: null,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  console.log(
    chalk.white(
      `Found ${personsWithoutAzureId.length} persons without azureAdId\n`,
    ),
  );

  if (personsWithoutAzureId.length === 0) {
    console.log(chalk.green("✓ All persons already have azureAdId assigned"));
    return;
  }

  // Match persons with Graph users
  const matches: Array<{
    person: { id: string; firstName: string; lastName: string; email: string };
    graphUser: GraphUser;
  }> = [];

  const unmatched: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  }> = [];

  for (const person of personsWithoutAzureId) {
    const normalizedEmail = person.email.toLowerCase();
    const graphUser = graphUsersByEmail.get(normalizedEmail);

    if (graphUser) {
      matches.push({ person, graphUser });
    } else {
      unmatched.push(person);
    }
  }

  // Display summary
  console.log(chalk.cyan.bold("┌─────────────────────────────────────────┐"));
  console.log(chalk.cyan.bold("│ Match Summary                           │"));
  console.log(chalk.cyan.bold("└─────────────────────────────────────────┘"));
  console.log(chalk.green(`  ✓ Matched:   ${matches.length}`));
  console.log(chalk.yellow(`  ⊘ Unmatched: ${unmatched.length}\n`));

  if (matches.length === 0) {
    console.log(
      chalk.yellow(
        "⚠️  No matches found. Ensure email addresses match between systems.",
      ),
    );
    return;
  }

  // Show sample matches
  console.log(chalk.gray("Sample matches (first 10):"));
  for (const match of matches.slice(0, 10)) {
    console.log(chalk.gray(`  ${match.person.email} → ${match.graphUser.id}`));
  }
  if (matches.length > 10) {
    console.log(chalk.gray(`  ... and ${matches.length - 10} more\n`));
  } else {
    console.log("");
  }

  // Confirm before applying
  if (!isDryRun) {
    const confirmApply = await confirm({
      message: `Update ${matches.length} persons with azureAdId?`,
      default: false,
    });

    if (!confirmApply) {
      console.log(chalk.yellow("\nOperation cancelled by user"));
      return;
    }
  }

  // Apply updates
  console.log(chalk.gray("\n⏳ Updating person records...\n"));

  let successCount = 0;
  let errorCount = 0;

  for (const match of matches) {
    try {
      if (isDryRun) {
        console.log(
          chalk.blue(
            `  [DRY-RUN] Would update ${match.person.email} → ${match.graphUser.id}`,
          ),
        );
        successCount++;
      } else {
        await prisma.person.update({
          where: { id: match.person.id },
          data: { azureAdId: match.graphUser.id },
        });
        console.log(chalk.green(`  ✓ Updated ${match.person.email}`));
        successCount++;
      }
    } catch (error) {
      console.log(
        chalk.red(
          `  ✗ Failed to update ${match.person.email}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ),
      );
      errorCount++;
    }
  }

  // Final summary
  console.log(chalk.cyan.bold("\n┌─────────────────────────────────────────┐"));
  console.log(chalk.cyan.bold("│ Backfill Complete                       │"));
  console.log(chalk.cyan.bold("└─────────────────────────────────────────┘"));
  console.log(chalk.green(`  ✓ Updated:  ${successCount}`));
  if (errorCount > 0) {
    console.log(chalk.red(`  ✗ Errors:   ${errorCount}`));
  }
  console.log(chalk.yellow(`  ⊘ Skipped:  ${unmatched.length} (no match)\n`));

  if (isDryRun) {
    console.log(
      chalk.blue(
        "✓ Dry-run complete. Run without --dry-run to apply changes.\n",
      ),
    );
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

    // Run backfill
    await runBackfill();

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

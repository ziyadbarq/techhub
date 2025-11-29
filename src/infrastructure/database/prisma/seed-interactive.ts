/**
 * Interactive Database Seed Script (Idempotent / Append-Only)
 *
 * Provides a CLI interface for selectively seeding database modules.
 * Features:
 * - Multi-select module picker with dependency resolution
 * - Preset system (load/save common configurations)
 * - Built-in presets: production, dev
 * - Estimated time calculation
 * - Validation with warnings and errors
 *
 * IMPORTANT: This seeder is fully IDEMPOTENT:
 * - Never wipes existing data
 * - Never creates duplicates (uses upsert/check-before-create)
 * - Safe to run multiple times
 * - Amends missing data without affecting existing records
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { prisma } from "./client.js";
import {
  SeedModule,
  MODULE_METADATA,
  resolveDependencies,
  getMissingDependencies,
  validateSelection,
  calculateEstimatedTime,
  BUILTIN_PRESETS,
} from "./seed-dependencies.js";
import {
  getPreset,
  savePreset,
  isValidPresetName,
} from "./seed-presets-manager.js";
import { seedPrompts } from "./seed-prompts.js";
import { seedRBAC } from "./seed-rbac.js";
import { seedFoundation, seedDemoPersons } from "./seed-foundation.js";
import { seedAssetConfig, seedDemoAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { seedAttachments } from "./seed-attachments.js";
import { seedGovernance } from "./seed-governance.js";
import {
  seedBusinessProcesses,
  seedServices,
  seedServiceOwners,
} from "./seed-services.js";
import { logSection, logSuccess, logStep } from "./seed-utils.js";
import {
  initializeCodeSequences,
  seedExampleTasks,
  cleanupDemoData,
  type CleanupResult,
} from "./seed-operations.js";

/**
 * CLI argument parsing
 */
interface CLIArgs {
  preset?: string;
  production?: boolean;
  dev?: boolean;
  cleanup?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--preset" && i + 1 < argv.length) {
      args.preset = argv[i + 1];
      i++;
    } else if (arg === "--production") {
      args.production = true;
    } else if (arg === "--dev") {
      args.dev = true;
    } else if (arg === "--cleanup") {
      args.cleanup = true;
    }
  }

  return args;
}

/**
 * Get initial module selection based on CLI args or prompt user
 */
async function getInitialSelection(args: CLIArgs): Promise<SeedModule[]> {
  // Check for CLI preset flags
  if (args.production) {
    return BUILTIN_PRESETS.find((p) => p.name === "production")!.modules;
  }
  if (args.dev) {
    return BUILTIN_PRESETS.find((p) => p.name === "dev")!.modules;
  }
  if (args.preset) {
    const preset = await getPreset(args.preset);
    if (!preset) {
      console.error(chalk.red(`❌ Preset '${args.preset}' not found`));
      process.exit(1);
    }
    return preset.modules;
  }

  // No CLI args, return empty (will prompt user)
  return [];
}

/**
 * Main interactive prompts
 */
async function promptUserSelection(): Promise<{
  selectedModules: SeedModule[];
  saveAsPreset: boolean;
  presetName?: string;
  presetDescription?: string;
}> {
  console.log(chalk.cyan.bold("\n🌱 Interactive Database Seeding"));
  console.log(chalk.cyan("━".repeat(60)));
  console.log("");

  // Step 1: Ask if user wants to load a preset
  const { loadPreset } = await inquirer.prompt<{ loadPreset: string | null }>([
    {
      type: "rawlist",
      name: "loadPreset",
      message: "Load a preset or choose modules manually?",
      choices: [
        { name: "(Choose modules manually)", value: null },
        {
          name: "production - Production config only (no demo data)",
          value: "production",
        },
        {
          name: "dev - Full development environment with all demo data",
          value: "dev",
        },
      ],
    },
  ]);

  let selectedModules: SeedModule[] = [];

  if (loadPreset) {
    const preset = await getPreset(loadPreset);
    selectedModules = preset!.modules;

    console.log(chalk.green(`\n✓ Loaded preset: ${chalk.bold(loadPreset)}`));
    console.log(
      chalk.gray(
        `  Modules: ${selectedModules.map((m) => MODULE_METADATA[m].name).join(", ")}`,
      ),
    );
  } else {
    // Step 2: Multi-select modules
    const moduleChoices = Object.values(SeedModule).map((module) => {
      const metadata = MODULE_METADATA[module];
      const deps =
        metadata.dependencies.length > 0
          ? chalk.gray(
              ` [requires: ${metadata.dependencies.map((d) => MODULE_METADATA[d].name).join(", ")}]`,
            )
          : "";
      return {
        name: `${chalk.bold(metadata.name)} - ${chalk.gray(metadata.description)} ${chalk.yellow(`[~${metadata.estimatedTime}s]`)}${deps}`,
        value: module,
        checked: false,
      };
    });

    const { modules } = await inquirer.prompt<{ modules: SeedModule[] }>([
      {
        type: "checkbox",
        name: "modules",
        message:
          "Select modules to seed (Use space to select, a to toggle all):",
        choices: moduleChoices,
        validate: (answer) =>
          answer.length > 0 ? true : "You must select at least one module",
      },
    ]);

    selectedModules = modules;
  }

  // Step 3: Check for missing dependencies
  const missing = getMissingDependencies(selectedModules);
  if (missing.length > 0) {
    console.log(
      chalk.yellow(
        `\n⚠️  Missing required dependencies: ${missing.map((m) => MODULE_METADATA[m].name).join(", ")}`,
      ),
    );
    const { addDeps } = await inquirer.prompt<{ addDeps: boolean }>([
      {
        type: "confirm",
        name: "addDeps",
        message: "Automatically include required dependencies?",
        default: true,
      },
    ]);

    if (addDeps) {
      selectedModules = resolveDependencies(selectedModules);
      console.log(chalk.green("✓ Added missing dependencies"));
    } else {
      console.log(chalk.red("❌ Cannot proceed without required dependencies"));
      process.exit(1);
    }
  } else {
    selectedModules = resolveDependencies(selectedModules);
  }

  // Step 4: Validate selection
  const validation = validateSelection(selectedModules);
  if (validation.warnings.length > 0) {
    console.log(chalk.yellow("\n⚠️  Warnings:"));
    validation.warnings.forEach((w) => console.log(chalk.yellow(`  - ${w}`)));
  }

  // Step 5: Show summary and estimated time
  const estimatedTime = calculateEstimatedTime(selectedModules);
  console.log(chalk.cyan("\n📊 Summary:"));
  console.log(
    chalk.gray(
      `  Modules: ${selectedModules.map((m) => MODULE_METADATA[m].name).join(", ")}`,
    ),
  );
  console.log(
    chalk.gray(`  Estimated time: ${chalk.bold(estimatedTime + "s")}`),
  );
  console.log(
    chalk.green(`\n✓ Idempotent mode: Existing data will be preserved`),
  );

  // Step 6: Confirmation
  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: "confirm",
      name: "confirm",
      message: "Proceed with seeding?",
      default: true,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray("Cancelled."));
    process.exit(0);
  }

  // Step 7: Save as preset?
  const { saveAsPreset } = await inquirer.prompt<{ saveAsPreset: boolean }>([
    {
      type: "confirm",
      name: "saveAsPreset",
      message: "Save this selection as a preset?",
      default: false,
    },
  ]);

  let presetName: string | undefined;
  let presetDescription: string | undefined;

  if (saveAsPreset) {
    const presetAnswers = await inquirer.prompt<{
      name: string;
      description: string;
    }>([
      {
        type: "input",
        name: "name",
        message: "Preset name (lowercase, hyphens allowed):",
        validate: (input) => {
          if (!isValidPresetName(input)) {
            return "Invalid name. Use lowercase letters, numbers, hyphens, and underscores only.";
          }
          if (BUILTIN_PRESETS.some((p) => p.name === input)) {
            return "Cannot override built-in preset. Choose a different name.";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "description",
        message: "Preset description:",
        default: `Custom preset with ${selectedModules.length} modules`,
      },
    ]);

    presetName = presetAnswers.name;
    presetDescription = presetAnswers.description;
  }

  return {
    selectedModules,
    saveAsPreset,
    presetName,
    presetDescription,
  };
}

/**
 * Initialize code sequences (always needed, idempotent)
 */
async function initCodeSequencesWithLogging() {
  logStep("🔢", "Initializing code sequences...");
  const count = await initializeCodeSequences(prisma);
  if (count > 0) {
    logSuccess(`Initialized ${count} code sequences`);
  } else {
    logSuccess(`Code sequences already initialized`);
  }
}

/**
 * Execute seeding for selected modules
 */
async function executeSeed(modules: SeedModule[]) {
  const executionOrder = resolveDependencies(modules);

  for (const seedModule of executionOrder) {
    const metadata = MODULE_METADATA[seedModule];
    const startTime = Date.now();

    logSection(metadata.name);
    logStep("🌱", `Seeding ${metadata.description}...`);

    try {
      switch (seedModule) {
        // Production modules
        case SeedModule.RBAC:
          await seedRBAC();
          break;
        case SeedModule.FOUNDATION:
          await seedFoundation(prisma);
          break;
        case SeedModule.BUSINESS_PROCESSES:
          await seedBusinessProcesses(prisma);
          break;
        case SeedModule.ASSET_CONFIG:
          await seedAssetConfig(prisma);
          break;
        case SeedModule.CMDB:
          await seedCMDB(prisma);
          break;
        case SeedModule.SERVICES:
          await seedServices(prisma);
          break;
        case SeedModule.ATTACHMENTS_GOVERNANCE:
          await seedAttachments(prisma);
          await seedGovernance(prisma);
          break;
        // Demo-only modules
        case SeedModule.DEMO_PERSONS:
          await seedDemoPersons(prisma);
          break;
        case SeedModule.DEMO_ASSETS:
          await seedDemoAssets(prisma);
          break;
        case SeedModule.SERVICE_OWNERS:
          await seedServiceOwners(prisma);
          break;
        case SeedModule.WARRANTIES_MAINTENANCE:
          await seedWarrantiesMaintenance(prisma);
          break;
        case SeedModule.LAYER3_ITAM:
          await seedLayer3ITAM(prisma);
          break;
        case SeedModule.AI_PROMPTS_TASKS:
          await seedPrompts(prisma);
          await seedExampleTasks(prisma);
          break;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      logSuccess(`${metadata.name} completed in ${duration}s`);
      console.log("");
    } catch (error) {
      console.error(chalk.red(`❌ Failed to seed ${metadata.name}: ${error}`));
      throw error;
    }
  }
}

/**
 * Display cleanup result summary
 */
function displayCleanupResult(result: CleanupResult) {
  const items: { label: string; count: number }[] = [
    { label: "Assets", count: result.assets },
    { label: "Warranties", count: result.warranties },
    { label: "Maintenance schedules", count: result.maintenanceSchedules },
    { label: "Maintenance records", count: result.maintenanceRecords },
    { label: "Asset assignments", count: result.assetAssignments },
    { label: "Stock movements", count: result.stockMovements },
    { label: "Asset kits", count: result.assetKits },
    { label: "Asset kit items", count: result.assetKitItems },
    { label: "Asset kit checkouts", count: result.assetKitCheckouts },
    { label: "Asset kit checkout items", count: result.assetKitCheckoutItems },
    { label: "Asset reservations", count: result.assetReservations },
    {
      label: "Asset reservation conflicts",
      count: result.assetReservationConflicts,
    },
    { label: "Asset disposals", count: result.assetDisposals },
    { label: "Disposal approvals", count: result.disposalApprovals },
    { label: "Disposal documents", count: result.disposalDocuments },
    { label: "Configuration items", count: result.configurationItems },
    { label: "CI relationships", count: result.ciRelationships },
    { label: "Tasks", count: result.tasks },
    { label: "Verification items", count: result.verificationItems },
    { label: "Verification campaigns", count: result.verificationCampaigns },
    { label: "Data ownerships", count: result.dataOwnerships },
    { label: "Persons (demo)", count: result.persons },
    {
      label: "Prompt composition blocks",
      count: result.promptCompositionBlocks,
    },
    { label: "Prompt compositions", count: result.promptCompositions },
    { label: "Prompt blocks", count: result.promptBlocks },
  ];

  // Only show items with counts > 0
  const deletedItems = items.filter((i) => i.count > 0);

  if (deletedItems.length === 0) {
    console.log(chalk.yellow("\n  No demo data found to delete."));
    return;
  }

  console.log(chalk.gray("\nDeleted:"));
  for (const item of deletedItems) {
    console.log(chalk.gray(`  • ${item.count} ${item.label.toLowerCase()}`));
  }
  console.log(chalk.bold(`\n  Total: ${result.total} records deleted`));
}

/**
 * Execute cleanup flow
 */
async function executeCleanupFlow(): Promise<boolean> {
  console.log(chalk.yellow.bold("\n⚠️  DEMO DATA CLEANUP"));
  console.log(chalk.yellow("━".repeat(60)));

  console.log(chalk.white("\nThis will DELETE the following demo data:"));
  console.log(
    chalk.gray(
      "  • Assets and related records (assignments, warranties, maintenance)",
    ),
  );
  console.log(chalk.gray("  • Asset kits, reservations, disposals"));
  console.log(chalk.gray("  • Configuration items and relationships"));
  console.log(chalk.gray("  • Example tasks and AI prompt templates"));
  console.log(chalk.gray("  • Demo persons (without Microsoft ID)"));

  console.log(chalk.white("\nThis will PRESERVE system configuration:"));
  console.log(chalk.green("  • RBAC (permissions, roles)"));
  console.log(chalk.green("  • Feature flags"));
  console.log(chalk.green("  • Services and ownership (real Barq services)"));
  console.log(chalk.green("  • Vendors, Locations, Organization Units"));
  console.log(chalk.green("  • Asset Categories & Models"));
  console.log(chalk.green("  • CMDB Classes & Relationship Types"));
  console.log(chalk.green("  • Lifecycle models and states"));
  console.log(chalk.green("  • Exchange rates, Business Processes"));

  const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
    {
      type: "confirm",
      name: "confirm",
      message: "Are you sure you want to cleanup demo data?",
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray("\nCancelled."));
    return false;
  }

  console.log(chalk.cyan("\n🧹 Cleaning up demo data..."));
  console.log(chalk.cyan("━".repeat(60)) + "\n");

  const startTime = Date.now();

  try {
    logStep("🗑️", "Deleting demo data...");
    const result = await cleanupDemoData(prisma);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(chalk.green.bold("\n✅ CLEANUP COMPLETED SUCCESSFULLY!"));
    console.log(chalk.green("━".repeat(60)));

    displayCleanupResult(result);

    console.log(chalk.gray(`\nCompleted in ${duration}s`));
    console.log(
      chalk.gray("\nTo re-seed demo data, run: npm run db:seed:interactive\n"),
    );

    return true;
  } catch (error) {
    console.error(chalk.red.bold("\n❌ CLEANUP FAILED"));
    console.error(chalk.red("━".repeat(60)));
    console.error("\nError details:", error);
    throw error;
  }
}

/**
 * Prompt user to choose between seed and cleanup
 */
async function promptAction(): Promise<"seed" | "cleanup"> {
  const { action } = await inquirer.prompt<{ action: "seed" | "cleanup" }>([
    {
      type: "rawlist",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "🌱 Seed database modules", value: "seed" },
        {
          name: "🧹 Cleanup demo data (preserve system config)",
          value: "cleanup",
        },
      ],
    },
  ]);

  return action;
}

/**
 * Main execution
 */
async function main() {
  const overallStartTime = Date.now();

  try {
    const args = parseArgs();

    // Handle cleanup mode (CLI flag or interactive selection)
    if (args.cleanup) {
      // CLI cleanup mode - go directly to cleanup flow
      console.log(chalk.cyan.bold("\n🌱 Interactive Database Seeding"));
      console.log(chalk.cyan("━".repeat(60)));
      await executeCleanupFlow();
      return;
    }

    const initialSelection = await getInitialSelection(args);

    // If no CLI args, show action selection menu first
    if (initialSelection.length === 0) {
      console.log(chalk.cyan.bold("\n🌱 Interactive Database Seeding"));
      console.log(chalk.cyan("━".repeat(60)));
      console.log("");

      const action = await promptAction();

      if (action === "cleanup") {
        await executeCleanupFlow();
        return;
      }
      // Otherwise continue with seeding flow
    }

    let selection: Awaited<ReturnType<typeof promptUserSelection>>;

    if (initialSelection.length > 0) {
      // CLI args provided, skip prompts (except confirmation)
      const estimatedTime = calculateEstimatedTime(initialSelection);
      console.log(chalk.cyan.bold("\n🌱 Database Seeding (CLI Mode)"));
      console.log(chalk.cyan("━".repeat(60)));
      console.log(
        chalk.gray(
          `\nModules: ${initialSelection.map((m) => MODULE_METADATA[m].name).join(", ")}`,
        ),
      );
      console.log(chalk.gray(`Estimated time: ${estimatedTime}s\n`));

      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: "Proceed with seeding?",
          default: true,
        },
      ]);

      if (!confirm) {
        console.log(chalk.gray("Cancelled."));
        process.exit(0);
      }

      selection = {
        selectedModules: initialSelection,
        saveAsPreset: false,
      };
    } else {
      // Interactive mode - continue with module selection
      selection = await promptUserSelection();
    }

    console.log(chalk.cyan("\n🌱 Starting seed process (idempotent mode)..."));
    console.log(chalk.cyan("━".repeat(60)) + "\n");

    // Step 1: Initialize code sequences (idempotent)
    await initCodeSequencesWithLogging();
    console.log("");

    // Step 2: Execute seeding (idempotent - no duplicates, no overwrites)
    await executeSeed(selection.selectedModules);

    // Step 3: Save preset if requested
    if (selection.saveAsPreset && selection.presetName) {
      await savePreset(
        selection.presetName,
        selection.presetDescription || "",
        selection.selectedModules,
      );
      console.log(chalk.green(`\n💾 Saved preset '${selection.presetName}'`));
      console.log(
        chalk.gray(
          `   Next time, run: ${chalk.bold(`npm run db:seed:interactive -- --preset=${selection.presetName}`)}`,
        ),
      );
    }

    // Final summary
    const overallDuration = ((Date.now() - overallStartTime) / 1000).toFixed(2);
    console.log(chalk.green.bold("\n✅ SEEDING COMPLETED SUCCESSFULLY!"));
    console.log(chalk.green("━".repeat(60)));
    console.log(
      chalk.gray(
        `\nSeeded ${selection.selectedModules.length} modules in ${overallDuration}s`,
      ),
    );
    console.log(
      chalk.gray(
        `Modules: ${selection.selectedModules.map((m) => MODULE_METADATA[m].name).join(", ")}`,
      ),
    );
    console.log(chalk.gray("\nRun: npm run dev\n"));
  } catch (error) {
    console.error(chalk.red.bold("\n❌ SEEDING FAILED"));
    console.error(chalk.red("━".repeat(60)));
    console.error("\nError details:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(chalk.red("❌ Seed failed:"), error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Interactive Database Seed Script
 *
 * Provides a CLI interface for selectively seeding database modules.
 * Features:
 * - Multi-select module picker with dependency resolution
 * - Cleanup strategy options (full/module-specific/append-only)
 * - Preset system (load/save common configurations)
 * - Built-in presets: full, minimal, dev, rbac-only, etc.
 * - Estimated time calculation
 * - Validation with warnings and errors
 */

import inquirer from "inquirer";
import chalk from "chalk";
import { prisma } from "./client.js";
import {
  SeedModule,
  MODULE_METADATA,
  resolveDependencies,
  getTablesToCleanup,
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
import { seedFoundation } from "./seed-foundation.js";
import { seedAssets } from "./seed-assets.js";
import { seedWarrantiesMaintenance } from "./seed-warranties-maintenance.js";
import { seedCMDB } from "./seed-cmdb.js";
import { seedLayer3ITAM } from "./seed-layer3-itam.js";
import { seedAttachments } from "./seed-attachments.js";
import { seedGovernance } from "./seed-governance.js";
import { seedBusinessProcesses, seedServices } from "./seed-services.js";
import { logSection, logSuccess, logStep } from "./seed-utils.js";
import {
  performFullCleanup,
  initializeCodeSequences,
  seedExampleTasks,
} from "./seed-operations.js";

/**
 * CLI argument parsing
 */
interface CLIArgs {
  preset?: string;
  minimal?: boolean;
  full?: boolean;
  dev?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--preset" && i + 1 < argv.length) {
      args.preset = argv[i + 1];
      i++;
    } else if (arg === "--minimal") {
      args.minimal = true;
    } else if (arg === "--full") {
      args.full = true;
    } else if (arg === "--dev") {
      args.dev = true;
    }
  }

  return args;
}

/**
 * Get initial module selection based on CLI args or prompt user
 */
async function getInitialSelection(args: CLIArgs): Promise<SeedModule[]> {
  // Check for CLI preset flags
  if (args.minimal) {
    return BUILTIN_PRESETS.find((p) => p.name === "minimal")!.modules;
  }
  if (args.full) {
    return Object.values(SeedModule);
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
  cleanupStrategy: "full" | "module" | "none";
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
        { name: "full - Complete database seed (all modules)", value: "full" },
        {
          name: "minimal - Minimal setup (RBAC + Foundation only)",
          value: "minimal",
        },
        {
          name: "dev - Common dev data (RBAC + Foundation + Assets)",
          value: "dev",
        },
        {
          name: "rbac-only - RBAC system only (permissions + roles)",
          value: "rbac-only",
        },
        {
          name: "itam-complete - Full ITAM stack (Assets + Warranties + Layer 3)",
          value: "itam-complete",
        },
        {
          name: "services-complete - Service management with dependencies",
          value: "services-complete",
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

  // Step 6: Cleanup strategy
  const tablesToCleanup = getTablesToCleanup(selectedModules);
  console.log(
    chalk.yellow(
      `\n⚠️  Cleanup will affect ${tablesToCleanup.length} tables: ${tablesToCleanup.slice(0, 5).join(", ")}${tablesToCleanup.length > 5 ? "..." : ""}`,
    ),
  );

  const { cleanupStrategy } = await inquirer.prompt<{
    cleanupStrategy: "full" | "module" | "none";
  }>([
    {
      type: "rawlist",
      name: "cleanupStrategy",
      message: "Cleanup strategy:",
      choices: [
        { name: "Full cleanup (delete ALL data)", value: "full" },
        {
          name: "Module-specific (delete only selected modules)",
          value: "module",
        },
        { name: "Keep existing (append new data)", value: "none" },
      ],
      default: "module",
    },
  ]);

  // Step 7: Confirmation
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

  // Step 8: Save as preset?
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
    cleanupStrategy,
    saveAsPreset,
    presetName,
    presetDescription,
  };
}

/**
 * Perform cleanup based on strategy
 */
async function performCleanup(
  strategy: "full" | "module" | "none",
  selectedModules: SeedModule[],
) {
  if (strategy === "none") {
    logStep("ℹ️", "Skipping cleanup (append-only mode)");
    return;
  }

  logStep("🧹", "Cleaning up database...");

  if (strategy === "full") {
    // Full cleanup using shared operation
    await performFullCleanup(prisma);
    logSuccess("Full cleanup completed");
  } else {
    // Module-specific cleanup
    const tables = getTablesToCleanup(selectedModules);
    for (const table of tables) {
      // Dynamically access prisma models
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = (prisma as Record<string, any>)[
        table.charAt(0).toLowerCase() + table.slice(1)
      ];
      if (model) {
        await model.deleteMany({});
      }
    }
    logSuccess(`Cleaned ${tables.length} tables`);
  }
}

/**
 * Initialize code sequences (always needed)
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
        case SeedModule.RBAC:
          await seedRBAC();
          break;
        case SeedModule.FOUNDATION:
          await seedFoundation(prisma);
          break;
        case SeedModule.BUSINESS_PROCESSES:
          await seedBusinessProcesses(prisma);
          break;
        case SeedModule.ASSETS:
          await seedAssets(prisma);
          break;
        case SeedModule.WARRANTIES_MAINTENANCE:
          await seedWarrantiesMaintenance(prisma);
          break;
        case SeedModule.SERVICES:
          await seedServices(prisma);
          break;
        case SeedModule.CMDB:
          await seedCMDB(prisma);
          break;
        case SeedModule.LAYER3_ITAM:
          await seedLayer3ITAM(prisma);
          break;
        case SeedModule.ATTACHMENTS_GOVERNANCE:
          await seedAttachments(prisma);
          await seedGovernance(prisma);
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
 * Main execution
 */
async function main() {
  const overallStartTime = Date.now();

  try {
    const args = parseArgs();
    const initialSelection = await getInitialSelection(args);

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
        cleanupStrategy: "module",
        saveAsPreset: false,
      };
    } else {
      // Interactive mode
      selection = await promptUserSelection();
    }

    console.log(chalk.cyan("\n🌱 Starting seed process..."));
    console.log(chalk.cyan("━".repeat(60)) + "\n");

    // Step 1: Cleanup
    await performCleanup(selection.cleanupStrategy, selection.selectedModules);
    console.log("");

    // Step 2: Initialize code sequences
    await initCodeSequencesWithLogging();
    console.log("");

    // Step 3: Execute seeding
    await executeSeed(selection.selectedModules);

    // Step 4: Save preset if requested
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

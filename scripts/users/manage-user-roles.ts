#!/usr/bin/env tsx
/**
 * Interactive User Role Manager
 *
 * A CLI tool for managing user role assignments with conflict detection,
 * audit logging, and permission cache invalidation.
 *
 * Built with:
 *   - @inquirer/prompts v8 (modern ESM API)
 *   - chalk v5 (terminal styling)
 *   - Prisma v7 (database access)
 *
 * Usage:
 *   npm run roles:manage              # Interactive mode
 *   npm run roles:manage -- --dry-run # Preview changes without applying
 *   npm run roles:manage -- --help    # Show help
 */

import "reflect-metadata";
import {
  prisma,
  pool,
} from "../../src/infrastructure/database/prisma/client.js";
import { select, checkbox, confirm, input } from "@inquirer/prompts";
import chalk from "chalk";
import { createId as cuid } from "@paralleldrive/cuid2";
import {
  rolesConflict,
  CONFLICT_REASONS,
  CONFLICT_CONFIG,
  type ConflictSeverity,
} from "../../src/lib/rbac/role-conflicts.js";

// Types
interface UserWithRoles {
  id: string;
  email: string;
  name: string | null;
  roles: Array<{
    id: string;
    roleId: string;
    expiresAt: Date | null;
    createdAt: Date;
    role: {
      id: string;
      name: string;
      displayName: string;
      description: string | null;
      isSystem: boolean;
    };
  }>;
}

interface RoleInfo {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
}

interface ConflictInfo {
  conflictingRole: string;
  reason: string;
  severity: ConflictSeverity;
}

// Global state
let isDryRun = false;
let currentUser: UserWithRoles | null = null;

/**
 * Display welcome banner and instructions
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
      "║      Interactive User Role Manager                    ║",
    ),
  );
  console.log(
    chalk.cyan.bold(
      "╚═══════════════════════════════════════════════════════╝\n",
    ),
  );
  console.log(
    chalk.gray("Manage user role assignments with conflict detection"),
  );
  console.log(chalk.gray("and automatic audit logging.\n"));

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
  console.log(chalk.cyan.bold("\nUser Role Manager - Help\n"));
  console.log(chalk.white("Usage:"));
  console.log(
    chalk.gray("  npm run roles:manage              # Interactive mode"),
  );
  console.log(
    chalk.gray(
      "  npm run roles:manage -- --dry-run # Preview without applying",
    ),
  );
  console.log(
    chalk.gray("  npm run roles:manage -- --help    # Show this help\n"),
  );

  console.log(chalk.white("Features:"));
  console.log(chalk.gray("  • Search and select users by email"));
  console.log(chalk.gray("  • View current role assignments"));
  console.log(chalk.gray("  • Add/remove roles with multi-select"));
  console.log(chalk.gray("  • Automatic conflict detection (SAMA compliance)"));
  console.log(
    chalk.gray("  • Audit logging and permission cache invalidation\n"),
  );

  console.log(chalk.white("Role Conflict Severities:"));
  console.log(
    chalk.red("  CRITICAL") +
      chalk.gray(" - Blocks assignment (SAMA compliance)"),
  );
  console.log(
    chalk.yellow("  ERROR   ") +
      chalk.gray(" - Blocks assignment (SOD violation)"),
  );
  console.log(
    chalk.blue("  WARNING ") + chalk.gray(" - Allows with confirmation\n"),
  );

  console.log(chalk.white("Examples:"));
  console.log(chalk.gray("  1. Add 'asset-manager' role to user"));
  console.log(chalk.gray("  2. Remove multiple roles from user"));
  console.log(chalk.gray("  3. Preview changes with --dry-run flag\n"));
}

/**
 * Validate database connection and environment
 */
async function validateEnvironment(): Promise<void> {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not found in environment variables");
    }

    // Extract database name from connection string
    const dbMatch = databaseUrl.match(/\/([^?]+)(?:\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : "unknown";

    console.log(chalk.gray(`\n📊 Database: ${chalk.white(dbName)}`));

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log(chalk.green("✓ Database connection successful\n"));
  } catch (error) {
    console.error(chalk.red("✗ Database connection failed:"), error);
    throw error;
  }
}

/**
 * Search and select a user
 */
async function selectUser(): Promise<UserWithRoles | null> {
  try {
    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        email: "asc",
      },
      take: 5,
    });

    if (users.length === 0) {
      console.log(chalk.yellow("\n⚠️  No users found in database"));
      return null;
    }

    // Prompt for user selection with modern select API
    const choices = users.map((u) => ({
      name: `${u.email}${u.name ? chalk.gray(` (${u.name})`) : ""}`,
      value: u.email,
    }));
    choices.push({ name: "Search by email", value: "search" });

    const selectedValue = await select({
      message: "Select user:",
      choices,
      pageSize: 15,
      loop: false,
    });

    let selectedEmail: string;
    if (selectedValue === "search") {
      selectedEmail = await input({
        message: "Enter user email:",
      });
    } else {
      selectedEmail = selectedValue;
    }

    // Fetch user with roles
    const user = await prisma.user.findUnique({
      where: { email: selectedEmail },
      include: {
        roles: {
          include: {
            role: true,
          },
          where: {
            role: {
              isActive: true,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      console.log(chalk.red(`\n✗ User not found: ${selectedEmail}`));
      return null;
    }

    return user as UserWithRoles;
  } catch (error) {
    console.error(chalk.red("Error selecting user:"), error);
    return null;
  }
}

/**
 * Display user summary with current roles
 */
function displayUserSummary(user: UserWithRoles): void {
  console.log(chalk.cyan.bold("\n┌─────────────────────────────────────────┐"));
  console.log(chalk.cyan.bold("│ User Summary                            │"));
  console.log(chalk.cyan.bold("└─────────────────────────────────────────┘"));
  console.log(chalk.gray("ID:    ") + chalk.white(user.id));
  console.log(chalk.gray("Email: ") + chalk.white(user.email));
  console.log(chalk.gray("Name:  ") + chalk.white(user.name || "(not set)"));

  console.log(chalk.gray("\nCurrent Roles:"));
  if (user.roles.length === 0) {
    console.log(chalk.yellow("  (no roles assigned)"));
  } else {
    user.roles.forEach((ur) => {
      const expiration = ur.expiresAt
        ? chalk.yellow(` [expires: ${ur.expiresAt.toLocaleDateString()}]`)
        : "";
      const system = ur.role.isSystem ? chalk.blue(" [SYSTEM]") : "";
      console.log(
        `  ${chalk.green("✓")} ${chalk.white(ur.role.displayName)} ${chalk.gray(
          `(${ur.role.name})`,
        )}${expiration}${system}`,
      );
    });
  }
  console.log("");
}

/**
 * Fetch all available roles
 */
async function fetchAvailableRoles(): Promise<RoleInfo[]> {
  const roles = await prisma.role.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      displayName: "asc",
    },
  });

  return roles;
}

/**
 * Check for role conflicts
 */
function checkRoleConflicts(
  currentRoles: string[],
  newRoles: string[],
): Map<string, ConflictInfo[]> {
  const conflicts = new Map<string, ConflictInfo[]>();

  for (const newRole of newRoles) {
    const roleConflicts: ConflictInfo[] = [];

    for (const existingRole of currentRoles) {
      if (rolesConflict(existingRole, newRole)) {
        const reason =
          CONFLICT_REASONS[`${existingRole}:${newRole}`] ||
          CONFLICT_REASONS[`${newRole}:${existingRole}`] ||
          "Roles conflict due to separation of duties";

        const conflictConfig =
          CONFLICT_CONFIG[`${existingRole}:${newRole}`] ||
          CONFLICT_CONFIG[`${newRole}:${existingRole}`];
        const severity = conflictConfig?.severity || "error";

        roleConflicts.push({
          conflictingRole: existingRole,
          reason,
          severity,
        });
      }
    }

    if (roleConflicts.length > 0) {
      conflicts.set(newRole, roleConflicts);
    }
  }

  // Check conflicts between new roles themselves
  for (let i = 0; i < newRoles.length; i++) {
    for (let j = i + 1; j < newRoles.length; j++) {
      const roleA = newRoles[i];
      const roleB = newRoles[j];
      if (rolesConflict(roleA, roleB)) {
        const reason =
          CONFLICT_REASONS[`${roleA}:${roleB}`] ||
          CONFLICT_REASONS[`${roleB}:${roleA}`] ||
          "Roles conflict due to separation of duties";

        const conflictConfig =
          CONFLICT_CONFIG[`${roleA}:${roleB}`] ||
          CONFLICT_CONFIG[`${roleB}:${roleA}`];
        const severity = conflictConfig?.severity || "error";

        // Add to roleA's conflicts
        if (!conflicts.has(roleA)) {
          conflicts.set(roleA, []);
        }
        conflicts.get(roleA)!.push({
          conflictingRole: roleB,
          reason,
          severity,
        });

        // Add to roleB's conflicts
        if (!conflicts.has(roleB)) {
          conflicts.set(roleB, []);
        }
        conflicts.get(roleB)!.push({
          conflictingRole: roleA,
          reason,
          severity,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Display role conflicts with severity indicators
 */
function displayConflicts(conflicts: Map<string, ConflictInfo[]>): void {
  console.log(chalk.red.bold("\n⚠️  ROLE CONFLICTS DETECTED\n"));

  for (const [roleName, conflictList] of conflicts.entries()) {
    console.log(chalk.white(`Role: ${roleName}`));

    for (const conflict of conflictList) {
      const severityColor =
        conflict.severity === "critical"
          ? chalk.red
          : conflict.severity === "error"
            ? chalk.yellow
            : chalk.blue;

      const severityLabel = severityColor(
        `[${conflict.severity.toUpperCase()}]`,
      );

      console.log(
        `  ${severityLabel} Conflicts with: ${chalk.white(
          conflict.conflictingRole,
        )}`,
      );
      console.log(chalk.gray(`    Reason: ${conflict.reason}`));
    }
    console.log("");
  }
}

/**
 * Determine if conflicts should block assignment
 */
function shouldBlockAssignment(
  conflicts: Map<string, ConflictInfo[]>,
): boolean {
  for (const conflictList of conflicts.values()) {
    for (const conflict of conflictList) {
      if (conflict.severity === "critical" || conflict.severity === "error") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Add roles workflow
 */
async function addRoles(user: UserWithRoles): Promise<boolean> {
  try {
    // Fetch available roles
    const allRoles = await fetchAvailableRoles();
    const currentRoleIds = new Set(user.roles.map((ur) => ur.roleId));
    const currentRoleNames = user.roles.map((ur) => ur.role.name);

    // Filter out already assigned roles
    const availableRoles = allRoles.filter((r) => !currentRoleIds.has(r.id));

    if (availableRoles.length === 0) {
      console.log(
        chalk.yellow("\n⚠️  No additional roles available to assign"),
      );
      return false;
    }

    // Multi-select roles to add with modern checkbox API
    const selectedRoleIds = await checkbox({
      message: "Select roles to add:",
      choices: availableRoles.map((r) => ({
        name: `${r.displayName} (${r.name})${r.isSystem ? chalk.blue(" [SYSTEM]") : ""}${
          r.description ? chalk.gray(` - ${r.description}`) : ""
        }`,
        value: r.id,
      })),
    });

    if (selectedRoleIds.length === 0) {
      console.log(chalk.yellow("\nNo roles selected"));
      return false;
    }

    const selectedRoles = allRoles.filter((r) =>
      selectedRoleIds.includes(r.id),
    );
    const selectedRoleNames = selectedRoles.map((r) => r.name);

    // Check for conflicts
    const conflicts = checkRoleConflicts(currentRoleNames, selectedRoleNames);

    if (conflicts.size > 0) {
      displayConflicts(conflicts);

      if (shouldBlockAssignment(conflicts)) {
        console.log(
          chalk.red.bold(
            "✗ Assignment blocked due to critical or error-level conflicts",
          ),
        );
        return false;
      }

      // Warning-level conflicts - ask for confirmation
      const confirmOverride = await confirm({
        message: "Warning-level conflicts detected. Continue anyway?",
        default: false,
      });

      if (!confirmOverride) {
        console.log(chalk.yellow("\nAssignment cancelled by user"));
        return false;
      }
    }

    // Confirm changes
    const confirmChanges = await confirm({
      message: isDryRun
        ? "Dry-run mode: Would apply these changes?"
        : "Apply these changes?",
      default: false,
    });

    if (!confirmChanges) {
      console.log(chalk.yellow("\nChanges cancelled"));
      return false;
    }

    if (isDryRun) {
      console.log(chalk.blue("\n✓ Dry-run complete (no changes applied)"));
      return false;
    }

    // Apply changes in transaction
    console.log(chalk.gray("\n⏳ Processing role assignments...\n"));
    await prisma.$transaction(async (tx) => {
      for (const role of selectedRoles) {
        // Check for existing assignment (skip duplicates)
        const existing = await tx.userRole.findUnique({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id,
            },
          },
        });

        if (existing) {
          console.log(
            chalk.yellow(`  ⊘ Skipped ${role.name} (already assigned)`),
          );
          continue;
        }

        // Create assignment
        await tx.userRole.create({
          data: {
            id: cuid(),
            userId: user.id,
            roleId: role.id,
            createdBy: "cli-script",
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            id: cuid(),
            entityId: user.id,
            entityType: "User",
            action: "ROLE_ASSIGNED",
            userId: null, // CLI script, not a user action
            metadata: {
              source: "cli-script",
              roleId: role.id,
              roleName: role.name,
              conflicts: conflicts.has(role.name)
                ? JSON.parse(JSON.stringify(conflicts.get(role.name)))
                : null,
            },
          },
        });

        console.log(chalk.green(`  ✓ Added ${role.name}`));
      }
    });

    // TODO: Invalidate permission cache
    // await invalidatePermissionCache("user", user.id);
    console.log(
      chalk.gray(
        "\n  Note: Permission cache invalidation requires Redis setup",
      ),
    );

    console.log(chalk.green.bold("\n✓ Roles assigned successfully"));
    return true;
  } catch (error) {
    console.error(chalk.red("\n✗ Error adding roles:"), error);
    return false;
  }
}

/**
 * Remove roles workflow
 */
async function removeRoles(user: UserWithRoles): Promise<boolean> {
  try {
    if (user.roles.length === 0) {
      console.log(chalk.yellow("\n⚠️  User has no roles to remove"));
      return false;
    }

    // Multi-select roles to remove with modern checkbox API
    const selectedRoleIds = await checkbox({
      message: "Select roles to remove:",
      choices: user.roles.map((ur) => ({
        name: `${ur.role.displayName} (${ur.role.name})${
          ur.role.isSystem ? chalk.blue(" [SYSTEM]") : ""
        }${
          ur.expiresAt
            ? chalk.yellow(` [expires: ${ur.expiresAt.toLocaleDateString()}]`)
            : ""
        }`,
        value: ur.roleId,
      })),
    });

    if (selectedRoleIds.length === 0) {
      console.log(chalk.yellow("\nNo roles selected"));
      return false;
    }

    const selectedRoles = user.roles
      .filter((ur) => selectedRoleIds.includes(ur.roleId))
      .map((ur) => ur.role);

    // Confirm changes
    const confirmChanges = await confirm({
      message: isDryRun
        ? "Dry-run mode: Would remove these roles?"
        : "Remove these roles?",
      default: false,
    });

    if (!confirmChanges) {
      console.log(chalk.yellow("\nChanges cancelled"));
      return false;
    }

    if (isDryRun) {
      console.log(chalk.blue("\n✓ Dry-run complete (no changes applied)"));
      return false;
    }

    // Apply changes in transaction
    console.log(chalk.gray("\n⏳ Processing role removals...\n"));
    await prisma.$transaction(async (tx) => {
      for (const role of selectedRoles) {
        // Delete assignment
        await tx.userRole.delete({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: role.id,
            },
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            id: cuid(),
            entityId: user.id,
            entityType: "User",
            action: "ROLE_REVOKED",
            userId: null, // CLI script, not a user action
            metadata: {
              source: "cli-script",
              roleId: role.id,
              roleName: role.name,
            },
          },
        });

        console.log(chalk.green(`  ✓ Removed ${role.name}`));
      }
    });

    // TODO: Invalidate permission cache
    // await invalidatePermissionCache("user", user.id);
    console.log(
      chalk.gray(
        "\n  Note: Permission cache invalidation requires Redis setup",
      ),
    );

    console.log(chalk.green.bold("\n✓ Roles removed successfully"));
    return true;
  } catch (error) {
    console.error(chalk.red("\n✗ Error removing roles:"), error);
    return false;
  }
}

/**
 * Main action menu
 */
async function showActionMenu(user: UserWithRoles): Promise<string> {
  displayUserSummary(user);

  const action = await select({
    message: "What would you like to do?",
    choices: [
      { name: "Add roles", value: "add" },
      { name: "Remove roles", value: "remove" },
      { name: "───────────────", value: "separator", disabled: true },
      { name: "Switch user", value: "switch" },
      { name: "Exit", value: "exit" },
    ],
  });

  return action;
}

/**
 * Main program loop
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
    await validateEnvironment();

    // Main loop
    while (true) {
      // Select user if not already selected
      if (!currentUser) {
        currentUser = await selectUser();
        if (!currentUser) {
          const retry = await confirm({
            message: "Try selecting another user?",
            default: true,
          });
          if (!retry) break;
          continue;
        }
      }

      // Show action menu
      const action = await showActionMenu(currentUser);

      switch (action) {
        case "add":
          await addRoles(currentUser);
          // Refresh user data after changes
          currentUser = (await prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
              roles: {
                include: { role: true },
                where: { role: { isActive: true } },
                orderBy: { createdAt: "desc" },
              },
            },
          })) as UserWithRoles | null;
          break;

        case "remove":
          await removeRoles(currentUser);
          // Refresh user data after changes
          currentUser = (await prisma.user.findUnique({
            where: { id: currentUser.id },
            include: {
              roles: {
                include: { role: true },
                where: { role: { isActive: true } },
                orderBy: { createdAt: "desc" },
              },
            },
          })) as UserWithRoles | null;
          break;

        case "switch":
          currentUser = null;
          break;

        case "exit":
          console.log(chalk.cyan("\nGoodbye! 👋\n"));
          return;
      }
    }
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

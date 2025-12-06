#!/usr/bin/env tsx

import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { prisma, pool } from "../../src/infrastructure/database/prisma/client";

/**
 * Disable 2FA for a specific user by email.
 *
 * Usage:
 *   dotenv -e .env.local -- tsx scripts/users/disable-2fa-for-user.ts user@example.com
 *   dotenv -e .env.local -- tsx scripts/users/disable-2fa-for-user.ts user@example.com --yes
 */

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((arg) => !arg.startsWith("-"));
  const skipConfirm = args.includes("--yes") || args.includes("-y");

  if (!emailArg) {
    console.error(
      chalk.red(
        "✗ Missing user email.\nUsage: dotenv -e .env.local -- tsx scripts/users/disable-2fa-for-user.ts <user-email>",
      ),
    );
    process.exitCode = 1;
    return;
  }

  const normalizedEmail = emailArg.trim().toLowerCase();

  if (!process.env.DATABASE_URL) {
    console.error(chalk.red("✗ DATABASE_URL is not set in the environment."));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.cyan("\n🔐  2FA Admin Override\n"));

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        tokenVersion: true,
      },
    });

    if (!user) {
      console.error(
        chalk.red(`✗ No user found with email "${normalizedEmail}".`),
      );
      process.exitCode = 1;
      return;
    }

    console.log(
      chalk.gray(
        `User: ${chalk.white(user.email)}${user.name ? ` (${user.name})` : ""}`,
      ),
    );
    console.log(
      chalk.gray(
        `Current status: ${
          user.twoFactorEnabled
            ? chalk.yellow("Enabled")
            : chalk.green("Disabled")
        }\n`,
      ),
    );

    if (!user.twoFactorEnabled && !user.twoFactorSecret) {
      console.log(
        chalk.yellow(
          "⚠️  2FA already disabled for this user. No changes applied.",
        ),
      );
      return;
    }

    if (!skipConfirm) {
      const confirmed = await confirm({
        message: `Disable 2FA and invalidate sessions for ${user.email}?`,
        default: false,
      });

      if (!confirmed) {
        console.log(chalk.gray("Operation cancelled."));
        return;
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.twoFactor.deleteMany({
        where: { userId: user.id },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          tokenVersion: { increment: 1 },
        },
      });
    });

    console.log(
      chalk.green(
        `\n✓ 2FA disabled for ${user.email}. Sessions invalidated (tokenVersion incremented).\n`,
      ),
    );
  } catch (error) {
    console.error(chalk.red("✗ Failed to disable 2FA:"), error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => {});
  }
}

void main();

/**
 * Attachments Seed Data
 *
 * Seeds attachment types for the polymorphic attachment system.
 * Supports compliance documentation, audit trails, and file management.
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { ATTACHMENT_TYPES } from "./seed-config.js";

/**
 * Seed attachment types
 */
export async function seedAttachments(prisma: PrismaClient) {
  console.log("📎 Seeding attachment types...");

  // Seed attachment types
  console.log("   Creating attachment types...");
  for (const attachmentType of ATTACHMENT_TYPES) {
    await prisma.attachmentType.upsert({
      where: { code: attachmentType.code },
      update: {
        name: attachmentType.name,
        description: attachmentType.description,
        allowedExtensions: attachmentType.allowedExtensions,
        maxFileSizeMB: attachmentType.maxFileSizeMB,
        isActive: attachmentType.isActive,
      },
      create: {
        name: attachmentType.name,
        code: attachmentType.code,
        description: attachmentType.description,
        allowedExtensions: attachmentType.allowedExtensions,
        maxFileSizeMB: attachmentType.maxFileSizeMB,
        isActive: attachmentType.isActive,
      },
    });
  }

  console.log(`   ✓ Created ${ATTACHMENT_TYPES.length} attachment types`);
}

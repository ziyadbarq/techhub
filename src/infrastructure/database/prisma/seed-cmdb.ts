/**
 * CMDB Seed Data
 * Seeds relationship types, relationship type scopes, and contract types
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import {
  CI_CLASS_DATA,
  CONTRACT_TYPE_DATA,
  RELATIONSHIP_TYPE_SCOPE_DATA,
} from "./seed-config-layer3.js";

/**
 * Common CMDB relationship types
 */
const RELATIONSHIP_TYPES = [
  {
    name: "Depends On",
    code: "DEPENDS_ON",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates that one CI requires another CI to function. Used for dependency tracking and impact analysis.",
  },
  {
    name: "Runs On",
    code: "RUNS_ON",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates that a software CI runs on a platform or infrastructure CI (e.g., Application runs on Server).",
  },
  {
    name: "Hosted By",
    code: "HOSTED_BY",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates hosting relationship (e.g., Virtual Machine hosted by Hypervisor).",
  },
  {
    name: "Connected To",
    code: "CONNECTED_TO",
    direction: "BIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates a bidirectional connection between CIs (e.g., network connectivity between switches).",
  },
  {
    name: "Uses",
    code: "USES",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: false,
    description:
      "Indicates that one CI uses another as a service or resource (non-critical dependency).",
  },
  {
    name: "Routes To",
    code: "ROUTES_TO",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates network routing relationship (e.g., Load Balancer routes to Web Server).",
  },
  {
    name: "Synchronized With",
    code: "SYNCHRONIZED_WITH",
    direction: "BIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates bidirectional data synchronization between CIs (e.g., database replication).",
  },
  {
    name: "Clustered With",
    code: "CLUSTERED_WITH",
    direction: "BIDIRECTIONAL" as const,
    isImpacting: true,
    description:
      "Indicates that CIs form a cluster for high availability or load balancing.",
  },
  {
    name: "Backs Up",
    code: "BACKS_UP",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: false,
    description:
      "Indicates backup relationship (e.g., Backup Server backs up Database).",
  },
  {
    name: "Monitors",
    code: "MONITORS",
    direction: "UNIDIRECTIONAL" as const,
    isImpacting: false,
    description:
      "Indicates monitoring relationship (e.g., Monitoring System monitors Application).",
  },
];

/**
 * Seed CMDB data
 */
export async function seedCMDB(prisma: PrismaClient) {
  console.log("🗄️  Seeding CMDB data...");

  // Seed CI classes first (needed for relationship type scopes)
  console.log("   Creating CI classes...");
  for (const className of CI_CLASS_DATA) {
    await prisma.cIClass.upsert({
      where: { name: className },
      update: {},
      create: {
        name: className,
        code: className.toUpperCase().replace(/\s+/g, "_"),
        isDiscoverable: false,
      },
    });
  }
  console.log(`   ✓ Created ${CI_CLASS_DATA.length} CI classes`);

  // Seed relationship types
  console.log("   Creating relationship types...");
  for (const relType of RELATIONSHIP_TYPES) {
    await prisma.relationshipType.upsert({
      where: { code: relType.code },
      update: {
        name: relType.name,
        direction: relType.direction,
        isImpacting: relType.isImpacting,
        description: relType.description,
      },
      create: {
        name: relType.name,
        code: relType.code,
        direction: relType.direction,
        isImpacting: relType.isImpacting,
        description: relType.description,
      },
    });
  }

  console.log(`   ✓ Created ${RELATIONSHIP_TYPES.length} relationship types`);

  // Seed relationship type scopes (CI class constraints)
  console.log("   Creating relationship type scopes...");
  let scopesCreated = 0;
  for (const scope of RELATIONSHIP_TYPE_SCOPE_DATA) {
    // Look up the relationship type and CI classes by code
    const [relType, fromClass, toClass] = await Promise.all([
      prisma.relationshipType.findUnique({
        where: { code: scope.relationshipCode },
      }),
      prisma.cIClass.findUnique({ where: { code: scope.fromClassCode } }),
      prisma.cIClass.findUnique({ where: { code: scope.toClassCode } }),
    ]);

    if (!relType || !fromClass || !toClass) {
      // Skip if any entity doesn't exist yet
      continue;
    }

    await prisma.relationshipTypeScope.upsert({
      where: {
        relationshipTypeId_fromCiClassId_toCiClassId: {
          relationshipTypeId: relType.id,
          fromCiClassId: fromClass.id,
          toCiClassId: toClass.id,
        },
      },
      update: {},
      create: {
        relationshipTypeId: relType.id,
        fromCiClassId: fromClass.id,
        toCiClassId: toClass.id,
      },
    });
    scopesCreated++;
  }
  console.log(`   ✓ Created ${scopesCreated} relationship type scopes`);

  // Seed contract types
  console.log("   Creating contract types...");
  for (const contractType of CONTRACT_TYPE_DATA) {
    await prisma.contractType.upsert({
      where: { code: contractType.code },
      update: {
        name: contractType.name,
        description: contractType.description,
      },
      create: {
        name: contractType.name,
        code: contractType.code,
        description: contractType.description,
        isActive: true,
      },
    });
  }
  console.log(`   ✓ Created ${CONTRACT_TYPE_DATA.length} contract types`);
}

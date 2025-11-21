/**
 * CMDB Seed Data
 * Seeds relationship types and optional sample CIs
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";

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
}

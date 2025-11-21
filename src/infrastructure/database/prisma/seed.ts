/**
 * Database Seed File
 *
 * Seeds the database with:
 * 1. RBAC (roles, permissions, role-permission assignments)
 * 2. Foundation (lifecycle, vendors, org units, locations, persons, fields)
 * 3. AI prompt templates (from seed-prompts.ts)
 * 4. Example tasks (for demonstration)
 */

import { PrismaClient, TaskStatus } from "../../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { seedPrompts } from "./seed-prompts";
import { seedRBAC } from "./seed-rbac";
import { seedFoundation } from "./seed-foundation";

// Prisma v7: Use PostgreSQL adapter
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Seed RBAC (roles, permissions, assignments)
  console.log("🔐 Seeding RBAC system...");
  await seedRBAC();

  // 2. Seed Foundation (lifecycle, vendors, org units, locations, persons, fields)
  await seedFoundation(prisma);

  // 3. Seed AI prompt templates
  console.log("🤖 Seeding AI prompt templates...");
  await seedPrompts(prisma);

  // 4. Seed example tasks
  console.log("📝 Seeding example tasks...");

  // Delete existing tasks
  await prisma.task.deleteMany({});

  const exampleTasks = [
    {
      title: "Welcome to Barq Assets!",
      description:
        "This is an example task demonstrating the Clean Architecture pattern. " +
        "Explore the Task entity, repository, and use cases to understand how the architecture works.",
      status: TaskStatus.COMPLETED,
    },
    {
      title: "Set up your development environment",
      description:
        "1. Configure your DATABASE_URL in .env.local\n" +
        "2. Add your OPENAI_API_KEY\n" +
        "3. Run npm run db:push\n" +
        "4. Run npm run dev",
      status: TaskStatus.COMPLETED,
    },
    {
      title: "Explore the Task CRUD example",
      description:
        "Check out src/core/domain/entities/task.entity.ts to see how domain entities work. " +
        "Then look at the use cases, repository, and how they all tie together with DI.",
      status: TaskStatus.IN_PROGRESS,
    },
    {
      title: "Build your first feature",
      description:
        "Use the Task CRUD as a template to create your own features. " +
        "Follow the same pattern: Entity → Repository → Use Cases → Controller → UI.",
      status: TaskStatus.PENDING,
    },
    {
      title: "Customize the theme",
      description:
        "Update the barq brand colors in src/lib/theme/constants.ts to match your brand. " +
        "The theme system uses OKLCH color space for perceptually uniform colors.",
      status: TaskStatus.PENDING,
    },
  ];

  // Create tasks
  await prisma.task.createMany({
    data: exampleTasks,
  });

  console.log(`   ✓ Created ${exampleTasks.length} example tasks`);

  console.log("✅ Database seed completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

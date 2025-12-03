/**
 * Fix Network Asset Tags to Uppercase
 *
 * Ensures all assetTags starting with NET- are stored uppercase so lookups
 * (findByAssetTag) work correctly.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-network-asset-tags.ts
 *   npx dotenv -e .env.local -- npx tsx scripts/fix-network-asset-tags.ts --dry-run
 */

import { prisma } from "../../src/infrastructure/database/prisma/client.js";

const DRY_RUN = process.argv.includes("--dry-run");

async function fixTags() {
  const assets = await prisma.asset.findMany({
    where: { assetTag: { startsWith: "NET-" } },
    select: { id: true, assetTag: true },
  });

  // Include any mixed/lowercase tags by fetching all network assets as fallback
  const networkCategory = await prisma.assetCategory.findFirst({
    where: { code: "NETWORK" },
    select: { id: true },
  });

  const allNetworkAssets =
    networkCategory &&
    (await prisma.asset.findMany({
      where: { assetCategoryId: networkCategory.id },
      select: { id: true, assetTag: true },
    }));

  const candidates = allNetworkAssets || assets;

  let updated = 0;

  for (const asset of candidates) {
    const upper = asset.assetTag.toUpperCase();
    if (asset.assetTag === upper) continue;

    if (!DRY_RUN) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { assetTag: upper },
      });
    }
    updated++;
  }

  console.log(`Processed ${candidates.length} assets. Updated: ${updated}`);
  if (DRY_RUN) {
    console.log("⚠️  DRY RUN - no changes were made");
  }
}

fixTags()
  .then(() => {
    console.log("✅ Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

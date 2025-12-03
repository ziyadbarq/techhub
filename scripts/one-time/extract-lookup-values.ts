/**
 * Extract all lookup/reference table values
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/extract-lookup-values.ts
 */

import { prisma } from "../../src/infrastructure/database/prisma/client.js";

async function extractLookupValues() {
  console.log("\n" + "=".repeat(80));
  console.log("LOOKUP/REFERENCE TABLE VALUES");
  console.log("=".repeat(80));

  // LifecycleModel
  const lifecycleModels = await prisma.lifecycleModel.findMany({
    select: { name: true, description: true },
  });
  console.log("\n📋 LifecycleModel (" + lifecycleModels.length + ")");
  lifecycleModels.forEach((m) => console.log("   - " + m.name));

  // LifecycleState
  const lifecycleStates = await prisma.lifecycleState.findMany({
    select: {
      name: true,
      stateType: true,
      lifecycleModel: { select: { name: true } },
    },
    orderBy: [{ lifecycleModelId: "asc" }, { sortOrder: "asc" }],
  });
  console.log("\n🔄 LifecycleState (" + lifecycleStates.length + ")");
  let currentModel = "";
  lifecycleStates.forEach((s) => {
    if (s.lifecycleModel.name !== currentModel) {
      currentModel = s.lifecycleModel.name;
      console.log("   [" + currentModel + "]");
    }
    console.log("      - " + s.name + " (" + s.stateType + ")");
  });

  // FieldDefinition (has soft delete)
  const fieldDefs = await prisma.fieldDefinition.findMany({
    select: { name: true, dataType: true, isRequired: true },
    where: { deletedAt: null },
  });
  console.log("\n📝 FieldDefinition (" + fieldDefs.length + ")");
  fieldDefs.forEach((f) =>
    console.log(
      "   - " +
        f.name +
        " (" +
        f.dataType +
        ")" +
        (f.isRequired ? " *required" : ""),
    ),
  );

  // AssetCategory
  const categories = await prisma.assetCategory.findMany({
    select: { name: true, code: true },
  });
  console.log("\n📦 AssetCategory (" + categories.length + ")");
  categories.forEach((c) =>
    console.log("   - " + c.name + " [" + c.code + "]"),
  );

  // CIClass
  const ciClasses = await prisma.cIClass.findMany({
    select: { name: true, code: true },
  });
  console.log("\n🖥️  CIClass (" + ciClasses.length + ")");
  ciClasses.forEach((c) => console.log("   - " + c.name + " [" + c.code + "]"));

  // RelationshipType
  const relTypes = await prisma.relationshipType.findMany({
    select: { name: true, direction: true },
  });
  console.log("\n🔗 RelationshipType (" + relTypes.length + ")");
  relTypes.forEach((r) =>
    console.log("   - " + r.name + " (" + r.direction + ")"),
  );

  // ContractType
  const contractTypes = await prisma.contractType.findMany({
    select: { name: true, code: true },
  });
  console.log("\n📄 ContractType (" + contractTypes.length + ")");
  if (contractTypes.length === 0) {
    console.log("   (not seeded)");
  } else {
    contractTypes.forEach((c) =>
      console.log("   - " + c.name + " [" + c.code + "]"),
    );
  }

  // AttachmentType
  const attachTypes = await prisma.attachmentType.findMany({
    select: { name: true, code: true, allowedExtensions: true },
  });
  console.log("\n📎 AttachmentType (" + attachTypes.length + ")");
  attachTypes.forEach((a) =>
    console.log(
      "   - " +
        a.name +
        " [" +
        a.code +
        "] (" +
        (a.allowedExtensions || []).join(", ") +
        ")",
    ),
  );

  // DataDomain
  const dataDomains = await prisma.dataDomain.findMany({
    select: { name: true, code: true },
  });
  console.log("\n🏷️  DataDomain (" + dataDomains.length + ")");
  dataDomains.forEach((d) =>
    console.log("   - " + d.name + " [" + d.code + "]"),
  );

  // BusinessProcess
  const processes = await prisma.businessProcess.findMany({
    select: { name: true, code: true },
  });
  console.log("\n⚙️  BusinessProcess (" + processes.length + ")");
  processes.forEach((p) => console.log("   - " + p.name + " [" + p.code + "]"));

  // FeatureFlag
  const flags = await prisma.featureFlag.findMany({
    select: { name: true, displayName: true, category: true, isEnabled: true },
  });
  console.log("\n🚩 FeatureFlag (" + flags.length + ")");
  flags.forEach((f) =>
    console.log(
      "   - " +
        f.name +
        " (" +
        f.category +
        ") = " +
        (f.isEnabled ? "ENABLED" : "DISABLED"),
    ),
  );

  // LicenseAddon
  const addons = await prisma.licenseAddon.findMany({
    select: { name: true, code: true, isActive: true },
  });
  console.log("\n🔌 LicenseAddon (" + addons.length + ")");
  if (addons.length === 0) {
    console.log("   (not seeded)");
  } else {
    addons.forEach((a) =>
      console.log(
        "   - " +
          a.name +
          " [" +
          a.code +
          "]" +
          (a.isActive ? "" : " (inactive)"),
      ),
    );
  }

  // RelationshipTypeScope
  const scopes = await prisma.relationshipTypeScope.findMany({
    select: {
      relationshipType: { select: { name: true } },
      fromCiClass: { select: { name: true } },
      toCiClass: { select: { name: true } },
    },
  });
  console.log("\n🎯 RelationshipTypeScope (" + scopes.length + ")");
  if (scopes.length === 0) {
    console.log("   (not seeded)");
  } else {
    scopes.forEach((s) =>
      console.log(
        "   - " +
          s.relationshipType.name +
          ": " +
          s.fromCiClass.name +
          " → " +
          s.toCiClass.name,
      ),
    );
  }

  console.log("\n" + "=".repeat(80));
  await prisma.$disconnect();
}

extractLookupValues().catch(console.error);

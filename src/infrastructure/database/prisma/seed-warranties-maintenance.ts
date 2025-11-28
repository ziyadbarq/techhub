/**
 * Warranties and Maintenance Seed Data
 *
 * Seeds comprehensive realistic data for:
 * - Warranties (various types, active/expired/expiring)
 * - Maintenance Schedules (recurring preventive maintenance)
 * - Maintenance Records (completed, scheduled, in-progress)
 */

import type { PrismaClient } from "../../../generated/prisma/client.js";
import { WarrantyCoverageType } from "@/generated/prisma/enums";
import { MaintenanceStatus } from "@/core/domain/value-objects/maintenance-status";
import {
  logSection,
  logStep,
  logSuccess,
  requireEntities,
  pickRandom,
  randomInt,
  getRelativeDate,
} from "./seed-utils.js";
import {
  WarrantyFactory,
  MaintenanceScheduleFactory,
  MaintenanceRecordFactory,
} from "./seed-factories/index.js";

export async function seedWarrantiesMaintenance(prisma: PrismaClient) {
  logSection("Warranties & Maintenance");

  // ==============================================
  // Prerequisites
  // ==============================================
  const assets = await prisma.asset.findMany({
    include: {
      assetModel: { include: { vendor: true } },
      assetCategory: true,
    },
  });

  const persons = await prisma.person.findMany({});

  requireEntities(assets, "assets");
  requireEntities(persons, "persons");

  // Group assets by category
  const laptops = assets.filter((a) => a.assetCategory.code === "LAPTOP");
  const desktops = assets.filter((a) => a.assetCategory.code === "DESKTOP");
  const monitors = assets.filter((a) => a.assetCategory.code === "MONITOR");
  const servers = assets.filter((a) => a.assetCategory.code === "SERVER");
  const network = assets.filter((a) => a.assetCategory.code === "NETWORK");
  const printers = assets.filter((a) => a.assetCategory.code === "PRINTER");
  const phones = assets.filter((a) => a.assetCategory.code === "PHONE");
  const tablets = assets.filter((a) => a.assetCategory.code === "TABLET");

  // ==============================================
  // 1. WARRANTIES (idempotent - check before create)
  // ==============================================
  logStep("🛡️", "Creating warranties...");

  // Load existing warranties to support append mode
  const existingWarranties = await prisma.warranty.findMany({
    select: { assetId: true },
  });
  const existingWarrantyAssetIds = new Set(
    existingWarranties.map((w) => w.assetId),
  );

  let warrantyCount = 0;

  // Laptops - Standard 3-year warranty
  for (let i = 0; i < Math.min(laptops.length, 10); i++) {
    const laptop = laptops[i];
    if (!laptop.purchaseDate || existingWarrantyAssetIds.has(laptop.id))
      continue;

    const warrantyMonths = i < 7 ? 36 : 12; // Vary: 3 years for most, 1 year for some
    const provider = laptop.assetModel?.vendor?.name || "Manufacturer";

    await WarrantyFactory.fromAsset(
      laptop,
      warrantyMonths,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Desktops - Standard 3-year warranty
  for (let i = 0; i < desktops.length; i++) {
    const desktop = desktops[i];
    if (!desktop.purchaseDate || existingWarrantyAssetIds.has(desktop.id))
      continue;

    const provider = desktop.assetModel?.vendor?.name || "Manufacturer";
    await WarrantyFactory.fromAsset(
      desktop,
      36,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Monitors - Standard 3-year warranty
  for (let i = 0; i < Math.min(monitors.length, 5); i++) {
    const monitor = monitors[i];
    if (!monitor.purchaseDate || existingWarrantyAssetIds.has(monitor.id))
      continue;

    const provider = monitor.assetModel?.vendor?.name || "Manufacturer";
    await WarrantyFactory.fromAsset(
      monitor,
      36,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Servers - Extended warranty with premium support (5 years)
  for (let i = 0; i < servers.length; i++) {
    const server = servers[i];
    if (!server.purchaseDate || existingWarrantyAssetIds.has(server.id))
      continue;

    const provider =
      (server.assetModel?.vendor?.name || "Vendor") + " ProSupport";
    await WarrantyFactory.fromAsset(
      server,
      60,
      provider,
      WarrantyCoverageType.EXTENDED,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Network equipment - Support contract (3 years)
  for (let i = 0; i < network.length; i++) {
    const device = network[i];
    if (!device.purchaseDate || existingWarrantyAssetIds.has(device.id))
      continue;

    await WarrantyFactory.fromAsset(
      device,
      36,
      "Cisco SmartNet",
      WarrantyCoverageType.ONSITE,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Printers - Standard 1-year warranty
  for (let i = 0; i < printers.length; i++) {
    const printer = printers[i];
    if (!printer.purchaseDate || existingWarrantyAssetIds.has(printer.id))
      continue;

    const provider = printer.assetModel?.vendor?.name || "Manufacturer";
    await WarrantyFactory.fromAsset(
      printer,
      12,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Phones - 2-year warranty
  for (let i = 0; i < Math.min(phones.length, 5); i++) {
    const phone = phones[i];
    if (!phone.purchaseDate || existingWarrantyAssetIds.has(phone.id)) continue;

    const provider =
      phone.assetModel?.vendor?.name === "Apple Inc."
        ? "AppleCare+"
        : "Manufacturer";
    await WarrantyFactory.fromAsset(
      phone,
      24,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  // Tablets - 2-year warranty
  for (let i = 0; i < Math.min(tablets.length, 3); i++) {
    const tablet = tablets[i];
    if (!tablet.purchaseDate || existingWarrantyAssetIds.has(tablet.id))
      continue;

    const provider =
      tablet.assetModel?.vendor?.name === "Apple Inc."
        ? "AppleCare+"
        : "Manufacturer";
    await WarrantyFactory.fromAsset(
      tablet,
      24,
      provider,
      WarrantyCoverageType.STANDARD,
      i + 1,
    ).create(prisma);
    warrantyCount++;
  }

  logSuccess(`Processed ${warrantyCount} warranties`);

  // ==============================================
  // 2. MAINTENANCE SCHEDULES (idempotent - check before create)
  // ==============================================
  logStep("🔧", "Creating maintenance schedules...");

  // Load existing schedules to support append mode
  const existingSchedules = await prisma.maintenanceSchedule.findMany({
    select: { assetId: true },
  });
  const existingScheduleAssetIds = new Set(
    existingSchedules.map((s) => s.assetId),
  );

  let scheduleCount = 0;

  // Monthly server maintenance
  for (const server of servers) {
    if (existingScheduleAssetIds.has(server.id)) continue;
    const person = pickRandom(persons);
    await MaintenanceScheduleFactory.createRecurring(
      server.id,
      server.assetTag,
      "PREVENTIVE",
      "MONTHLY",
      120,
      person.id,
    ).create(prisma);
    scheduleCount++;
  }

  // Quarterly network equipment inspection
  for (const device of network) {
    if (existingScheduleAssetIds.has(device.id)) continue;
    const person = pickRandom(persons);
    await MaintenanceScheduleFactory.createRecurring(
      device.id,
      device.assetTag,
      "INSPECTION",
      "QUARTERLY",
      60,
      person.id,
    ).create(prisma);
    scheduleCount++;
  }

  // Bi-annual printer maintenance
  for (const printer of printers) {
    if (existingScheduleAssetIds.has(printer.id)) continue;
    const person = pickRandom(persons);
    await MaintenanceScheduleFactory.createRecurring(
      printer.id,
      printer.assetTag,
      "CLEANING",
      "CUSTOM",
      90,
      person.id,
    ).create(prisma);
    scheduleCount++;
  }

  // Annual laptop refresh/upgrade (first 3 laptops)
  for (let i = 0; i < Math.min(laptops.length, 3); i++) {
    const laptop = laptops[i];
    if (existingScheduleAssetIds.has(laptop.id)) continue;
    const person = pickRandom(persons);
    await MaintenanceScheduleFactory.createRecurring(
      laptop.id,
      laptop.assetTag,
      "UPGRADE",
      "ANNUALLY",
      180,
      person.id,
    ).create(prisma);
    scheduleCount++;
  }

  logSuccess(`Processed ${scheduleCount} maintenance schedules`);

  // ==============================================
  // 3. MAINTENANCE RECORDS (idempotent - check before create)
  // ==============================================
  logStep("📋", "Creating maintenance records...");

  // Load existing records to support append mode
  const existingRecords = await prisma.maintenanceRecord.findMany({
    select: { assetId: true },
  });
  const existingRecordAssetIds = new Set(existingRecords.map((r) => r.assetId));

  let recordCount = 0;

  // Completed maintenance records (historical)
  for (let i = 0; i < Math.min(servers.length, 5); i++) {
    if (existingRecordAssetIds.has(servers[i].id)) continue;
    const server = servers[i];
    const person = pickRandom(persons);
    const daysAgo = 30 + i * 30; // 30, 60, 90, 120, 150 days ago

    await MaintenanceRecordFactory.createCompleted(
      server.id,
      server.assetTag,
      "PREVENTIVE",
      person.id,
      daysAgo,
    ).create(prisma);
    recordCount++;
  }

  // Completed printer maintenance
  for (let i = 0; i < Math.min(printers.length, 2); i++) {
    const printer = printers[i];
    if (existingRecordAssetIds.has(printer.id)) continue;
    const person = pickRandom(persons);

    await MaintenanceRecordFactory.createCompleted(
      printer.id,
      printer.assetTag,
      "CLEANING",
      person.id,
      60 + i * 10,
    ).create(prisma);
    recordCount++;
  }

  // Network equipment maintenance records
  for (const device of network) {
    if (existingRecordAssetIds.has(device.id)) continue;
    const person = pickRandom(persons);

    await MaintenanceRecordFactory.createCompleted(
      device.id,
      device.assetTag,
      "UPDATE",
      person.id,
      45,
    ).create(prisma);
    recordCount++;
  }

  // Scheduled maintenance (upcoming) - skip if we already have completed records
  for (let i = 0; i < Math.min(servers.length, 3); i++) {
    const server = servers[i];
    // For scheduled records, we allow even if completed records exist (different status)
    const person = pickRandom(persons);

    await MaintenanceRecordFactory.createScheduled(
      server.id,
      server.assetTag,
      "PREVENTIVE",
      person.id,
      7 + i * 3, // 7, 10, 13 days from now
    ).create(prisma);
    recordCount++;
  }

  // In-progress maintenance
  if (servers.length > 0) {
    const server = servers[0];
    const person = pickRandom(persons);

    await new MaintenanceRecordFactory({
      assetId: server.id,
      title: `Emergency Maintenance - ${server.assetTag}`,
      description: "Investigating performance degradation",
      scheduledDate: new Date(),
      performedByPersonId: person.id,
      status: MaintenanceStatus.IN_PROGRESS,
      notes: "High CPU usage detected, investigating root cause",
      partsUsed: ["Diagnostics run", "Temporary fixes applied"],
      cost: randomInt(200, 600),
      nextMaintenanceDate: getRelativeDate(7),
    }).create(prisma);
    recordCount++;
  }

  // Cancelled maintenance (example)
  if (laptops.length > 0) {
    const laptop = laptops[0];

    await new MaintenanceRecordFactory({
      assetId: laptop.id,
      title: `Laptop Upgrade - ${laptop.assetTag}`,
      description: "Planned RAM upgrade",
      scheduledDate: getRelativeDate(-30),
      status: MaintenanceStatus.CANCELLED,
      notes: "Asset scheduled for replacement instead of upgrade",
      nextMaintenanceDate: null,
    }).create(prisma);
    recordCount++;
  }

  // Overdue maintenance (missed schedule)
  if (printers.length >= 3) {
    const printer = printers[2];
    const person = pickRandom(persons);

    await new MaintenanceRecordFactory({
      assetId: printer.id,
      title: `Overdue Printer Maintenance - ${printer.assetTag}`,
      description: "Scheduled maintenance not yet performed",
      scheduledDate: getRelativeDate(-10), // 10 days overdue
      performedByPersonId: person.id,
      status: MaintenanceStatus.OVERDUE,
      notes: "OVERDUE: Reschedule ASAP",
      nextMaintenanceDate: getRelativeDate(2),
    }).create(prisma);
    recordCount++;
  }

  logSuccess(`Processed ${recordCount} maintenance records`);

  // ==============================================
  // Summary
  // ==============================================
  logSuccess("Warranties & Maintenance seeding completed");
  console.log("\nSummary:");
  console.log(`   - ${warrantyCount} warranties`);
  console.log(`   - ${scheduleCount} maintenance schedules`);
  console.log(`   - ${recordCount} maintenance records`);
}

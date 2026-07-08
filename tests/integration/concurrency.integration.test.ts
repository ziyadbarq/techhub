/**
 * Concurrency Integration Tests
 *
 * Regression guards for the check-then-write race fixes: license seat
 * allocation, asset reservation double-booking, and stock balance
 * validation. These run real transactions against a local Postgres
 * (barq_test) through the AsyncLocalStorage-backed UnitOfWork and the
 * transaction-aware Prisma proxy — the same wiring production uses.
 *
 * The suite skips itself when barq_test is unreachable (e.g. CI runners
 * without Postgres). To run locally: create the barq_test database and
 * apply migrations (psql -f per migration, or point prisma migrate deploy
 * at it), then `npx vitest --run tests/integration`.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/infrastructure/database/prisma/client";
import { transactionAwarePrisma } from "@/infrastructure/database/prisma/transaction-context";
import { PrismaUnitOfWork } from "@/infrastructure/services/prisma-unit-of-work.service";
import { PrismaLicenseAllocationRepository } from "@/infrastructure/repositories/prisma-license-allocation.repository";
import { PrismaLicenseEntitlementRepository } from "@/infrastructure/repositories/prisma-license-entitlement.repository";
import { PrismaAssetReservationRepository } from "@/infrastructure/repositories/prisma-asset-reservation.repository";
import { PrismaAssetReservationConflictRepository } from "@/infrastructure/repositories/prisma-asset-reservation-conflict.repository";
import { PrismaAssetAssignmentRepository } from "@/infrastructure/repositories/prisma-asset-assignment.repository";
import { PrismaStockMovementRepository } from "@/infrastructure/repositories/prisma-stock-movement.repository";
import { CuidIdGeneratorService } from "@/infrastructure/services/id/cuid-id-generator.service";
import { CreateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/create-license-allocation.use-case";
import { AllocationTargetType } from "@/core/domain/entities/license-allocation.entity";
import { CreateReservationUseCase } from "@/core/use-cases/reservations/create-reservation.use-case";
import { CreateStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement/create-stock-movement.use-case";
import type { ILoggerService } from "@/core/services/logger.service.interface";

const PREFIX = "ITEST";

// Only ever run against the dedicated test database.
async function databaseAvailable(): Promise<boolean> {
  if (!process.env.DATABASE_URL?.includes("barq_test")) return false;
  try {
    const rows = await prisma.$queryRaw<
      [{ db: string }]
    >`SELECT current_database() AS db`;
    return rows[0]?.db === "barq_test";
  } catch {
    return false;
  }
}

const dbAvailable = await databaseAvailable();

const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  audit: () => {},
  startTimer: () => () => 0,
  timed: () => {},
  withTiming: async <T>(_op: string, fn: () => Promise<T>) => fn(),
} as unknown as ILoggerService;

describe.skipIf(!dbAvailable)("concurrency integration", () => {
  const idGenerator = new CuidIdGeneratorService();
  const unitOfWork = new PrismaUnitOfWork();

  const allocationRepo = new PrismaLicenseAllocationRepository(
    transactionAwarePrisma,
    noopLogger,
  );
  const entitlementRepo = new PrismaLicenseEntitlementRepository(
    transactionAwarePrisma,
    noopLogger,
  );
  const reservationRepo = new PrismaAssetReservationRepository(
    transactionAwarePrisma,
  );
  const conflictRepo = new PrismaAssetReservationConflictRepository(
    transactionAwarePrisma,
  );
  const assignmentRepo = new PrismaAssetAssignmentRepository(
    transactionAwarePrisma,
  );
  const stockMovementRepo = new PrismaStockMovementRepository(
    transactionAwarePrisma,
  );

  const createAllocation = new CreateLicenseAllocationUseCase(
    allocationRepo,
    entitlementRepo,
    unitOfWork,
  );
  const createReservation = new CreateReservationUseCase(
    reservationRepo,
    conflictRepo,
    assignmentRepo,
    noopLogger,
    idGenerator,
    unitOfWork,
  );
  const createStockMovement = new CreateStockMovementUseCase(
    stockMovementRepo,
    unitOfWork,
  );

  // Fixture ids
  let personId: string;
  let entitlementId: string;
  let assetId: string;
  let locationAId: string;
  let locationBId: string;

  async function cleanup() {
    await prisma.licenseAllocation.deleteMany({
      where: { licenseEntitlement: { note: PREFIX } },
    });
    await prisma.licenseEntitlement.deleteMany({ where: { note: PREFIX } });
    await prisma.licenseProduct.deleteMany({
      where: { code: { startsWith: PREFIX } },
    });
    await prisma.assetReservation.deleteMany({
      where: { asset: { assetTag: { startsWith: PREFIX } } },
    });
    await prisma.stockMovement.deleteMany({
      where: { reason: PREFIX },
    });
    await prisma.asset.deleteMany({
      where: { assetTag: { startsWith: PREFIX } },
    });
    await prisma.assetCategory.deleteMany({
      where: { code: { startsWith: PREFIX } },
    });
    await prisma.stockLocation.deleteMany({
      where: { code: { startsWith: PREFIX } },
    });
    await prisma.vendor.deleteMany({ where: { code: { startsWith: PREFIX } } });
    await prisma.person.deleteMany({
      where: { email: { startsWith: "itest-" } },
    });
    await prisma.organizationUnit.deleteMany({
      where: { code: { startsWith: PREFIX } },
    });
  }

  beforeAll(async () => {
    await cleanup();

    const orgUnit = await prisma.organizationUnit.create({
      data: { name: `${PREFIX} Org`, code: `${PREFIX}-ORG`, level: 1 },
    });
    const person = await prisma.person.create({
      data: {
        firstName: "Itest",
        lastName: "Person",
        email: "itest-person@example.com",
        orgUnitId: orgUnit.id,
      },
    });
    personId = person.id;

    const vendor = await prisma.vendor.create({
      data: { name: `${PREFIX} Vendor`, code: `${PREFIX}-VND` },
    });
    const product = await prisma.licenseProduct.create({
      data: {
        name: `${PREFIX} Product`,
        code: `${PREFIX}-PRD`,
        vendorId: vendor.id,
        metricType: "PER_USER",
      },
    });
    const entitlement = await prisma.licenseEntitlement.create({
      data: {
        licenseProductId: product.id,
        purchasedQuantity: 1,
        effectiveStart: new Date("2020-01-01"),
        note: PREFIX,
      },
    });
    entitlementId = entitlement.id;

    const category = await prisma.assetCategory.create({
      data: { name: `${PREFIX} Category`, code: `${PREFIX}-CAT` },
    });
    const asset = await prisma.asset.create({
      data: { assetTag: `${PREFIX}-ASSET-1`, assetCategoryId: category.id },
    });
    assetId = asset.id;

    const locationA = await prisma.stockLocation.create({
      data: { name: `${PREFIX} Location A`, code: `${PREFIX}-LOC-A` },
    });
    locationAId = locationA.id;
    const locationB = await prisma.stockLocation.create({
      data: { name: `${PREFIX} Location B`, code: `${PREFIX}-LOC-B` },
    });
    locationBId = locationB.id;
  }, 30000);

  afterAll(async () => {
    await cleanup();
  }, 30000);

  it("allows exactly one of two concurrent allocations for the last seat", async () => {
    const attempt = () =>
      createAllocation.execute({
        licenseEntitlementId: entitlementId,
        targetType: AllocationTargetType.PERSON,
        targetId: personId,
        allocatedQuantity: 1,
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(
      /Insufficient quantity/,
    );

    const consumed =
      await allocationRepo.sumActiveAllocatedQuantityByEntitlement(
        entitlementId,
      );
    expect(consumed).toBe(1);
  }, 20000);

  it("allows exactly one of two concurrent reservations for the same asset", async () => {
    const attempt = () =>
      createReservation.execute({
        assetId,
        reservedForPersonId: personId,
        reservedById: personId,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(
      /active reservation/,
    );

    const reservations = await prisma.assetReservation.count({
      where: { assetId },
    });
    expect(reservations).toBe(1);
  }, 20000);

  it("rejects an outbound stock movement exceeding the location balance", async () => {
    await createStockMovement.execute({
      movementType: "IN",
      stockLocationToId: locationAId,
      quantity: 5,
      performedById: personId,
      reason: PREFIX,
    });

    await expect(
      createStockMovement.execute({
        movementType: "OUT",
        stockLocationFromId: locationAId,
        quantity: 10,
        performedById: personId,
        reason: PREFIX,
      }),
    ).rejects.toThrow(/Insufficient stock/);
  }, 20000);

  it("allows exactly one of two concurrent outbound movements that together exceed the balance", async () => {
    // Balance at location A is 5 from the previous test; each attempt draws 3.
    const attempt = () =>
      createStockMovement.execute({
        movementType: "TRANSFER",
        stockLocationFromId: locationAId,
        stockLocationToId: locationBId,
        quantity: 3,
        performedById: personId,
        reason: PREFIX,
      });

    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toMatch(
      /Insufficient stock/,
    );

    const remaining =
      await stockMovementRepo.getNetQuantityAtLocation(locationAId);
    expect(remaining).toBe(2);
  }, 20000);
});

// When the database is unavailable the suite must still contain a test so
// vitest doesn't error on an empty file.
describe.skipIf(dbAvailable)("concurrency integration (skipped)", () => {
  it("skips when barq_test is not reachable", () => {
    expect(dbAvailable).toBe(false);
  });
});

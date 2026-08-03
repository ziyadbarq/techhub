import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import { prisma } from "@/infrastructure/database/prisma/client";
import {
  createConfigurationItemAction,
  deleteConfigurationItemAction,
  listConfigurationItemsAction,
  updateConfigurationItemAction,
} from "@/interface-adapters/controllers/configuration-item.controller";
import {
  createRelationshipTypeAction,
  deleteRelationshipTypeAction,
  listRelationshipTypesAction,
  updateRelationshipTypeAction,
} from "@/interface-adapters/controllers/relationship-type.controller";
import {
  createCIRelationshipAction,
  deleteCIRelationshipAction,
  listCIRelationshipsAction,
  updateCIRelationshipAction,
} from "@/interface-adapters/controllers/ci-relationship.controller";

type StepResult = {
  step: string;
  status: "passed" | "failed";
  details: string;
};

type AnyUseCase = {
  execute: (input?: unknown) => Promise<unknown>;
};

const timestamp = Date.now();
const suffix = `QA${String(timestamp).slice(-6)}`;

const ciClassName = `QA CI Class ${suffix}`;
const ciClassCode = `QA_CI_${String(timestamp).slice(-6)}`;
const relTypeName = `QA Depends ${suffix}`;
const relTypeCode = `QA_DEP_${String(timestamp).slice(-6)}`;
const ciOneName = `QA Config Item A ${suffix}`;
const ciTwoName = `QA Config Item B ${suffix}`;
const ciOneKey = `qa-ci-a-${String(timestamp).slice(-6)}`;
const ciTwoKey = `qa-ci-b-${String(timestamp).slice(-6)}`;

const results: StepResult[] = [];

let createdCIClassId: string | null = null;
let createdRelationshipTypeId: string | null = null;
let createdCIOneId: string | null = null;
let createdCITwoId: string | null = null;
let createdRelationshipId: string | null = null;

function record(
  step: string,
  status: "passed" | "failed",
  details: string,
): void {
  results.push({ step, status, details });
}

async function main(): Promise<void> {
  const container = getContainer();

  const createCIClassUseCase = container.get<AnyUseCase>(
    DI_TOKENS.CreateCIClassUseCase,
  );
  const updateCIClassUseCase = container.get<AnyUseCase>(
    DI_TOKENS.UpdateCIClassUseCase,
  );
  const listCIClassesUseCase = container.get<AnyUseCase>(
    DI_TOKENS.ListCIClassesUseCase,
  );
  const deleteCIClassUseCase = container.get<AnyUseCase>(
    DI_TOKENS.DeleteCIClassUseCase,
  );

  const lifecycleModel = await prisma.lifecycleModel.findFirst({
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (!lifecycleModel) {
    throw new Error("No lifecycle model found for CMDB QA test setup");
  }

  try {
    const createdCIClass = (await createCIClassUseCase.execute({
      name: ciClassName,
      code: ciClassCode,
      description: "QA-created CI class for CRUD validation",
      lifecycleModelId: lifecycleModel.id,
      defaultCriticality: "MEDIUM",
      defaultEnvironment: "DEV",
      isDiscoverable: true,
    })) as { id: string; name: string; code: string };

    createdCIClassId = createdCIClass.id;
    record(
      "CI Class Create",
      "passed",
      `Created CI class "${createdCIClass.name}" (${createdCIClass.code})`,
    );

    const updatedCIClass = (await updateCIClassUseCase.execute({
      ciClassId: createdCIClassId,
      description: "QA-updated CI class description",
      defaultCriticality: "HIGH",
    })) as { description?: string | null; defaultCriticality?: string | null };

    if (updatedCIClass.description !== "QA-updated CI class description") {
      throw new Error("Updated CI class description was not persisted");
    }

    record(
      "CI Class Update",
      "passed",
      `Updated CI class description and default criticality to ${updatedCIClass.defaultCriticality ?? "unknown"}`,
    );

    const ciClassList = (await listCIClassesUseCase.execute({})) as Array<{
      id: string;
    }>;

    if (!ciClassList.some((item) => item.id === createdCIClassId)) {
      throw new Error("Created CI class was not returned by list use case");
    }

    record(
      "CI Class Read",
      "passed",
      "Created CI class is visible in the CMDB class listing",
    );

    const createdRelationshipType = await createRelationshipTypeAction({
      name: relTypeName,
      code: relTypeCode,
      description: "QA-created relationship type",
      direction: "UNIDIRECTIONAL",
      isImpacting: false,
    });

    if (!createdRelationshipType.success) {
      throw new Error(createdRelationshipType.error);
    }

    createdRelationshipTypeId = createdRelationshipType.data.id;
    record(
      "Relationship Type Create",
      "passed",
      `Created relationship type "${createdRelationshipType.data.name}"`,
    );

    const updatedRelationshipType = await updateRelationshipTypeAction(
      createdRelationshipTypeId,
      {
        name: `${relTypeName} Updated`,
        description: "QA-updated relationship type",
        direction: "BIDIRECTIONAL",
        isImpacting: true,
      },
    );

    if (!updatedRelationshipType.success) {
      throw new Error(updatedRelationshipType.error);
    }

    if (
      updatedRelationshipType.data.direction !== "BIDIRECTIONAL" ||
      updatedRelationshipType.data.isImpacting !== true
    ) {
      throw new Error(
        "Relationship type update did not persist direction/isImpacting",
      );
    }

    record(
      "Relationship Type Update",
      "passed",
      "Updated relationship type to bidirectional and impacting",
    );

    const relationshipTypeList = await listRelationshipTypesAction();
    if (
      !relationshipTypeList.success ||
      !relationshipTypeList.data.some(
        (item) => item.id === createdRelationshipTypeId,
      )
    ) {
      throw new Error("Created relationship type was not returned by list");
    }

    record(
      "Relationship Type Read",
      "passed",
      "Created relationship type is visible in the relationship type listing",
    );

    const createdCIOne = await createConfigurationItemAction({
      name: ciOneName,
      ciClassId: createdCIClassId,
      lifecycleStateId: null,
      criticality: "MEDIUM",
      environment: "DEV",
      primaryOwnerPersonId: null,
      primaryOwnerOrgUnitId: null,
      locationId: null,
      linkedAssetId: null,
      ciKey: ciOneKey,
      description: "First QA CMDB item",
      attributes: { source: "qa", order: 1 },
    });

    if (!createdCIOne.success) {
      throw new Error(createdCIOne.error);
    }

    createdCIOneId = createdCIOne.data.id;
    record(
      "Configuration Item Create A",
      "passed",
      `Created configuration item "${createdCIOne.data.name}"`,
    );

    const createdCITwo = await createConfigurationItemAction({
      name: ciTwoName,
      ciClassId: createdCIClassId,
      lifecycleStateId: null,
      criticality: "LOW",
      environment: "TEST",
      primaryOwnerPersonId: null,
      primaryOwnerOrgUnitId: null,
      locationId: null,
      linkedAssetId: null,
      ciKey: ciTwoKey,
      description: "Second QA CMDB item",
      attributes: { source: "qa", order: 2 },
    });

    if (!createdCITwo.success) {
      throw new Error(createdCITwo.error);
    }

    createdCITwoId = createdCITwo.data.id;
    record(
      "Configuration Item Create B",
      "passed",
      `Created second configuration item "${createdCITwo.data.name}"`,
    );

    const updatedCIOne = await updateConfigurationItemAction(createdCIOneId, {
      name: `${ciOneName} Updated`,
      criticality: "CRITICAL",
      environment: "PROD",
      description: "QA-updated first CMDB item",
      attributes: { source: "qa", updated: true },
    });

    if (!updatedCIOne.success) {
      throw new Error(updatedCIOne.error);
    }

    if (
      updatedCIOne.data.criticality !== "CRITICAL" ||
      updatedCIOne.data.environment !== "PROD"
    ) {
      throw new Error(
        "Configuration item update did not persist criticality/environment",
      );
    }

    record(
      "Configuration Item Update",
      "passed",
      "Updated configuration item criticality/environment/name successfully",
    );

    const ciList = await listConfigurationItemsAction();
    if (
      !ciList.success ||
      !ciList.data.some((item) => item.id === createdCIOneId) ||
      !ciList.data.some((item) => item.id === createdCITwoId)
    ) {
      throw new Error(
        "Created configuration items were not returned by configuration item list",
      );
    }

    record(
      "Configuration Item Read",
      "passed",
      "Both created configuration items are visible in the listing",
    );

    const createdRelationship = await createCIRelationshipAction(
      createdCIOneId,
      createdCITwoId,
      createdRelationshipTypeId,
      "QA-created CI relationship",
    );

    if (!createdRelationship.success) {
      throw new Error(createdRelationship.error);
    }

    createdRelationshipId = createdRelationship.data.id;
    record(
      "CI Relationship Create",
      "passed",
      "Created relationship between the two QA configuration items",
    );

    const updatedRelationship = await updateCIRelationshipAction(
      createdRelationshipId,
      {
        note: "QA-updated CI relationship",
        isActive: false,
      },
    );

    if (!updatedRelationship.success) {
      throw new Error(updatedRelationship.error);
    }

    if (
      updatedRelationship.data.note !== "QA-updated CI relationship" ||
      updatedRelationship.data.isActive !== false
    ) {
      throw new Error("CI relationship update did not persist note/isActive");
    }

    record(
      "CI Relationship Update",
      "passed",
      "Updated CI relationship note and deactivated it successfully",
    );

    const relationshipList = await listCIRelationshipsAction(createdCIOneId);
    if (
      !relationshipList.success ||
      !relationshipList.data.some((item) => item.id === createdRelationshipId)
    ) {
      throw new Error(
        "Created CI relationship was not returned by the CI relationship list",
      );
    }

    record(
      "CI Relationship Read",
      "passed",
      "Created CI relationship is visible in the relationship listing",
    );
  } catch (error) {
    record(
      "Execution",
      "failed",
      error instanceof Error ? error.message : "Unknown QA execution error",
    );
  } finally {
    if (createdRelationshipId) {
      const result = await deleteCIRelationshipAction(createdRelationshipId);
      record(
        "CI Relationship Delete",
        result.success ? "passed" : "failed",
        result.success
          ? "Deleted QA relationship successfully"
          : `Failed to delete QA relationship: ${result.error}`,
      );
    }

    if (createdCIOneId) {
      const result = await deleteConfigurationItemAction(createdCIOneId);
      record(
        "Configuration Item Delete A",
        result.success ? "passed" : "failed",
        result.success
          ? "Deleted first QA configuration item"
          : `Failed to delete first QA configuration item: ${result.error}`,
      );
    }

    if (createdCITwoId) {
      const result = await deleteConfigurationItemAction(createdCITwoId);
      record(
        "Configuration Item Delete B",
        result.success ? "passed" : "failed",
        result.success
          ? "Deleted second QA configuration item"
          : `Failed to delete second QA configuration item: ${result.error}`,
      );
    }

    if (createdRelationshipTypeId) {
      const result = await deleteRelationshipTypeAction(
        createdRelationshipTypeId,
      );
      record(
        "Relationship Type Delete",
        result.success ? "passed" : "failed",
        result.success
          ? "Deleted QA relationship type successfully"
          : `Failed to delete QA relationship type: ${result.error}`,
      );
    }

    if (createdCIClassId) {
      try {
        await deleteCIClassUseCase.execute({ ciClassId: createdCIClassId });
        record("CI Class Delete", "passed", "Deleted QA CI class successfully");
      } catch (error) {
        record(
          "CI Class Delete",
          "failed",
          error instanceof Error
            ? error.message
            : "Failed to delete QA CI class",
        );
      }
    }

    await prisma.$disconnect();
  }

  const passed = results.filter((result) => result.status === "passed").length;
  const failed = results.filter((result) => result.status === "failed").length;

  console.log(
    JSON.stringify(
      {
        summary: {
          passed,
          failed,
        },
        artifacts: {
          ciClassCode,
          relTypeCode,
          ciOneKey,
          ciTwoKey,
        },
        results,
      },
      null,
      2,
    ),
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void main();

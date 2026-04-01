import { beforeEach, describe, expect, it, vi } from "vitest";
import { SyncOciResourcesUseCase } from "../sync-oci-resources.use-case";
import { ConfigurationItem } from "@/core/domain/entities/configuration-item.entity";
import { CIRelationship } from "@/core/domain/entities/ci-relationship.entity";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type {
  IOciSyncLogRepository,
  OciSyncLogCreateInput,
  OciSyncLogRecord,
  OciSyncLogUpdateInput,
} from "@/core/repositories/oci-sync-log.repository.interface";
import type { IOciWebhookService } from "@/core/services/oci-webhook.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import type { OciWebhookResponse } from "@/core/domain/value-objects/oci-resource.types";
import { extractResourceAttributes } from "@/core/domain/value-objects/oci-service-mapping";
import type { OciDataSourceDescriptor } from "@/core/services/oci-webhook.service.interface";

const compartmentId = "ocid1.compartment.oc1..compartment";
const tenancyId = "ocid1.tenancy.oc1..tenancy";
const region = "me-jeddah-1";
const compartmentName = "cmp-prod-app";
const defaultBatchSource: OciDataSourceDescriptor = {
  mode: "webhook",
  attributeValue: "oci_webhook",
  description: "OCI webhook endpoint",
};
const computeResourceId = "ocid1.instance.oc1..instance";
const computeRawResource = {
  id: computeResourceId,
  "display-name": "vm-1",
  "compartment-id": compartmentId,
  "lifecycle-state": "RUNNING",
  "time-created": "2026-03-26T00:00:00.000Z",
  shape: "VM.Standard.E5.Flex",
};
const lbResourceId = "ocid1.loadbalancer.oc1..lb";
const lbRawResource = {
  id: lbResourceId,
  "display-name": "lb-1",
  "compartment-id": compartmentId,
  "lifecycle-state": "ACTIVE",
  "time-created": "2026-03-26T00:00:00.000Z",
  "ip-addresses": [
    {
      "ip-address": "10.100.3.11",
      "is-public": false,
      "reserved-ip": null,
    },
  ],
  "backend-sets": {},
};

function createMockLogger(): ILoggerService {
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
    startTimer: vi.fn((operation: string) => ({
      startTime: Date.now(),
      operation,
    })),
    endTimer: vi.fn(),
    audit: vi.fn(),
    withTiming: vi.fn(async (_operation: string, fn: () => Promise<unknown>) =>
      fn(),
    ),
  };

  logger.child.mockReturnValue(logger);
  return logger as unknown as ILoggerService;
}

function createMockSyncLogRecord(
  input: Pick<
    OciSyncLogCreateInput,
    "id" | "serviceTypes" | "triggeredBy" | "isDryRun"
  >,
  overrides: Partial<OciSyncLogRecord> = {},
): OciSyncLogRecord {
  return {
    id: input.id,
    status: "IN_PROGRESS",
    serviceTypes: input.serviceTypes,
    tenancyId: null,
    regions: [],
    resourcesProcessed: 0,
    resourcesCreated: 0,
    resourcesUpdated: 0,
    resourcesRetired: 0,
    resourcesUnchanged: 0,
    compartmentsCreated: 0,
    relationshipsCreated: 0,
    errorsCount: 0,
    errors: null,
    startedAt: new Date("2026-03-26T00:00:00.000Z"),
    completedAt: null,
    durationMs: null,
    triggeredBy: input.triggeredBy ?? null,
    isDryRun: input.isDryRun,
    ...overrides,
  };
}

function createExistingConfigurationItem(options: {
  id: string;
  ciClassId: string;
  ciKey: string;
  name: string;
  environment: "PROD" | "UAT" | "DEV" | "DR" | "TEST" | "OTHER" | null;
  lifecycleStateId?: string | null;
  attributes: Record<string, unknown> | null;
}): ConfigurationItem {
  return ConfigurationItem.reconstitute({
    id: options.id,
    name: options.name,
    ciClassId: options.ciClassId,
    lifecycleStateId: options.lifecycleStateId ?? null,
    criticality: null,
    environment: options.environment,
    primaryOwnerPersonId: null,
    primaryOwnerOrgUnitId: null,
    locationId: null,
    linkedAssetId: null,
    ciKey: options.ciKey,
    description: null,
    attributes: options.attributes,
    createdAt: new Date("2026-03-26T00:00:00.000Z"),
    updatedAt: new Date("2026-03-26T00:00:00.000Z"),
  });
}

function createComputeWebhookResponse(): OciWebhookResponse {
  return {
    "object Object": [
      {
        generated_at: "2026-03-26T00:00:00.000Z",
        tenancyId,
        regions: [region],
        services: {
          compute: [
            {
              id: compartmentId,
              name: compartmentName,
              total: 1,
              regions: [
                {
                  region,
                  count: 1,
                  items: [computeRawResource],
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

function createLoadBalancerWebhookResponse(): OciWebhookResponse {
  return {
    "object Object": [
      {
        generated_at: "2026-03-26T00:00:00.000Z",
        tenancyId,
        regions: [region],
        services: {
          lb: [
            {
              id: compartmentId,
              name: compartmentName,
              total: 1,
              regions: [
                {
                  region,
                  count: 1,
                  items: [lbRawResource],
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

function createExistingRelationship(options: {
  id: string;
  fromCiId: string;
  toCiId: string;
  relationshipTypeId: string;
  isActive?: boolean;
}): CIRelationship {
  return CIRelationship.reconstitute({
    id: options.id,
    fromCiId: options.fromCiId,
    toCiId: options.toCiId,
    relationshipTypeId: options.relationshipTypeId,
    isActive: options.isActive ?? true,
    validFrom: new Date("2026-03-26T00:00:00.000Z"),
    validTo: null,
    note: null,
    createdAt: new Date("2026-03-26T00:00:00.000Z"),
    updatedAt: new Date("2026-03-26T00:00:00.000Z"),
  });
}

describe("SyncOciResourcesUseCase", () => {
  let logger: ILoggerService;
  let idGenerator: IIdGenerator;
  let webhookService: IOciWebhookService;
  let ciRepository: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    findByCiKey: ReturnType<typeof vi.fn>;
    findOciManagedByServiceTypes: ReturnType<typeof vi.fn>;
  };
  let relationshipRepository: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    existsBetweenCis: ReturnType<typeof vi.fn>;
    findByFromCi: ReturnType<typeof vi.fn>;
    findByToCi: ReturnType<typeof vi.fn>;
  };
  let ciClassRepository: { findByCode: ReturnType<typeof vi.fn> };
  let relationshipTypeRepository: { findByCode: ReturnType<typeof vi.fn> };
  let lifecycleStateRepository: { findAll: ReturnType<typeof vi.fn> };
  let syncLogRepository: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let useCase: SyncOciResourcesUseCase;

  beforeEach(() => {
    let idCounter = 0;

    logger = createMockLogger();
    idGenerator = {
      generateId: vi.fn(() => `generated-id-${idCounter++}`),
    };
    webhookService = {
      fetchServiceData: vi.fn(),
      fetchAllServices: vi.fn(),
      testConnection: vi.fn(),
    } as unknown as IOciWebhookService;
    ciRepository = {
      create: vi.fn(async (ci: ConfigurationItem) => ci),
      update: vi.fn(async (ci: ConfigurationItem) => ci),
      findByCiKey: vi.fn(),
      findOciManagedByServiceTypes: vi.fn(async () => []),
    };
    relationshipRepository = {
      create: vi.fn(async (relationship) => relationship),
      update: vi.fn(async (relationship) => relationship),
      existsBetweenCis: vi.fn(),
      findByFromCi: vi.fn(async () => []),
      findByToCi: vi.fn(async () => []),
    };
    ciClassRepository = {
      findByCode: vi.fn(async (code: string) => ({ id: `${code}-id`, code })),
    };
    relationshipTypeRepository = {
      findByCode: vi.fn(),
    };
    lifecycleStateRepository = {
      findAll: vi.fn(async () => [
        { id: "active-state-id", name: "Active" },
        { id: "retired-state-id", name: "Retired" },
      ]),
    };
    syncLogRepository = {
      create: vi.fn(async (input: OciSyncLogCreateInput) =>
        createMockSyncLogRecord(input),
      ),
      update: vi.fn(async (id: string, data: OciSyncLogUpdateInput) =>
        createMockSyncLogRecord(
          {
            id,
            serviceTypes: [],
            triggeredBy: undefined,
            isDryRun: false,
          },
          {
            status: data.status ?? "IN_PROGRESS",
            tenancyId: data.tenancyId ?? null,
            regions: data.regions ?? [],
            resourcesProcessed: data.resourcesProcessed ?? 0,
            resourcesCreated: data.resourcesCreated ?? 0,
            resourcesUpdated: data.resourcesUpdated ?? 0,
            resourcesRetired: data.resourcesRetired ?? 0,
            resourcesUnchanged: data.resourcesUnchanged ?? 0,
            compartmentsCreated: data.compartmentsCreated ?? 0,
            relationshipsCreated: data.relationshipsCreated ?? 0,
            errorsCount: data.errorsCount ?? 0,
            errors: data.errors ?? null,
            completedAt: data.completedAt ?? null,
            durationMs: data.durationMs ?? null,
          },
        ),
      ),
    };

    const configService: IConfigService = {
      get: vi.fn(async () => undefined),
      getString: vi.fn(async () => undefined),
      getNumber: vi.fn(async () => undefined),
      getBoolean: vi.fn(async () => undefined),
      getOrThrow: vi.fn(async () => ""),
      invalidateCache: vi.fn(),
    };

    useCase = new SyncOciResourcesUseCase(
      logger,
      webhookService,
      ciRepository as unknown as IConfigurationItemRepository,
      relationshipRepository as unknown as ICIRelationshipRepository,
      ciClassRepository as unknown as ICIClassRepository,
      relationshipTypeRepository as unknown as IRelationshipTypeRepository,
      syncLogRepository as unknown as IOciSyncLogRepository,
      lifecycleStateRepository as unknown as ILifecycleStateRepository,
      idGenerator,
      configService,
    );
  });

  it("marks fetch failures as partial when another requested service syncs unchanged resources", async () => {
    const resourceAttributes = extractResourceAttributes(
      "compute",
      computeRawResource,
      region,
      compartmentName,
    );
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: resourceAttributes,
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [
        {
          serviceKeys: ["lb"],
          kind: "network",
          message:
            "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
        },
      ],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === computeResourceId) return existingResource;
      return null;
    });
    relationshipRepository.findByFromCi.mockResolvedValue([
      createExistingRelationship({
        id: "contains-rel",
        fromCiId: "compartment-ci",
        toCiId: "resource-ci",
        relationshipTypeId: "contains-id",
      }),
    ]);

    const result = await useCase.execute({
      serviceKeys: ["compute", "lb"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.resourcesUnchanged).toBe(1);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceKey: "lb",
          error:
            "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
        }),
      ]),
    );
    expect(result.status).toBe("PARTIAL");
    expect(result.summary).toContain("completed with 1 issue");
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "PARTIAL",
        resourcesUnchanged: 1,
        errorsCount: 1,
      }),
    );
  });

  it("collapses endpoint-wide fetch outages into a single sync error", async () => {
    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map(),
      failures: [
        {
          serviceKeys: ["compute", "lb", "nlb"],
          kind: "network",
          message:
            "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
        },
      ],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });

    const result = await useCase.execute({
      serviceKeys: ["compute", "lb", "nlb"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("FAILED");
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      serviceKey: "compute, lb, nlb",
      error:
        "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again. Affected services: compute, lb, nlb.",
    });
    expect(result.summary).toContain("Affected services: compute, lb, nlb.");
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "FAILED",
        errorsCount: 1,
      }),
    );
  });

  it("surfaces missing relationship type as an admin-facing partial issue", async () => {
    const resourceAttributes = extractResourceAttributes(
      "compute",
      computeRawResource,
      region,
      compartmentName,
    );
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: resourceAttributes,
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue(null);
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === computeResourceId) return existingResource;
      return null;
    });

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.resourcesUnchanged).toBe(1);
    expect(result.status).toBe("PARTIAL");
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          serviceKey: "cmdb",
          resourceId: "CONTAINS",
          error:
            "The CMDB relationship type 'CONTAINS' is missing, so OCI resources were synced without compartment-to-resource relationships. Create or restore the CONTAINS relationship type to enable relationship creation.",
        }),
      ]),
    );
    expect(result.summary).toContain(
      "The CMDB relationship type 'CONTAINS' is missing",
    );
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "PARTIAL",
        errorsCount: 1,
      }),
    );
  });

  it("projects dry-run compartment and relationship creation counts", async () => {
    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockResolvedValue(null);

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      dryRun: true,
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.resourcesCreated).toBe(1);
    expect(result.compartmentsCreated).toBe(1);
    expect(result.relationshipsCreated).toBe(1);
    expect(result.summary).toContain("Preview completed");
    expect(result.summary).toContain(
      "1 compartment and 1 relationship would be created.",
    );
    expect(relationshipRepository.findByFromCi).not.toHaveBeenCalled();
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "COMPLETED",
        resourcesCreated: 1,
        compartmentsCreated: 1,
        relationshipsCreated: 1,
      }),
    );
  });

  it("projects missing relationships during dry run even when the resource is unchanged", async () => {
    const resourceAttributes = extractResourceAttributes(
      "compute",
      computeRawResource,
      region,
      compartmentName,
    );
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: resourceAttributes,
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === computeResourceId) return existingResource;
      return null;
    });
    relationshipRepository.findByFromCi.mockResolvedValue([]);

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      dryRun: true,
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.resourcesUnchanged).toBe(1);
    expect(result.compartmentsCreated).toBe(0);
    expect(result.relationshipsCreated).toBe(1);
    expect(result.summary).toContain(
      "0 compartments and 1 relationship would be created.",
    );
    expect(relationshipRepository.findByFromCi).toHaveBeenCalledWith(
      "compartment-ci",
    );
  });

  it("heals missing compartment relationships even when the target resource is unchanged", async () => {
    const resourceAttributes = extractResourceAttributes(
      "compute",
      computeRawResource,
      region,
      compartmentName,
    );
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: resourceAttributes,
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === computeResourceId) return existingResource;
      return null;
    });
    relationshipRepository.findByFromCi.mockResolvedValue([]);

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.resourcesUnchanged).toBe(1);
    expect(result.relationshipsCreated).toBe(1);
    expect(result.status).toBe("COMPLETED");
    expect(relationshipRepository.findByFromCi).toHaveBeenCalledWith(
      "compartment-ci",
    );
    expect(relationshipRepository.create).toHaveBeenCalledTimes(1);
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "COMPLETED",
        relationshipsCreated: 1,
        resourcesUnchanged: 1,
      }),
    );
  });

  it("retires OCI resources missing from a successful live fetch and preserves them historically", async () => {
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: extractResourceAttributes(
        "compute",
        computeRawResource,
        region,
        compartmentName,
      ),
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([
        [
          "compute",
          {
            "object Object": [
              {
                generated_at: "2026-03-26T00:00:00.000Z",
                tenancyId,
                regions: [region],
                services: {
                  compute: [],
                },
              },
            ],
          },
        ],
      ]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findOciManagedByServiceTypes.mockResolvedValue([
      existingResource,
    ]);
    relationshipRepository.findByToCi.mockResolvedValue([
      createExistingRelationship({
        id: "contains-rel",
        fromCiId: "compartment-ci",
        toCiId: "resource-ci",
        relationshipTypeId: "contains-id",
      }),
    ]);

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.resourcesProcessed).toBe(0);
    expect(result.resourcesRetired).toBe(1);
    expect(result.summary).toContain("1 retired");
    expect(ciRepository.update).toHaveBeenCalledTimes(1);
    expect(relationshipRepository.update).toHaveBeenCalledTimes(1);
    expect(syncLogRepository.update).toHaveBeenCalledWith(
      "generated-id-0",
      expect.objectContaining({
        status: "COMPLETED",
        resourcesRetired: 1,
      }),
    );
  });

  it("reactivates an inactive CONTAINS relationship when a resource reappears", async () => {
    const resourceAttributes = extractResourceAttributes(
      "compute",
      computeRawResource,
      region,
      compartmentName,
    );
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "resource-ci",
      ciClassId: "VIRTUAL_MACHINE-id",
      ciKey: computeResourceId,
      name: "vm-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: resourceAttributes,
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["compute", createComputeWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === computeResourceId) return existingResource;
      return null;
    });
    relationshipRepository.findByFromCi.mockResolvedValue([
      createExistingRelationship({
        id: "contains-rel",
        fromCiId: "compartment-ci",
        toCiId: "resource-ci",
        relationshipTypeId: "contains-id",
        isActive: false,
      }),
    ]);

    const result = await useCase.execute({
      serviceKeys: ["compute"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.relationshipsCreated).toBe(1);
    expect(relationshipRepository.update).toHaveBeenCalledTimes(1);
    expect(relationshipRepository.create).not.toHaveBeenCalled();
  });

  it("treats load balancer IP address objects as unchanged when only key order differs", async () => {
    const existingCompartment = createExistingConfigurationItem({
      id: "compartment-ci",
      ciClassId: "CLOUD_COMPARTMENT-id",
      ciKey: compartmentId,
      name: compartmentName,
      environment: "PROD",
      attributes: {
        OCI_ID: compartmentId,
        OCI_SERVICE_TYPE: "compartment",
      },
    });
    const existingResource = createExistingConfigurationItem({
      id: "lb-resource-ci",
      ciClassId: "LOAD_BALANCER-id",
      ciKey: lbResourceId,
      name: "lb-1",
      environment: "PROD",
      lifecycleStateId: "active-state-id",
      attributes: {
        ...extractResourceAttributes(
          "lb",
          lbRawResource,
          region,
          compartmentName,
        ),
        IP_ADDRESSES: [
          {
            "is-public": false,
            "ip-address": "10.100.3.11",
            "reserved-ip": null,
          },
        ],
      },
    });

    vi.mocked(webhookService.fetchAllServices).mockResolvedValue({
      source: defaultBatchSource,
      responses: new Map([["lb", createLoadBalancerWebhookResponse()]]),
      failures: [],
    });
    relationshipTypeRepository.findByCode.mockResolvedValue({
      id: "contains-id",
      code: "CONTAINS",
    });
    ciRepository.findByCiKey.mockImplementation(async (ciKey: string) => {
      if (ciKey === compartmentId) return existingCompartment;
      if (ciKey === lbResourceId) return existingResource;
      return null;
    });
    relationshipRepository.findByFromCi.mockResolvedValue([
      createExistingRelationship({
        id: "contains-rel",
        fromCiId: "compartment-ci",
        toCiId: "lb-resource-ci",
        relationshipTypeId: "contains-id",
      }),
    ]);

    const result = await useCase.execute({
      serviceKeys: ["lb"],
      triggeredBy: "reviewer@example.com",
    });

    expect(result.status).toBe("COMPLETED");
    expect(result.resourcesUpdated).toBe(0);
    expect(result.resourcesUnchanged).toBe(1);
    expect(ciRepository.update).not.toHaveBeenCalled();
  });
});

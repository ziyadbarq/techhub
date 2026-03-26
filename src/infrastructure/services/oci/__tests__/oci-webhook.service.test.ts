import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { OciWebhookService } from "../oci-webhook.service";
import type { ILoggerService } from "@/core/services/logger.service.interface";

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

describe("OciWebhookService", () => {
  const originalToken = process.env.OCI_WEBHOOK_TOKEN;
  const originalSource = process.env.OCI_SYNC_SOURCE;
  const originalLocalDataDir = process.env.OCI_LOCAL_DATA_DIR;
  const tempDir = join(process.cwd(), "local", "test-oci-data");

  beforeEach(() => {
    process.env.OCI_WEBHOOK_TOKEN = "test-token";
    delete process.env.OCI_SYNC_SOURCE;
    delete process.env.OCI_LOCAL_DATA_DIR;
    rmSync(tempDir, { recursive: true, force: true });
  });

  afterEach(() => {
    process.env.OCI_WEBHOOK_TOKEN = originalToken;
    process.env.OCI_SYNC_SOURCE = originalSource;
    process.env.OCI_LOCAL_DATA_DIR = originalLocalDataDir;
    rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("collapses endpoint-wide connectivity failures into a single warning", async () => {
    const logger = createMockLogger();
    const service = new OciWebhookService(logger);
    const dnsCause = Object.assign(
      new Error("getaddrinfo ENOTFOUND n8n.prod.barq.com"),
      {
        code: "ENOTFOUND",
        hostname: "n8n.prod.barq.com",
      },
    );

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValue(new TypeError("fetch failed", { cause: dnsCause })),
    );

    const result = await service.fetchAllServices(["compute", "dbsystems"]);

    expect(result.responses.size).toBe(0);
    expect(result.failures).toEqual([
      {
        serviceKeys: ["compute", "dbsystems"],
        kind: "network",
        message:
          "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
        code: "ENOTFOUND",
        hostname: "n8n.prod.barq.com",
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith(
      "OCI inventory endpoint unavailable — skipping remaining services",
      {
        kind: "network",
        statusCode: undefined,
        code: "ENOTFOUND",
        hostname: "n8n.prod.barq.com",
        failedServices: ["compute", "dbsystems"],
        failedCount: 2,
        message:
          "Unable to reach the OCI inventory endpoint. Check network or DNS access to n8n.prod.barq.com and try again.",
      },
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("loads OCI data from local snapshot files when OCI_SYNC_SOURCE=local", async () => {
    mkdirSync(tempDir, { recursive: true });
    process.env.OCI_SYNC_SOURCE = "local";
    process.env.OCI_LOCAL_DATA_DIR = tempDir;
    delete process.env.OCI_WEBHOOK_TOKEN;
    vi.stubGlobal("fetch", vi.fn());

    writeFileSync(
      join(tempDir, "oci-compute.json"),
      JSON.stringify({
        "object Object": [
          {
            generated_at: "2026-03-26T00:00:00.000Z",
            tenancyId: "ocid1.tenancy.oc1..example",
            regions: ["me-jeddah-1"],
            services: {
              compute: [
                {
                  id: "ocid1.compartment.oc1..compartmentA",
                  name: "cmp-prod-app",
                  total: 1,
                  regions: [
                    {
                      region: "me-jeddah-1",
                      count: 1,
                      items: [
                        {
                          id: "ocid1.instance.oc1..instanceA",
                          "display-name": "vm-a",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        ],
      }),
      "utf8",
    );

    const logger = createMockLogger();
    const service = new OciWebhookService(logger);
    const result = await service.fetchAllServices(["compute"]);

    expect(result.source).toEqual({
      mode: "local",
      attributeValue: "oci_local_file",
      description: "local OCI snapshot files",
      location: tempDir,
    });
    expect(result.responses.size).toBe(1);
    expect(result.failures).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps per-service warnings for non-global failures", async () => {
    const logger = createMockLogger();
    const service = new OciWebhookService(logger);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("upstream error"),
      } satisfies Partial<Response>),
    );

    const result = await service.fetchAllServices(["dbsystems"]);

    expect(result.responses.size).toBe(0);
    expect(result.failures).toEqual([
      {
        serviceKeys: ["dbsystems"],
        kind: "http",
        message:
          "OCI inventory endpoint returned HTTP 500 while fetching dbsystems.",
        code: undefined,
        hostname: undefined,
      },
    ]);
    expect(logger.warn).toHaveBeenCalledWith("OCI service fetch failed", {
      kind: "http",
      serviceKey: "dbsystems",
      statusCode: 500,
      code: undefined,
      hostname: undefined,
      message:
        "OCI inventory endpoint returned HTTP 500 while fetching dbsystems.",
    });
    expect(logger.error).not.toHaveBeenCalled();
  });
});

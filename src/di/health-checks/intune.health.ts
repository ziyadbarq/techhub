/**
 * Intune Health Check
 *
 * Validates Intune module dependencies and Graph API connectivity
 */

import { getContainer } from "../container";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import { DI_TOKENS } from "../types";
import { ModuleHealthStatus, type ModuleHealthCheck } from "../module-registry";

/**
 * Create Intune health check function
 */
export function createIntuneHealthCheck() {
  return async (): Promise<ModuleHealthCheck> => {
    const startTime = performance.now();

    try {
      const container = getContainer();
      const configService = container.get<IConfigService>(
        DI_TOKENS.IConfigService,
      );

      // Check if Microsoft Graph service is available (dependency)
      const graphService = container.get<IMicrosoftGraphService>(
        IMicrosoftGraphService,
      );

      if (!graphService) {
        return {
          moduleName: "intune",
          status: ModuleHealthStatus.UNHEALTHY,
          message: "Microsoft Graph service not available (dependency missing)",
          details: {
            durationMs: Math.round(performance.now() - startTime),
          },
          timestamp: new Date(),
        };
      }

      // Check if credentials are configured
      const [tenantId, clientId, clientSecret] = await Promise.all([
        configService.get("AZURE_TENANT_ID"),
        configService.get("AZURE_CLIENT_ID"),
        configService.get("AZURE_CLIENT_SECRET"),
      ]);

      if (!tenantId || !clientId || !clientSecret) {
        return {
          moduleName: "intune",
          status: ModuleHealthStatus.DEGRADED,
          message: "Intune requires Microsoft Graph credentials",
          details: {
            configured: false,
            durationMs: Math.round(performance.now() - startTime),
          },
          timestamp: new Date(),
        };
      }

      // Validate Intune API access (tests Intune-specific permissions)
      await graphService.testIntuneConnection();

      return {
        moduleName: "intune",
        status: ModuleHealthStatus.HEALTHY,
        message: "Intune module ready (Graph API accessible)",
        details: {
          configured: true,
          graphApiAccessible: true,
          durationMs: Math.round(performance.now() - startTime),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        moduleName: "intune",
        status: ModuleHealthStatus.UNHEALTHY,
        message:
          error instanceof Error
            ? error.message
            : "Intune module health check failed",
        details: {
          error: error instanceof Error ? error.stack : String(error),
          durationMs: Math.round(performance.now() - startTime),
        },
        timestamp: new Date(),
      };
    }
  };
}

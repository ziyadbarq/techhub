/**
 * Microsoft Graph Health Check
 *
 * Validates connectivity and authentication with Microsoft Graph API
 */

import { getContainer } from "../container";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { IConfigService } from "@/core/services/config.service.interface";
import { DI_TOKENS } from "../types";
import { ModuleHealthStatus, type ModuleHealthCheck } from "../module-registry";

/**
 * Create Microsoft Graph health check function
 */
export function createMicrosoftGraphHealthCheck() {
  return async (): Promise<ModuleHealthCheck> => {
    const startTime = performance.now();

    try {
      const container = getContainer();
      const configService = container.get<IConfigService>(
        DI_TOKENS.IConfigService,
      );
      const graphService = container.get<IMicrosoftGraphService>(
        IMicrosoftGraphService,
      );

      // Check if credentials are configured
      const [tenantId, clientId, clientSecret] = await Promise.all([
        configService.get("AZURE_TENANT_ID"),
        configService.get("AZURE_CLIENT_ID"),
        configService.get("AZURE_CLIENT_SECRET"),
      ]);

      if (!tenantId || !clientId || !clientSecret) {
        return {
          moduleName: "microsoft-graph",
          status: ModuleHealthStatus.DEGRADED,
          message: "Microsoft Graph credentials not configured",
          details: {
            configured: false,
            durationMs: Math.round(performance.now() - startTime),
          },
          timestamp: new Date(),
        };
      }

      // Test connection (validates credentials and connectivity)
      await graphService.testConnection();

      return {
        moduleName: "microsoft-graph",
        status: ModuleHealthStatus.HEALTHY,
        message: "Microsoft Graph API is accessible",
        details: {
          configured: true,
          durationMs: Math.round(performance.now() - startTime),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        moduleName: "microsoft-graph",
        status: ModuleHealthStatus.UNHEALTHY,
        message:
          error instanceof Error
            ? error.message
            : "Failed to connect to Microsoft Graph",
        details: {
          error: error instanceof Error ? error.stack : String(error),
          durationMs: Math.round(performance.now() - startTime),
        },
        timestamp: new Date(),
      };
    }
  };
}

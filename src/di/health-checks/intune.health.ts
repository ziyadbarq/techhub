/**
 * Intune Health Check
 *
 * Validates Intune module dependencies and Graph API connectivity
 */

import { getContainer } from "../container";
import { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import { ModuleHealthStatus, type ModuleHealthCheck } from "../module-registry";

/**
 * Create Intune health check function
 */
export function createIntuneHealthCheck() {
  return async (): Promise<ModuleHealthCheck> => {
    const startTime = performance.now();

    try {
      const container = getContainer();

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
      if (
        !process.env.MS_GRAPH_CLIENT_ID ||
        !process.env.MS_GRAPH_CLIENT_SECRET
      ) {
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

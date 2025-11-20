/**
 * Real-time Services DI Module
 *
 * Configures dependency injection bindings for real-time services:
 * - SSE Service (Server-Sent Events)
 * - Partykit Service (WebSocket)
 *
 * This module is imported by the main DI container.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { SSEService } from "@/infrastructure/services/sse/sse.service";
import { PartykitService } from "@/infrastructure/services/realtime/partykit.service";
import { BroadcastTaskEventUseCase } from "@/core/use-cases/realtime/broadcast-task-event.use-case";
import type { ISSEService, IRealtimeService } from "@/core/services";
import { logger } from "@/lib/logger";

const diLogger = logger.scope("DI");

/**
 * Binds real-time service dependencies to the DI container
 *
 * @param container - InversifyJS container instance
 */
export function bindRealtimeDependencies(container: Container): void {
  // Bind SSE Service
  container
    .bind<ISSEService>(DI_TOKENS.ISSEService)
    .to(SSEService)
    .inSingletonScope();

  // Bind Partykit Service
  // Note: This is a client-side service, so it will only work in browser context
  container
    .bind<IRealtimeService>(DI_TOKENS.IRealtimeService)
    .to(PartykitService)
    .inSingletonScope();

  // Bind Real-time Use Cases
  // Use cases MUST be transient to avoid state leakage between requests
  container
    .bind<BroadcastTaskEventUseCase>(DI_TOKENS.BroadcastTaskEventUseCase)
    .to(BroadcastTaskEventUseCase)
    .inTransientScope();

  diLogger.debug("bindRealtimeDependencies", "Real-time services registered");
}

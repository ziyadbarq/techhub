import { inject, injectable, multiInject } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { ConfigurationError } from "@/core/domain/workflow";
import type {
  IAutomationHandler,
  IAutomationHandlerRegistry,
} from "@/core/repositories/workflow";
import type { ILoggerService } from "@/core/services/logger.service.interface";

/**
 * Concrete registry that wraps the injected array of automation handlers and
 * exposes lookup-by-key. Configured in the workflow DI module: each handler
 * binds itself to `DI_TOKENS.IWorkflowAutomationHandler` and this registry
 * receives the full set via `multiInject`.
 */
@injectable()
export class WorkflowAutomationHandlerRegistry implements IAutomationHandlerRegistry {
  private readonly handlers: Map<string, IAutomationHandler>;
  private readonly logger: ILoggerService;

  constructor(
    @inject(DI_TOKENS.ILoggerService) logger: ILoggerService,
    @multiInject(DI_TOKENS.IWorkflowAutomationHandler)
    handlers: IAutomationHandler[],
  ) {
    this.logger = logger.child({
      service: "WorkflowAutomationHandlerRegistry",
    });
    this.handlers = new Map();
    for (const h of handlers) {
      if (this.handlers.has(h.key)) {
        this.logger.warn("duplicate automation handler key — last write wins", {
          key: h.key,
        });
      }
      this.handlers.set(h.key, h);
    }
    this.logger.debug("registered automation handlers", {
      keys: Array.from(this.handlers.keys()),
    });
  }

  get(key: string): IAutomationHandler {
    const h = this.handlers.get(key);
    if (!h) {
      throw new ConfigurationError(
        `No automation handler registered for key: ${key}`,
      );
    }
    return h;
  }
}

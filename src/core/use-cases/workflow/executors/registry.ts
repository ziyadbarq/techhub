/**
 * Workflow Step Executor Registry
 *
 * Looks up the executor for a given step type. Backed by all
 * `IStepExecutor` bindings registered under `DI_TOKENS.IWorkflowStepExecutor`,
 * collected via `@multiInject` and indexed by their `type` property.
 */

import { injectable, multiInject } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { ConfigurationError } from "@/core/domain/workflow";
import type { StepConfig } from "@/core/domain/workflow";
import type {
  IStepExecutor,
  IStepExecutorRegistry,
} from "@/core/repositories/workflow";

@injectable()
export class WorkflowStepExecutorRegistry implements IStepExecutorRegistry {
  private readonly executors = new Map<StepConfig["type"], IStepExecutor>();

  constructor(
    @multiInject(DI_TOKENS.IWorkflowStepExecutor)
    executors: IStepExecutor[],
  ) {
    for (const executor of executors) {
      this.executors.set(executor.type, executor);
    }
  }

  get(type: StepConfig["type"]): IStepExecutor {
    const executor = this.executors.get(type);
    if (!executor) {
      throw new ConfigurationError(`Unknown step type: ${type}`);
    }
    return executor;
  }
}

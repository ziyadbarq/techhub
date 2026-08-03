import type {
  ActionKind,
  ActorContext,
  AssigneeSpec,
  StepConfig,
} from "@/core/domain/workflow";
import type { Tx } from "./types";

export interface ExecCtx {
  tx: Tx;
  ctx: ActorContext;
  requestId: string;
  stepInstanceId: string;
  fieldValues: Record<string, unknown>;
}

export type ActivationResult =
  | { kind: "ACTIVE" }
  | { kind: "AUTO_COMPLETE"; nextStepKey?: string }
  | { kind: "AUTO_FAIL"; reason: string };

export type ActionResult =
  | { kind: "RECORDED" } // recorded but step not yet ready to advance
  | { kind: "ADVANCE"; nextStepKey?: string }
  | { kind: "REJECT" }
  | { kind: "RETURN_TO_REQUESTER" };

export interface IStepExecutor {
  readonly type: StepConfig["type"];
  activate(config: StepConfig, exec: ExecCtx): Promise<ActivationResult>;
  handleAction(
    config: StepConfig,
    action: ActionKind,
    exec: ExecCtx,
  ): Promise<ActionResult>;
}

export interface IAssigneeResolver {
  readonly kind: AssigneeSpec["kind"];
  resolve(
    spec: AssigneeSpec,
    exec: ExecCtx & { requesterId: string },
  ): Promise<string[]>;
}

export interface IAutomationHandler {
  readonly key: string;
  run(
    args: Record<string, unknown>,
    exec: ExecCtx,
  ): Promise<{ fieldUpdates?: Record<string, unknown>; advance: boolean }>;
}

/**
 * Registry interfaces used by the engine to discover executors / resolvers /
 * automation handlers at runtime. The DI module binds concrete arrays;
 * registries expose lookup-by-key.
 */
export interface IStepExecutorRegistry {
  get(type: StepConfig["type"]): IStepExecutor;
}

export interface IAssigneeResolverRegistry {
  get(kind: AssigneeSpec["kind"]): IAssigneeResolver;
}

export interface IAutomationHandlerRegistry {
  get(key: string): IAutomationHandler;
}

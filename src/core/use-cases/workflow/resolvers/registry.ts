/**
 * Workflow Assignee Resolver Registry
 *
 * Looks up the resolver for a given assignee `kind`. Backed by all
 * `IAssigneeResolver` bindings registered under
 * `DI_TOKENS.IWorkflowAssigneeResolver`, collected via `@multiInject` and
 * indexed by their `kind` property.
 */

import { injectable, multiInject } from "inversify";

import { DI_TOKENS } from "@/di/types";
import { ConfigurationError } from "@/core/domain/workflow";
import type { AssigneeSpec } from "@/core/domain/workflow";
import type {
  IAssigneeResolver,
  IAssigneeResolverRegistry,
} from "@/core/repositories/workflow";

@injectable()
export class WorkflowAssigneeResolverRegistry implements IAssigneeResolverRegistry {
  private readonly resolvers = new Map<
    AssigneeSpec["kind"],
    IAssigneeResolver
  >();

  constructor(
    @multiInject(DI_TOKENS.IWorkflowAssigneeResolver)
    resolvers: IAssigneeResolver[],
  ) {
    for (const resolver of resolvers) {
      this.resolvers.set(resolver.kind, resolver);
    }
  }

  get(kind: AssigneeSpec["kind"]): IAssigneeResolver {
    const resolver = this.resolvers.get(kind);
    if (!resolver) {
      throw new ConfigurationError(
        `No assignee resolver registered for kind: ${kind}`,
      );
    }
    return resolver;
  }
}

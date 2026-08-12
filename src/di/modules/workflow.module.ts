/**
 * Workflow Engine Module - DI Bindings
 *
 * Binds the generic workflow-engine: forms, workflow definitions, requests,
 * step instances, audit trail, SLA, notifications, and the full executor /
 * resolver / automation handler registries.
 *
 * Tier: CORE (always loaded)
 * Feature flag: WORKFLOW_ENGINE (loader skips binding when off)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// ============================================================================
// Repository interfaces
// ============================================================================
import type {
  IWorkflowFormRepository,
  IWorkflowDefinitionRepository,
  IWorkflowRequestRepository,
  IWorkflowStepInstanceRepository,
  IWorkflowAuditRepository,
  IWorkflowSLAEventRepository,
  IWorkflowEngine,
  IStepExecutor,
  IAssigneeResolver,
  IAutomationHandler,
  IStepExecutorRegistry,
  IAssigneeResolverRegistry,
  IAutomationHandlerRegistry,
} from "@/core/repositories/workflow";

// ============================================================================
// Prisma repository implementations
// ============================================================================
import { PrismaWorkflowFormRepository } from "@/infrastructure/repositories/prisma-workflow-form.repository";
import { PrismaWorkflowDefinitionRepository } from "@/infrastructure/repositories/prisma-workflow-definition.repository";
import { PrismaWorkflowRequestRepository } from "@/infrastructure/repositories/prisma-workflow-request.repository";
import { PrismaWorkflowStepInstanceRepository } from "@/infrastructure/repositories/prisma-workflow-step-instance.repository";
import { PrismaWorkflowAuditRepository } from "@/infrastructure/repositories/prisma-workflow-audit.repository";
import { PrismaWorkflowSLAEventRepository } from "@/infrastructure/repositories/prisma-workflow-sla-event.repository";
import { PrismaAccessServiceRepository } from "@/infrastructure/repositories/prisma-access-service.repository";
import { PrismaAccessServiceSnapshotRepository } from "@/infrastructure/repositories/prisma-access-service-snapshot.repository";
import { PrismaRequesterIdentitySnapshotRepository } from "@/infrastructure/repositories/prisma-requester-identity-snapshot.repository";
import type {
  IAccessServiceRepository,
  IAccessServiceSnapshotRepository,
  IRequesterIdentitySnapshotRepository,
} from "@/core/repositories/workflow/access-service.repository.interface";
import type {
  ILookupProvider,
  ILookupProviderRegistry,
} from "@/core/domain/workflow/lookup-provider.interface";
import { AccessServiceLookupProvider } from "@/infrastructure/services/workflow/lookup-providers/access-service.lookup-provider";
import { LookupProviderRegistry } from "@/infrastructure/services/workflow/lookup-providers/registry";

// ============================================================================
// Services + interfaces
// ============================================================================
import {
  CalendarService,
  type ICalendarService,
} from "@/infrastructure/services/workflow/calendar.service";
import {
  DelegationResolverService,
  type IDelegationResolver,
} from "@/infrastructure/services/workflow/delegation-resolver.service";
import {
  EmailActionTokensService,
  type IEmailActionTokenService,
} from "@/infrastructure/services/workflow/email-action-tokens.service";
import {
  EntryAutomationService,
  type IEntryAutomationService,
} from "@/infrastructure/services/workflow/entry-automation.service";
import {
  ExpressionEvaluatorService,
  type IExpressionEvaluator,
} from "@/infrastructure/services/workflow/expression-evaluator.service";
import {
  NotificationService,
  type INotificationService,
} from "@/infrastructure/services/workflow/notification.service";
import {
  ReferenceNumberService,
  type IReferenceNumberService,
} from "@/infrastructure/services/workflow/reference-numbers.service";
import {
  ScheduleTickService,
  type IScheduleTickService,
} from "@/infrastructure/services/workflow/schedule-tick.service";
import {
  SLACalculatorService,
  type ISLACalculator,
} from "@/infrastructure/services/workflow/sla-calculator.service";
import {
  SLAEscalatorService,
  type ISLAEscalator,
} from "@/infrastructure/services/workflow/sla-escalator.service";
import {
  TemplateRendererService,
  type ITemplateRenderer,
} from "@/infrastructure/services/workflow/template-renderer.service";

// ============================================================================
// Automation handlers + registry
// ============================================================================
import { AutoApproveHandler } from "@/infrastructure/services/workflow/handlers/auto-approve.handler";
import { SetFieldHandler } from "@/infrastructure/services/workflow/handlers/set-field.handler";
import { GenerateReferenceNumberHandler } from "@/infrastructure/services/workflow/handlers/generate-reference-number.handler";
import { WorkflowAutomationHandlerRegistry } from "@/infrastructure/services/workflow/handlers/registry";

// ============================================================================
// Step executors + registry
// ============================================================================
import { ApprovalStepExecutor } from "@/core/use-cases/workflow/executors/approval.executor";
import { ExecutionStepExecutor } from "@/core/use-cases/workflow/executors/execution.executor";
import { InfoAckStepExecutor } from "@/core/use-cases/workflow/executors/info-ack.executor";
import { AutomationStepExecutor } from "@/core/use-cases/workflow/executors/automation.executor";
import { NotificationStepExecutor } from "@/core/use-cases/workflow/executors/notification.executor";
import { ConditionalBranchStepExecutor } from "@/core/use-cases/workflow/executors/conditional-branch.executor";
import { DelayStepExecutor } from "@/core/use-cases/workflow/executors/delay.executor";
import { ScheduleStepExecutor } from "@/core/use-cases/workflow/executors/schedule.executor";
import { SubWorkflowStepExecutor } from "@/core/use-cases/workflow/executors/sub-workflow.executor";
import { WaitForEventStepExecutor } from "@/core/use-cases/workflow/executors/wait-for-event.executor";
import { WebhookStepExecutor } from "@/core/use-cases/workflow/executors/webhook.executor";
import { WorkflowStepExecutorRegistry } from "@/core/use-cases/workflow/executors/registry";

// ============================================================================
// Assignee resolvers + registry
// ============================================================================
import { UserAssigneeResolver } from "@/core/use-cases/workflow/resolvers/user.resolver";
import { RoleAssigneeResolver } from "@/core/use-cases/workflow/resolvers/role.resolver";
import { RequesterAssigneeResolver } from "@/core/use-cases/workflow/resolvers/requester.resolver";
import { FieldUserAssigneeResolver } from "@/core/use-cases/workflow/resolvers/field-user.resolver";
import { RequesterManagerAssigneeResolver } from "@/core/use-cases/workflow/resolvers/requester-manager.resolver";
import { AccessServiceRoleAssigneeResolver } from "@/core/use-cases/workflow/resolvers/access-service-role.resolver";
import { FallbackAssigneeResolver } from "@/core/use-cases/workflow/resolvers/fallback.resolver";

// ============================================================================
// Access Service use cases
// ============================================================================
import { CreateAccessServiceUseCase } from "@/core/use-cases/access-service/create-access-service.use-case";
import { UpdateAccessServiceUseCase } from "@/core/use-cases/access-service/update-access-service.use-case";
import { ListAccessServicesUseCase } from "@/core/use-cases/access-service/list-access-services.use-case";
import { GetAccessServiceUseCase } from "@/core/use-cases/access-service/get-access-service.use-case";
import { ToggleAccessServiceStatusUseCase } from "@/core/use-cases/access-service/toggle-access-service-status.use-case";
import { ImportAccessServicesUseCase } from "@/core/use-cases/access-service/import-access-services.use-case";
import { ExportAccessServicesUseCase } from "@/core/use-cases/access-service/export-access-services.use-case";
import { WorkflowAssigneeResolverRegistry } from "@/core/use-cases/workflow/resolvers/registry";

// ============================================================================
// Engine orchestrator + use cases
// ============================================================================
import { WorkflowEngine } from "@/core/use-cases/workflow/engine/workflow-engine.use-case";
import { WorkflowSubmitUseCase } from "@/core/use-cases/workflow/engine/submit.use-case";
import { WorkflowTakeActionUseCase } from "@/core/use-cases/workflow/engine/take-action.use-case";
import { WorkflowResubmitUseCase } from "@/core/use-cases/workflow/engine/resubmit.use-case";
import { WorkflowPlaceOnHoldUseCase } from "@/core/use-cases/workflow/engine/place-on-hold.use-case";
import { WorkflowResumeUseCase } from "@/core/use-cases/workflow/engine/resume.use-case";
import { WorkflowCancelUseCase } from "@/core/use-cases/workflow/engine/cancel.use-case";
import { WorkflowRejectUseCase } from "@/core/use-cases/workflow/engine/reject.use-case";
import { WorkflowReassignUseCase } from "@/core/use-cases/workflow/engine/reassign.use-case";
import { WorkflowForceAdvanceUseCase } from "@/core/use-cases/workflow/engine/force-advance.use-case";
import { WorkflowOverrideOutcomeUseCase } from "@/core/use-cases/workflow/engine/override-outcome.use-case";

const diLogger = logger.scope("DI:WorkflowModule");

export function bindWorkflowDependencies(container: Container): void {
  diLogger.debug(
    "bindWorkflowDependencies",
    "Binding workflow dependencies...",
  );

  // --------------------------------------------------------------------------
  // Repositories (singleton)
  // --------------------------------------------------------------------------
  container
    .bind<IWorkflowFormRepository>(DI_TOKENS.IWorkflowFormRepository)
    .to(PrismaWorkflowFormRepository)
    .inSingletonScope();
  container
    .bind<IWorkflowDefinitionRepository>(
      DI_TOKENS.IWorkflowDefinitionRepository,
    )
    .to(PrismaWorkflowDefinitionRepository)
    .inSingletonScope();
  container
    .bind<IWorkflowRequestRepository>(DI_TOKENS.IWorkflowRequestRepository)
    .to(PrismaWorkflowRequestRepository)
    .inSingletonScope();
  container
    .bind<IWorkflowStepInstanceRepository>(
      DI_TOKENS.IWorkflowStepInstanceRepository,
    )
    .to(PrismaWorkflowStepInstanceRepository)
    .inSingletonScope();
  container
    .bind<IWorkflowAuditRepository>(DI_TOKENS.IWorkflowAuditRepository)
    .to(PrismaWorkflowAuditRepository)
    .inSingletonScope();
  container
    .bind<IWorkflowSLAEventRepository>(DI_TOKENS.IWorkflowSLAEventRepository)
    .to(PrismaWorkflowSLAEventRepository)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Services (singleton)
  // --------------------------------------------------------------------------
  container
    .bind<ICalendarService>(DI_TOKENS.IWorkflowCalendarService)
    .to(CalendarService)
    .inSingletonScope();
  container
    .bind<IDelegationResolver>(DI_TOKENS.IWorkflowDelegationResolver)
    .to(DelegationResolverService)
    .inSingletonScope();
  container
    .bind<IEmailActionTokenService>(DI_TOKENS.IWorkflowEmailActionTokenService)
    .to(EmailActionTokensService)
    .inSingletonScope();
  container
    .bind<IEntryAutomationService>(DI_TOKENS.IWorkflowEntryAutomationService)
    .to(EntryAutomationService)
    .inSingletonScope();
  container
    .bind<IExpressionEvaluator>(DI_TOKENS.IWorkflowExpressionEvaluator)
    .to(ExpressionEvaluatorService)
    .inSingletonScope();
  container
    .bind<INotificationService>(DI_TOKENS.IWorkflowNotificationService)
    .to(NotificationService)
    .inSingletonScope();
  container
    .bind<IReferenceNumberService>(DI_TOKENS.IWorkflowReferenceNumberService)
    .to(ReferenceNumberService)
    .inSingletonScope();
  container
    .bind<IScheduleTickService>(DI_TOKENS.IWorkflowScheduleTickService)
    .to(ScheduleTickService)
    .inSingletonScope();
  container
    .bind<ISLACalculator>(DI_TOKENS.IWorkflowSLACalculator)
    .to(SLACalculatorService)
    .inSingletonScope();
  container
    .bind<ISLAEscalator>(DI_TOKENS.IWorkflowSLAEscalator)
    .to(SLAEscalatorService)
    .inSingletonScope();
  container
    .bind<ITemplateRenderer>(DI_TOKENS.IWorkflowTemplateRenderer)
    .to(TemplateRendererService)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Automation handlers (multi-inject) + registry
  // --------------------------------------------------------------------------
  container
    .bind<IAutomationHandler>(DI_TOKENS.IWorkflowAutomationHandler)
    .to(AutoApproveHandler);
  container
    .bind<IAutomationHandler>(DI_TOKENS.IWorkflowAutomationHandler)
    .to(SetFieldHandler);
  container
    .bind<IAutomationHandler>(DI_TOKENS.IWorkflowAutomationHandler)
    .to(GenerateReferenceNumberHandler);
  container
    .bind<IAutomationHandlerRegistry>(
      DI_TOKENS.IWorkflowAutomationHandlerRegistry,
    )
    .to(WorkflowAutomationHandlerRegistry)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Step executors (multi-inject) + registry
  // --------------------------------------------------------------------------
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(ApprovalStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(ExecutionStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(InfoAckStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(AutomationStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(NotificationStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(ConditionalBranchStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(DelayStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(ScheduleStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(SubWorkflowStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(WaitForEventStepExecutor);
  container
    .bind<IStepExecutor>(DI_TOKENS.IWorkflowStepExecutor)
    .to(WebhookStepExecutor);
  container
    .bind<IStepExecutorRegistry>(DI_TOKENS.IWorkflowStepExecutorRegistry)
    .to(WorkflowStepExecutorRegistry)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Assignee resolvers (multi-inject) + registry
  // --------------------------------------------------------------------------
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(UserAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(RoleAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(RequesterAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(FieldUserAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(RequesterManagerAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(AccessServiceRoleAssigneeResolver);
  container
    .bind<IAssigneeResolver>(DI_TOKENS.IWorkflowAssigneeResolver)
    .to(FallbackAssigneeResolver);
  container
    .bind<IAssigneeResolverRegistry>(
      DI_TOKENS.IWorkflowAssigneeResolverRegistry,
    )
    .to(WorkflowAssigneeResolverRegistry)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Engine use cases (transient — per-request execution)
  // --------------------------------------------------------------------------
  container
    .bind<WorkflowSubmitUseCase>(DI_TOKENS.WorkflowSubmitUseCase)
    .to(WorkflowSubmitUseCase);
  container
    .bind<WorkflowTakeActionUseCase>(DI_TOKENS.WorkflowTakeActionUseCase)
    .to(WorkflowTakeActionUseCase);
  container
    .bind<WorkflowResubmitUseCase>(DI_TOKENS.WorkflowResubmitUseCase)
    .to(WorkflowResubmitUseCase);
  container
    .bind<WorkflowPlaceOnHoldUseCase>(DI_TOKENS.WorkflowPlaceOnHoldUseCase)
    .to(WorkflowPlaceOnHoldUseCase);
  container
    .bind<WorkflowResumeUseCase>(DI_TOKENS.WorkflowResumeUseCase)
    .to(WorkflowResumeUseCase);
  container
    .bind<WorkflowCancelUseCase>(DI_TOKENS.WorkflowCancelUseCase)
    .to(WorkflowCancelUseCase);
  container
    .bind<WorkflowRejectUseCase>(DI_TOKENS.WorkflowRejectUseCase)
    .to(WorkflowRejectUseCase);
  container
    .bind<WorkflowReassignUseCase>(DI_TOKENS.WorkflowReassignUseCase)
    .to(WorkflowReassignUseCase);
  container
    .bind<WorkflowForceAdvanceUseCase>(DI_TOKENS.WorkflowForceAdvanceUseCase)
    .to(WorkflowForceAdvanceUseCase);
  container
    .bind<WorkflowOverrideOutcomeUseCase>(
      DI_TOKENS.WorkflowOverrideOutcomeUseCase,
    )
    .to(WorkflowOverrideOutcomeUseCase);

  // --------------------------------------------------------------------------
  // Access Management Services — repositories
  // --------------------------------------------------------------------------
  container
    .bind<IAccessServiceRepository>(DI_TOKENS.IAccessServiceRepository)
    .to(PrismaAccessServiceRepository)
    .inSingletonScope();
  container
    .bind<IAccessServiceSnapshotRepository>(
      DI_TOKENS.IAccessServiceSnapshotRepository,
    )
    .to(PrismaAccessServiceSnapshotRepository)
    .inSingletonScope();
  container
    .bind<IRequesterIdentitySnapshotRepository>(
      DI_TOKENS.IRequesterIdentitySnapshotRepository,
    )
    .to(PrismaRequesterIdentitySnapshotRepository)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Access Management Services — lookup provider + registry
  // --------------------------------------------------------------------------
  container
    .bind<ILookupProvider>(DI_TOKENS.IWorkflowLookupProvider)
    .to(AccessServiceLookupProvider)
    .inSingletonScope();
  container
    .bind<ILookupProviderRegistry>(DI_TOKENS.IWorkflowLookupProviderRegistry)
    .to(LookupProviderRegistry)
    .inSingletonScope();

  // --------------------------------------------------------------------------
  // Access Management Services — use cases
  // --------------------------------------------------------------------------
  container
    .bind<CreateAccessServiceUseCase>(DI_TOKENS.CreateAccessServiceUseCase)
    .to(CreateAccessServiceUseCase);
  container
    .bind<UpdateAccessServiceUseCase>(DI_TOKENS.UpdateAccessServiceUseCase)
    .to(UpdateAccessServiceUseCase);
  container
    .bind<ListAccessServicesUseCase>(DI_TOKENS.ListAccessServicesUseCase)
    .to(ListAccessServicesUseCase);
  container
    .bind<GetAccessServiceUseCase>(DI_TOKENS.GetAccessServiceUseCase)
    .to(GetAccessServiceUseCase);
  container
    .bind<ToggleAccessServiceStatusUseCase>(
      DI_TOKENS.ToggleAccessServiceStatusUseCase,
    )
    .to(ToggleAccessServiceStatusUseCase);
  container
    .bind<ImportAccessServicesUseCase>(DI_TOKENS.ImportAccessServicesUseCase)
    .to(ImportAccessServicesUseCase);
  container
    .bind<ExportAccessServicesUseCase>(DI_TOKENS.ExportAccessServicesUseCase)
    .to(ExportAccessServicesUseCase);

  // The engine orchestrator (singleton — composes use cases + shared helpers)
  container
    .bind<IWorkflowEngine>(DI_TOKENS.IWorkflowEngine)
    .to(WorkflowEngine)
    .inSingletonScope();

  diLogger.debug("bindWorkflowDependencies", "Workflow dependencies bound");
}

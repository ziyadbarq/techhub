import type { StepDefinition } from "@/core/domain/workflow";

/** What the engine needs from the service snapshot to decide. */
export interface ServiceSnapshotFacts {
  serviceName: string;
  requireManagerApproval: boolean;
}

export interface SkipDecision {
  reason: "SERVICE_DOES_NOT_REQUIRE_MANAGER_APPROVAL";
  serviceName: string;
  serviceFieldKey: string;
}

/** The service field a step depends on, if any. */
export function serviceFieldGatingStep(def: StepDefinition): string | null {
  if (def.config.type !== "APPROVAL") return null;
  const key = def.config.onlyWhenServiceRequiresManagerApproval?.trim();
  return key ? key : null;
}

/**
 * Should this step be skipped instead of activated?
 *
 * Fails safe: with no snapshot (field left empty, or not a service lookup)
 * the step runs, so a misconfiguration asks for one approval too many rather
 * than letting a request through without one.
 */
export function decideConditionalSkip(
  def: StepDefinition,
  snapshot: ServiceSnapshotFacts | null,
): SkipDecision | null {
  const serviceFieldKey = serviceFieldGatingStep(def);
  if (!serviceFieldKey || !snapshot) return null;
  if (snapshot.requireManagerApproval) return null;
  return {
    reason: "SERVICE_DOES_NOT_REQUIRE_MANAGER_APPROVAL",
    serviceName: snapshot.serviceName,
    serviceFieldKey,
  };
}

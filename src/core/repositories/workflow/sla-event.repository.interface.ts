import type { Tx } from "./types";

export type SLAEventTypeName = "START" | "PAUSE" | "RESUME" | "BREACH";

export interface IWorkflowSLAEventRepository {
  append(
    tx: Tx,
    input: {
      stepInstanceId: string;
      eventType: SLAEventTypeName;
      payload?: Record<string, unknown>;
      occurredAt?: Date;
    },
  ): Promise<void>;
  list(
    tx: Tx,
    stepInstanceId: string,
  ): Promise<Array<{ eventType: SLAEventTypeName; occurredAt: Date }>>;
}

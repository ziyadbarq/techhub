/**
 * CMDB Data Quality Use Cases
 *
 * Barrel export for data quality analysis use cases.
 */

export { DetectStaleCIsUseCase } from "./detect-stale-cis.use-case";
export type {
  DetectStaleCIsRequest,
  DetectStaleCIsResult,
  StaleCIRecord,
} from "./detect-stale-cis.use-case";

export { GetCMDBHealthMetricsUseCase } from "./get-cmdb-health-metrics.use-case";
export type { CMDBHealthMetrics } from "./get-cmdb-health-metrics.use-case";

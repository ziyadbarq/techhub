/**
 * CMDB Health Repository Interface
 *
 * Provides aggregate query methods for CMDB data quality metrics.
 */

export interface CIsByClassRecord {
  ciClassId: string;
  ciClassName: string;
  count: number;
}

export interface GroupByRecord {
  key: string | null;
  count: number;
}

export interface ICMDBHealthRepository {
  /** Count active CIs (excluding soft-deleted) */
  countActiveCIs(): Promise<number>;

  /** Count active CI relationships */
  countActiveRelationships(): Promise<number>;

  /** Count active CI classes (excluding soft-deleted) */
  countActiveCIClasses(): Promise<number>;

  /** Count CIs without any owner (no person AND no org unit) */
  countCIsWithoutOwner(): Promise<number>;

  /** Count CIs without lifecycle state */
  countCIsWithoutLifecycleState(): Promise<number>;

  /** Count CIs without criticality */
  countCIsWithoutCriticality(): Promise<number>;

  /** Count CIs not updated since the given date */
  countStaleCIs(olderThan: Date): Promise<number>;

  /** Count CIs with no relationships (orphans) */
  countOrphanCIs(): Promise<number>;

  /** Count CIs missing required fields defined by their CI class */
  countCIsMissingRequiredFields(): Promise<number>;

  /** Get CI counts grouped by class */
  getCIsByClass(): Promise<CIsByClassRecord[]>;

  /** Get CI counts grouped by criticality */
  getCIsByCriticality(): Promise<GroupByRecord[]>;

  /** Get CI counts grouped by environment */
  getCIsByEnvironment(): Promise<GroupByRecord[]>;
}

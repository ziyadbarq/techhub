import type { Tx } from "@/core/repositories/workflow/types";

/**
 * Display-safe public metadata returned by a lookup provider.
 * Each registered provider defines which keys appear here.
 * Private data (assignee IDs, internal config) must NEVER be exposed.
 */
export interface LookupPublicMetadata {
  [key: string]: string | number | boolean | null | undefined;
}

/** A single option returned by a lookup data source */
export interface LookupOption {
  id: string;
  label: string;
  publicMetadata: LookupPublicMetadata;
}

export interface LookupValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Generic interface for dynamic lookup data sources used in Form Builder
 * LOOKUP fields with `config.dataSource` set to a registered provider key.
 *
 * Implementations:
 *  - ACCESS_SERVICES → AccessServiceLookupProvider
 *
 * To add a new lookup source, implement this interface, register it
 * under DI_TOKENS.IWorkflowLookupProvider (multiInject), and its `key`
 * will be automatically available in the Form Builder dropdown.
 */
export interface ILookupProvider {
  /** Stable key used in FormField config.dataSource (e.g. "ACCESS_SERVICES") */
  readonly key: string;

  /**
   * Search / autocomplete — called by the client combobox.
   * Must respect eligibility filtering for the given user.
   */
  search(
    query: string,
    userId: string,
    limit: number,
    tx?: Tx,
  ): Promise<LookupOption[]>;

  /** Resolve a single option by ID — used for label hydration */
  findById(id: string, userId: string, tx?: Tx): Promise<LookupOption | null>;

  /**
   * Server-side authoritative validation called during submission.
   * Must verify: existence, active status, and eligibility.
   */
  validate(
    id: string,
    userId: string,
    tx?: Tx,
  ): Promise<LookupValidationResult>;

  /** Whether this user may access this specific record */
  isEligible(id: string, userId: string, tx?: Tx): Promise<boolean>;
}

export interface ILookupProviderRegistry {
  get(key: string): ILookupProvider;
  has(key: string): boolean;
  keys(): string[];
}

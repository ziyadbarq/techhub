/**
 * IntuneComplianceHistory Entity
 *
 * Tracks historical compliance state changes for Intune devices.
 * Used for SAMA governance reporting and compliance trend analysis.
 */

import type { IntuneComplianceState } from "./intune-device.entity";

export interface IntuneComplianceHistoryProps {
  id: string;
  intuneDeviceId: string;
  previousState: IntuneComplianceState;
  newState: IntuneComplianceState;
  changedAt: Date;
  policyName: string | null;
  policyId: string | null;
  reason: string | null;
}

export interface CreateIntuneComplianceHistoryProps {
  intuneDeviceId: string;
  previousState: IntuneComplianceState;
  newState: IntuneComplianceState;
  policyName?: string | null;
  policyId?: string | null;
  reason?: string | null;
}

export class IntuneComplianceHistory {
  private constructor(private props: IntuneComplianceHistoryProps) {
    this.validate();
  }

  /**
   * Factory method to create a new compliance history entry
   */
  static create(
    props: CreateIntuneComplianceHistoryProps,
  ): IntuneComplianceHistory {
    if (!props.intuneDeviceId?.trim()) {
      throw new Error("Intune Device ID is required");
    }

    return new IntuneComplianceHistory({
      id: crypto.randomUUID(),
      intuneDeviceId: props.intuneDeviceId,
      previousState: props.previousState,
      newState: props.newState,
      changedAt: new Date(),
      policyName: props.policyName?.trim() || null,
      policyId: props.policyId?.trim() || null,
      reason: props.reason?.trim() || null,
    });
  }

  /**
   * Factory method to reconstitute an existing entry from persistence
   */
  static reconstitute(
    props: IntuneComplianceHistoryProps,
  ): IntuneComplianceHistory {
    return new IntuneComplianceHistory(props);
  }

  /**
   * Check if this was a transition to non-compliant state
   */
  becameNonCompliant(): boolean {
    return (
      this.props.previousState === "COMPLIANT" &&
      this.props.newState === "NON_COMPLIANT"
    );
  }

  /**
   * Check if this was a transition to compliant state
   */
  becameCompliant(): boolean {
    return (
      this.props.previousState !== "COMPLIANT" &&
      this.props.newState === "COMPLIANT"
    );
  }

  /**
   * Validate entity properties
   */
  private validate(): void {
    if (!this.props.id) {
      throw new Error("ID is required");
    }
    if (!this.props.intuneDeviceId) {
      throw new Error("Intune Device ID is required");
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get intuneDeviceId(): string {
    return this.props.intuneDeviceId;
  }

  get previousState(): IntuneComplianceState {
    return this.props.previousState;
  }

  get newState(): IntuneComplianceState {
    return this.props.newState;
  }

  get changedAt(): Date {
    return this.props.changedAt;
  }

  get policyName(): string | null {
    return this.props.policyName;
  }

  get policyId(): string | null {
    return this.props.policyId;
  }

  get reason(): string | null {
    return this.props.reason;
  }

  /**
   * Convert entity to plain object for persistence
   */
  toObject(): IntuneComplianceHistoryProps {
    return { ...this.props };
  }
}

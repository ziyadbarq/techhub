/**
 * AuditLog Entity
 * Domain entity representing an audit log entry
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface AuditLogProps {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export class AuditLog {
  private constructor(private readonly props: AuditLogProps) {}

  static create(
    props: Omit<AuditLogProps, "id" | "createdAt">,
    idGenerator: IIdGenerator,
  ): AuditLog {
    return new AuditLog({
      ...props,
      id: idGenerator.generateId(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get action(): string {
    return this.props.action;
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get entityId(): string | undefined {
    return this.props.entityId;
  }

  get changes(): Record<string, unknown> | undefined {
    return this.props.changes;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get ipAddress(): string | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | undefined {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): AuditLogProps {
    return { ...this.props };
  }
}

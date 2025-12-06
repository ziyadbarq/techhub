/**
 * UserPreferences Entity
 * Represents user-specific preferences for display and notifications
 */

import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface NotificationPreferences {
  emailNotifications: boolean;
  teamsNotifications: boolean;
  whatsappNotifications: boolean;
  weeklyDigest: boolean;
  assetAlerts: boolean;
  approvalAlerts: boolean;
  warrantyAlerts: boolean;
}

export interface UserPreferencesProps {
  id: string;
  userId: string;
  timezone: string;
  dateFormat: string;
  currencyDisplay: string;
  notifications: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreferences {
  private constructor(private readonly props: UserPreferencesProps) {
    this.validate();
  }

  private validate(): void {
    if (!this.props.userId || this.props.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!this.props.timezone || this.props.timezone.trim().length === 0) {
      throw new Error("Timezone is required");
    }

    if (!this.props.dateFormat || this.props.dateFormat.trim().length === 0) {
      throw new Error("Date format is required");
    }

    if (
      !this.props.currencyDisplay ||
      this.props.currencyDisplay.trim().length === 0
    ) {
      throw new Error("Currency display is required");
    }

    // Validate currency display options
    const validCurrencyDisplays = ["dual", "sar", "usd"];
    if (!validCurrencyDisplays.includes(this.props.currencyDisplay)) {
      throw new Error(
        `Currency display must be one of: ${validCurrencyDisplays.join(", ")}`,
      );
    }
  }

  // Factory method for creating new user preferences
  static create(
    params: {
      userId: string;
      timezone?: string;
      dateFormat?: string;
      currencyDisplay?: string;
      notifications?: Partial<NotificationPreferences>;
    },
    idGenerator: IIdGenerator,
  ): UserPreferences {
    const now = new Date();
    const defaultNotifications: NotificationPreferences = {
      emailNotifications: true,
      teamsNotifications: false,
      whatsappNotifications: false,
      weeklyDigest: true,
      assetAlerts: true,
      approvalAlerts: true,
      warrantyAlerts: true,
    };

    return new UserPreferences({
      id: idGenerator.generateId(),
      userId: params.userId,
      timezone: params.timezone ?? "Asia/Riyadh",
      dateFormat: params.dateFormat ?? "dd/MM/yyyy",
      currencyDisplay: params.currencyDisplay ?? "dual",
      notifications: {
        ...defaultNotifications,
        ...params.notifications,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  // Factory method for reconstructing from database
  static fromPersistence(data: UserPreferencesProps): UserPreferences {
    return new UserPreferences(data);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get dateFormat(): string {
    return this.props.dateFormat;
  }

  get currencyDisplay(): string {
    return this.props.currencyDisplay;
  }

  get notifications(): NotificationPreferences {
    return { ...this.props.notifications };
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Business logic methods
  update(params: {
    timezone?: string;
    dateFormat?: string;
    currencyDisplay?: string;
    notifications?: Partial<NotificationPreferences>;
  }): UserPreferences {
    return new UserPreferences({
      ...this.props,
      timezone: params.timezone ?? this.props.timezone,
      dateFormat: params.dateFormat ?? this.props.dateFormat,
      currencyDisplay: params.currencyDisplay ?? this.props.currencyDisplay,
      notifications: {
        ...this.props.notifications,
        ...params.notifications,
      },
      updatedAt: new Date(),
    });
  }

  // Export to plain object
  toObject(): UserPreferencesProps {
    return {
      ...this.props,
      notifications: { ...this.props.notifications },
    };
  }
}

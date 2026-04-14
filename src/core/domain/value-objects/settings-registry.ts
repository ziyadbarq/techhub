/**
 * Settings Registry
 * Static typed registry defining every known system setting and its metadata.
 * Categorization, validation rules, and UI hints live here (not in the DB).
 */

import { SETTING_KEYS } from "./setting-keys";

export type SettingTab =
  | "general"
  | "authentication"
  | "email"
  | "integrations"
  | "environment";

export type SettingValueType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "secret";

export interface SettingDefinition {
  key: string;
  label: string;
  description: string;
  tab: SettingTab;
  valueType: SettingValueType;
  isSecret: boolean;
  isEditable: boolean;
  envVarName: string;
  requiresRestart: boolean;
  defaultValue?: string;
  enumOptions?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
  };
}

const SETTINGS_DEFINITIONS: SettingDefinition[] = [
  // ==========================================
  // General
  // ==========================================
  {
    key: SETTING_KEYS.LOG_LEVEL,
    label: "Log Level",
    description:
      "Application logging verbosity. Lower levels produce more output.",
    tab: "general",
    valueType: "enum",
    isSecret: false,
    isEditable: true,
    envVarName: "LOG_LEVEL",
    requiresRestart: true,
    defaultValue: "info",
    enumOptions: ["debug", "info", "warn", "error"],
  },
  {
    key: SETTING_KEYS.PRISMA_VERBOSE_LOGS,
    label: "Prisma Verbose Logs",
    description:
      "Enable detailed Prisma ORM query logging for database debugging.",
    tab: "general",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "PRISMA_VERBOSE_LOGS",
    requiresRestart: true,
    defaultValue: "false",
  },
  {
    key: SETTING_KEYS.AUTH_DEBUG_LOGS,
    label: "Auth Debug Logs",
    description: "Enable verbose Better Auth authentication logging.",
    tab: "general",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "AUTH_DEBUG_LOGS",
    requiresRestart: true,
    defaultValue: "false",
  },
  {
    key: SETTING_KEYS.NEXT_PUBLIC_APP_URL,
    label: "Application URL",
    description:
      "Public-facing URL of this application. Used in emails and links.",
    tab: "general",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "NEXT_PUBLIC_APP_URL",
    requiresRestart: false,
    validation: {
      pattern: "^https?://",
      patternMessage: "Must be a valid URL starting with http:// or https://",
    },
  },
  {
    key: SETTING_KEYS.NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL,
    label: "Feature Flags Poll Interval",
    description:
      "How often clients poll for feature flag updates, in milliseconds.",
    tab: "general",
    valueType: "number",
    isSecret: false,
    isEditable: true,
    envVarName: "NEXT_PUBLIC_FEATURE_FLAGS_POLL_INTERVAL",
    requiresRestart: false,
    defaultValue: "30000",
    validation: { min: 5000, max: 300000 },
  },

  // ==========================================
  // Authentication
  // ==========================================
  {
    key: SETTING_KEYS.NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION,
    label: "Email Registration",
    description: "Allow users to register with email and password.",
    tab: "authentication",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "NEXT_PUBLIC_ENABLE_EMAIL_REGISTRATION",
    requiresRestart: false,
    defaultValue: "true",
  },
  {
    key: SETTING_KEYS.NEXT_PUBLIC_ENABLE_MS_AUTH,
    label: "Microsoft SSO",
    description: "Enable Microsoft OAuth single sign-on for users.",
    tab: "authentication",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "NEXT_PUBLIC_ENABLE_MS_AUTH",
    requiresRestart: false,
    defaultValue: "false",
  },
  {
    key: SETTING_KEYS.TRUSTED_ORIGINS,
    label: "Trusted Origins",
    description:
      "Comma-separated list of trusted origins for CORS. Falls back to application URL.",
    tab: "authentication",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "TRUSTED_ORIGINS",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.MICROSOFT_CLIENT_ID,
    label: "Microsoft OAuth Client ID",
    description: "Azure AD app registration client ID for SSO.",
    tab: "authentication",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "MICROSOFT_CLIENT_ID",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.MICROSOFT_CLIENT_SECRET,
    label: "Microsoft OAuth Client Secret",
    description: "Azure AD app registration client secret for SSO.",
    tab: "authentication",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "MICROSOFT_CLIENT_SECRET",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.MICROSOFT_TENANT_ID,
    label: "Microsoft Tenant ID",
    description:
      "Azure AD tenant ID. Use 'common' for multi-tenant or a specific tenant GUID.",
    tab: "authentication",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "MICROSOFT_TENANT_ID",
    requiresRestart: true,
  },

  // ==========================================
  // Email
  // ==========================================
  {
    key: SETTING_KEYS.AZURE_EMAIL_TENANT_ID,
    label: "Email Tenant ID",
    description: "Azure AD tenant ID for the email service principal.",
    tab: "email",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_EMAIL_TENANT_ID",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.AZURE_EMAIL_CLIENT_ID,
    label: "Email Client ID",
    description: "Azure AD application client ID for email sending.",
    tab: "email",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_EMAIL_CLIENT_ID",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.AZURE_EMAIL_CLIENT_SECRET,
    label: "Email Client Secret",
    description: "Azure AD application client secret for email sending.",
    tab: "email",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_EMAIL_CLIENT_SECRET",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.AZURE_EMAIL_FROM,
    label: "Sender Email Address",
    description:
      "The mailbox used as the sender for outgoing emails. Must be licensed for Exchange Online.",
    tab: "email",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "AZURE_EMAIL_FROM",
    requiresRestart: true,
    validation: {
      pattern: "^[^@]+@[^@]+\\.[^@]+$",
      patternMessage: "Must be a valid email address",
    },
  },

  // ==========================================
  // Integrations - Azure Intune
  // ==========================================
  {
    key: SETTING_KEYS.AZURE_TENANT_ID,
    label: "Intune Tenant ID",
    description: "Azure AD tenant ID for Intune device management.",
    tab: "integrations",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_TENANT_ID",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.AZURE_CLIENT_ID,
    label: "Intune Client ID",
    description: "Azure AD application client ID for Intune API access.",
    tab: "integrations",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_CLIENT_ID",
    requiresRestart: true,
  },
  {
    key: SETTING_KEYS.AZURE_CLIENT_SECRET,
    label: "Intune Client Secret",
    description: "Azure AD application client secret for Intune API access.",
    tab: "integrations",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "AZURE_CLIENT_SECRET",
    requiresRestart: true,
  },

  // ==========================================
  // Integrations - OCI Sync
  // ==========================================
  {
    key: SETTING_KEYS.OCI_SYNC_SOURCE,
    label: "OCI Sync Source",
    description:
      "How OCI data is ingested: via webhook from n8n or local file snapshots. Takes effect on next sync.",
    tab: "integrations",
    valueType: "enum",
    isSecret: false,
    isEditable: true,
    envVarName: "OCI_SYNC_SOURCE",
    requiresRestart: false,
    enumOptions: ["webhook", "local"],
  },
  {
    key: SETTING_KEYS.OCI_WEBHOOK_TOKEN,
    label: "OCI Webhook Token",
    description:
      "Authentication token for the n8n OCI webhook endpoint. Takes effect on next sync.",
    tab: "integrations",
    valueType: "secret",
    isSecret: true,
    isEditable: true,
    envVarName: "OCI_WEBHOOK_TOKEN",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.OCI_WEBHOOK_INSECURE,
    label: "OCI Webhook Skip TLS",
    description:
      "Skip TLS certificate verification for self-signed certs on the webhook. Takes effect on next sync.",
    tab: "integrations",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "OCI_WEBHOOK_INSECURE",
    requiresRestart: false,
    defaultValue: "false",
  },
  {
    key: SETTING_KEYS.OCI_LOCAL_DATA_DIR,
    label: "OCI Local Data Directory",
    description: "Directory path where local OCI snapshot files are stored.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "OCI_LOCAL_DATA_DIR",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.OCI_LOCAL_DATA_ARCHIVE_DIR,
    label: "OCI Archive Directory",
    description: "Directory path where processed OCI snapshots are archived.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "OCI_LOCAL_DATA_ARCHIVE_DIR",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.OCI_LOCAL_SOURCE_RETIRE_MISSING,
    label: "Retire Missing OCI CIs",
    description:
      "Automatically retire configuration items missing from local OCI snapshots.",
    tab: "integrations",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "OCI_LOCAL_SOURCE_RETIRE_MISSING",
    requiresRestart: false,
    defaultValue: "false",
  },

  // ==========================================
  // Integrations - Database Backups
  // ==========================================
  {
    key: SETTING_KEYS.BACKUP_STORAGE_PATH,
    label: "Backup Storage Path",
    description: "Filesystem directory where database backup files are stored.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "BACKUP_STORAGE_PATH",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.PG_DUMP_PATH,
    label: "pg_dump Binary Path",
    description: "Path to the pg_dump binary for creating database backups.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "PG_DUMP_PATH",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.PG_DUMP_FLAGS,
    label: "pg_dump Custom Flags",
    description: "Additional command-line flags passed to pg_dump.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "PG_DUMP_FLAGS",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.PSQL_PATH,
    label: "psql Binary Path",
    description: "Path to the psql binary for database restore operations.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "PSQL_PATH",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.PSQL_FLAGS,
    label: "psql Custom Flags",
    description:
      "Additional command-line flags passed to psql during restores.",
    tab: "integrations",
    valueType: "string",
    isSecret: false,
    isEditable: true,
    envVarName: "PSQL_FLAGS",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.BACKUP_VERIFY_TEMP_DB,
    label: "Verify Backups with Temp DB",
    description:
      "Create a temporary database to verify backup integrity after creation.",
    tab: "integrations",
    valueType: "boolean",
    isSecret: false,
    isEditable: true,
    envVarName: "BACKUP_VERIFY_TEMP_DB",
    requiresRestart: false,
    defaultValue: "false",
  },

  // ==========================================
  // Environment (read-only)
  // ==========================================
  {
    key: SETTING_KEYS.DATABASE_URL,
    label: "Database URL",
    description: "PostgreSQL connection string.",
    tab: "environment",
    valueType: "string",
    isSecret: true,
    isEditable: false,
    envVarName: "DATABASE_URL",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.REDIS_URL,
    label: "Redis URL",
    description: "Redis connection string for background jobs and caching.",
    tab: "environment",
    valueType: "string",
    isSecret: true,
    isEditable: false,
    envVarName: "REDIS_URL",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.ENCRYPTION_KEY,
    label: "Encryption Key",
    description: "AES-256-GCM key for encrypting sensitive data at rest.",
    tab: "environment",
    valueType: "string",
    isSecret: true,
    isEditable: false,
    envVarName: "ENCRYPTION_KEY",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.BETTER_AUTH_URL,
    label: "Better Auth URL",
    description: "Base URL for the Better Auth authentication service.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "BETTER_AUTH_URL",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.BETTER_AUTH_SECRET,
    label: "Better Auth Secret",
    description: "Secret key for Better Auth session signing.",
    tab: "environment",
    valueType: "string",
    isSecret: true,
    isEditable: false,
    envVarName: "BETTER_AUTH_SECRET",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.PORT,
    label: "Server Port",
    description: "HTTP port the application listens on.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "PORT",
    requiresRestart: false,
    defaultValue: "3000",
  },
  {
    key: SETTING_KEYS.CONFIG_SERVER_URL,
    label: "Config Server URL",
    description: "Spring Cloud Config Server URL for external configuration.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "CONFIG_SERVER_URL",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.SPRING_PROFILE,
    label: "Spring Profile",
    description: "Active Spring Cloud Config profile (dev, uat, prod).",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "SPRING_PROFILE",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.SKIP_ENV_VALIDATION,
    label: "Skip Env Validation",
    description: "Skip environment variable validation during build.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "SKIP_ENV_VALIDATION",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.SKIP_TYPE_CHECK,
    label: "Skip Type Check",
    description: "Skip TypeScript type checking during build.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "SKIP_TYPE_CHECK",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.ANALYZE,
    label: "Bundle Analyzer",
    description: "Enable Next.js bundle analyzer.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "ANALYZE",
    requiresRestart: false,
  },
  {
    key: SETTING_KEYS.NEXT_TELEMETRY_DISABLED,
    label: "Next.js Telemetry Disabled",
    description: "Disable Next.js anonymous telemetry collection.",
    tab: "environment",
    valueType: "string",
    isSecret: false,
    isEditable: false,
    envVarName: "NEXT_TELEMETRY_DISABLED",
    requiresRestart: false,
  },
];

// Build lookup map
const SETTINGS_MAP = new Map<string, SettingDefinition>(
  SETTINGS_DEFINITIONS.map((def) => [def.key, def]),
);

export function getSettingDefinition(
  key: string,
): SettingDefinition | undefined {
  return SETTINGS_MAP.get(key);
}

export function getSettingsByTab(tab: SettingTab): SettingDefinition[] {
  return SETTINGS_DEFINITIONS.filter((def) => def.tab === tab);
}

export function getEditableSettings(): SettingDefinition[] {
  return SETTINGS_DEFINITIONS.filter((def) => def.isEditable);
}

export function getEnvironmentSettings(): SettingDefinition[] {
  return SETTINGS_DEFINITIONS.filter((def) => !def.isEditable);
}

export function getAllSettingDefinitions(): SettingDefinition[] {
  return [...SETTINGS_DEFINITIONS];
}

export function isValidSettingKey(key: string): boolean {
  return SETTINGS_MAP.has(key);
}

export const SETTING_TABS: SettingTab[] = [
  "general",
  "authentication",
  "email",
  "integrations",
  "environment",
];

export const SETTING_TAB_LABELS: Record<SettingTab, string> = {
  general: "General",
  authentication: "Authentication",
  email: "Email",
  integrations: "Integrations",
  environment: "Environment",
};

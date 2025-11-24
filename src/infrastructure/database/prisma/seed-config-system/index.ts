/**
 * System Seed Configuration - Consolidated Exports
 *
 * This barrel file exports all system-level seed configurations from their respective modules.
 * Split from a single 2,079-line file into 7 focused modules for better maintainability.
 */

// Attachment Types
export { ATTACHMENT_TYPES } from "../seed-config-attachment-types";

// Services (split by domain)
export { BANKING_SERVICES } from "../seed-config-services-banking";
export { SECURITY_SERVICES } from "../seed-config-services-security";
export { COMPLIANCE_SERVICES } from "../seed-config-services-compliance";
export { INFRASTRUCTURE_SERVICES } from "../seed-config-services-infrastructure";

// Import for combining
import { BANKING_SERVICES } from "../seed-config-services-banking";
import { SECURITY_SERVICES } from "../seed-config-services-security";
import { COMPLIANCE_SERVICES } from "../seed-config-services-compliance";
import { INFRASTRUCTURE_SERVICES } from "../seed-config-services-infrastructure";

// Combine all services into a single export for convenience
export const SERVICE_DATA = [
  ...BANKING_SERVICES,
  ...SECURITY_SERVICES,
  ...COMPLIANCE_SERVICES,
  ...INFRASTRUCTURE_SERVICES,
] as const;

// Business Processes
export { BUSINESS_PROCESS_DATA } from "../seed-config-business-processes";

// Exchange Rates
export { EXCHANGE_RATE_DATA } from "../seed-config-exchange-rates";

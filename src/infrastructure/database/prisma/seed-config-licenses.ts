/**
 * License Management Seed Configuration
 * Microsoft 365 License Products based on actual Barq usage
 */

// ==============================================
// License Product Data
// ==============================================

/**
 * Microsoft 365 License Products
 * Based on MS_Licenses.csv data from Barq
 */
export const LICENSE_PRODUCT_DATA = [
  {
    name: "Microsoft 365 Business Premium",
    code: "M365-BP",
    vendorCode: "MSFT",
    metricType: "PER_USER" as const,
    description:
      "Productivity and security suite for small to medium businesses. Includes Office apps, email, file storage, and security tools.",
  },
  {
    name: "Microsoft 365 E5 without Audio Conferencing",
    code: "M365-E5-NO-AUDIO",
    vendorCode: "MSFT",
    metricType: "PER_USER" as const,
    description:
      "Enterprise E5 suite without audio conferencing. Includes advanced compliance, security, and analytics capabilities.",
  },
  {
    name: "Microsoft Power Automate Free",
    code: "POWER-AUTOMATE-FREE",
    vendorCode: "MSFT",
    metricType: "PER_USER" as const,
    description:
      "Free tier of Microsoft Power Automate for workflow automation. Often bundled with other Microsoft 365 licenses.",
  },
  {
    name: "Microsoft Fabric (Free)",
    code: "MS-FABRIC-FREE",
    vendorCode: "MSFT",
    metricType: "PER_USER" as const,
    description:
      "Free tier of Microsoft Fabric for data analytics and integration. Unified platform for data engineering and science.",
  },
] as const;

// ==============================================
// License Addon Data (Optional Add-ons)
// ==============================================

/**
 * Add-ons for Microsoft 365 licenses
 * These are linked to the base M365 Business Premium product
 * Note: licenseProductCode will be resolved to ID in seeder
 */
export const LICENSE_ADDON_DATA = [
  {
    name: "Power Automate Premium",
    code: "PA-PREMIUM",
    licenseProductCode: "M365-BP", // Linked to M365 Business Premium
    description:
      "Premium features for Power Automate including RPA and AI Builder",
    isActive: true,
  },
  {
    name: "Microsoft Teams Audio Conferencing",
    code: "TEAMS-AUDIO-CONF",
    licenseProductCode: "M365-BP",
    description: "Dial-in audio conferencing for Microsoft Teams meetings",
    isActive: true,
  },
  {
    name: "Microsoft Defender for Endpoint",
    code: "DEFENDER-ENDPOINT",
    licenseProductCode: "M365-E5-NO-AUDIO", // Linked to E5
    description: "Advanced endpoint protection and threat detection",
    isActive: true,
  },
  {
    name: "Microsoft Defender for Office 365",
    code: "DEFENDER-O365",
    licenseProductCode: "M365-E5-NO-AUDIO",
    description: "Advanced threat protection for email and collaboration",
    isActive: true,
  },
] as const;

/**
 * Attachment Types Seed Configuration
 *
 * Defines attachment types for the polymorphic attachment system.
 * Used for compliance documentation, invoices, certificates, and audit trails.
 */

export const ATTACHMENT_TYPES = [
  {
    name: "Invoice",
    code: "ATT-INV",
    description: "Financial invoices and billing documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Certificate",
    code: "ATT-CERT",
    description: "Certificates of authenticity, compliance, and completion",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Photo",
    code: "ATT-PHOTO",
    description: "Asset photos and visual documentation",
    allowedExtensions: ["jpg", "jpeg", "png", "heic"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Document",
    code: "ATT-DOC",
    description: "General documents and text files",
    allowedExtensions: ["pdf", "doc", "docx"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "Spreadsheet",
    code: "ATT-SHEET",
    description: "Spreadsheets and data tables",
    allowedExtensions: ["xls", "xlsx", "csv"],
    maxFileSizeMB: 15,
    isActive: true,
  },
  {
    name: "Warranty Document",
    code: "ATT-WARR",
    description: "Warranty certificates and terms documents",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Disposal Certificate",
    code: "ATT-DISP",
    description: "Asset disposal and sanitization certificates",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 5,
    isActive: true,
  },
  {
    name: "Signed Delivery Note",
    code: "ATT-DELIV",
    description:
      "Asset handover form signed by the employee, scanned by the help desk",
    // Scanners commonly output images rather than PDF, so both are allowed.
    allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Audit Report",
    code: "ATT-AUDIT",
    description: "Compliance and internal audit reports",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 20,
    isActive: true,
  },
  {
    name: "License Agreement",
    code: "ATT-LIC",
    description: "Software license agreements and terms",
    allowedExtensions: ["pdf"],
    maxFileSizeMB: 10,
    isActive: true,
  },
  {
    name: "Network Diagram",
    code: "ATT-NET",
    description: "Network topology diagrams and architecture documents",
    allowedExtensions: ["pdf", "png", "svg"],
    maxFileSizeMB: 10,
    isActive: true,
  },
] as const;

# Attachments System

**Complete guide to the Attachments module for compliance documentation, audit trails, and file management**

## Overview

The Attachments System provides comprehensive file management capabilities for the Barq ITAM platform, enabling document storage, classification, and linking to any entity in the system. This is critical for compliance documentation, audit trails, invoice storage, and certificate management in a regulated financial services environment.

**Key Capabilities**:

- Store and classify files with Attachment Types (invoices, certificates, photos, diagrams, etc.)
- Polymorphic attachments - link files to any entity (Assets, CIs, Contracts, Warranties, Disposals, etc.)
- File validation with type-specific rules (allowed extensions, size limits)
- Audit trail tracking (who uploaded, when, to which entity)
- Support for future cloud storage integration (S3, MinIO)
- RBAC-protected access control for file management

**Why Barq Needs This**:

As a SAMA-regulated financial services company, Barq must maintain comprehensive audit trails and documentation:

- **Compliance**: Store regulatory documents, audit reports, compliance certificates
- **Asset Management**: Attach purchase invoices, warranty certificates, disposal certificates
- **Vendor Management**: Store contracts, SLAs, insurance certificates
- **Incident Response**: Attach investigation reports, remediation documentation
- **Configuration Management**: Store diagrams, architecture documents, runbooks

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                  (UI Components - Pending)                   │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Interface Adapters                        │
│  • AttachmentTypeController (5 server actions) ✅            │
│  • AttachmentController (6 server actions) ✅                │
│  • Zod DTOs (validation) ✅                                  │
│  • Presenters (Entity → DTO) ✅                              │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Use Cases Layer                         │
│  Attachment Type:                                            │
│  • CreateAttachmentTypeUseCase ✅                            │
│  • GetAttachmentTypeUseCase ✅                               │
│  • ListAttachmentTypesUseCase ✅                             │
│  • UpdateAttachmentTypeUseCase ✅                            │
│  • DeleteAttachmentTypeUseCase ✅                            │
│                                                              │
│  Attachment:                                                 │
│  • CreateAttachmentUseCase ✅                                │
│  • GetAttachmentUseCase ✅                                   │
│  • ListAttachmentsUseCase ✅                                 │
│  • GetAttachmentsByTargetUseCase ✅                          │
│  • UpdateAttachmentUseCase ✅                                │
│  • DeleteAttachmentUseCase ✅                                │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  • AttachmentType Entity (validation templates) ✅           │
│  • Attachment Entity (file metadata) ✅                      │
│  • IAttachmentTypeRepository (interface) ✅                  │
│  • IAttachmentRepository (interface) ✅                      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  • PrismaAttachmentTypeRepository (PostgreSQL) ✅            │
│  • PrismaAttachmentRepository (PostgreSQL) ✅                │
│  • File Storage Service (Future: S3/MinIO) ⏳                │
└─────────────────────────────────────────────────────────────┘
```

---

## Entities

### 1. AttachmentType Entity

**Purpose**: Defines attachment classifications with validation rules for file types and size limits.

```typescript
class AttachmentType {
  id: string;
  name: string;                // "Invoice", "Certificate", "Photo"
  code: string;                // "INVOICE", "CERT", "PHOTO" (unique, uppercase)
  description?: string | null;
  allowedExtensions: string[]; // ["pdf", "jpg", "png"]
  maxFileSizeMB: number;       // 100 (default)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Business methods
  activate(): void;
  deactivate(): void;
  updateAllowedExtensions(extensions: string[]): void;
}
```

**Validation Rules**:

- Name: Required, max 255 characters
- Code: Required, max 50 characters, alphanumeric + hyphens/underscores only, uppercase
- Allowed Extensions: Array of alphanumeric strings (without leading dot)
- Max File Size: 1-10000 MB (integer only)

**Examples**:

```typescript
// Invoice attachment type
{
  name: "Invoice",
  code: "INVOICE",
  allowedExtensions: ["pdf", "jpg", "png"],
  maxFileSizeMB: 50,
  description: "Purchase invoices and receipts"
}

// Certificate attachment type
{
  name: "Certificate",
  code: "CERT",
  allowedExtensions: ["pdf"],
  maxFileSizeMB: 10,
  description: "Warranty certificates, compliance certificates"
}

// Diagram attachment type
{
  name: "Diagram",
  code: "DIAGRAM",
  allowedExtensions: ["png", "jpg", "svg", "pdf", "vsdx"],
  maxFileSizeMB: 100,
  description: "Architecture diagrams, network diagrams"
}
```

### 2. Attachment Entity

**Purpose**: Represents a file attachment linked to any entity in the system (polymorphic).

```typescript
class Attachment {
  id: string;
  attachmentTypeId: string;
  targetType: TargetObjectTypeEnum;  // CI, ASSET, CONTRACT, etc.
  targetId: string;
  fileName: string;
  filePath: string;                  // File storage path or URL
  mimeType?: string | null;          // "application/pdf", "image/jpeg"
  sizeBytes?: bigint | null;
  uploadedById: string;
  uploadedAt: Date;
  note?: string | null;

  // Business methods
  getFileExtension(): string;
  isImage(): boolean;
  isPDF(): boolean;
  getFileSizeKB(): number;
  getFileSizeMB(): number;
  getFormattedFileSize(): string;    // "2.5 MB"
  updateTarget(targetType, targetId): void;
}
```

**Validation Rules**:

- File Name: Required, max 255 characters
- File Path: Required (storage path or URL)
- MIME Type: Format `type/subtype` (e.g., `application/pdf`, `image/jpeg`)
- File Size: 0-100MB (default limit, can be overridden by AttachmentType)

**Polymorphic Targets** (`TargetObjectTypeEnum`):

```typescript
enum TargetObjectTypeEnum {
  // Foundation Layer
  ORGANIZATION_UNIT
  PERSON
  LOCATION
  VENDOR
  LIFECYCLE_STATE
  LIFECYCLE_TRANSITION

  // CMDB
  CI
  CI_RELATIONSHIP
  RELATIONSHIP_TYPE

  // Asset Layer
  ASSET
  ASSET_ASSIGNMENT
  WARRANTY
  MAINTENANCE_SCHEDULE
  MAINTENANCE_RECORD
  STOCK_MOVEMENT

  // Asset Disposals
  ASSET_DISPOSAL
  DISPOSAL_APPROVAL
  DISPOSAL_DOCUMENT

  // Asset Kits
  ASSET_KIT
  ASSET_KIT_ITEM
  ASSET_KIT_CHECKOUT
  ASSET_KIT_CHECKOUT_ITEM

  // Asset Reservations
  ASSET_RESERVATION
  ASSET_RESERVATION_CONFLICT

  // Contracts & Licenses
  CONTRACT
  LICENSE_ENTITLEMENT
  LICENSE_ALLOCATION
}
```

---

## Database Schema

### AttachmentType Model

```prisma
model AttachmentType {
  id                String   @id @default(cuid())
  name              String   @unique
  code              String   @unique
  description       String?  @db.Text
  allowedExtensions String[] // e.g., ["pdf", "jpg", "png"]
  maxFileSizeMB     Int      // Maximum file size in megabytes
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  attachments Attachment[]

  // Indexes
  @@index([code])
  @@index([isActive])
  @@map("attachment_types")
}
```

### Attachment Model

```prisma
model Attachment {
  id               String               @id @default(cuid())
  attachmentTypeId String
  targetType       TargetObjectTypeEnum // Polymorphic target
  targetId         String               // CI / Asset / Contract / etc.
  fileName         String
  filePath         String               // File storage path or URL
  mimeType         String?
  sizeBytes        BigInt?
  uploadedById     String
  uploadedAt       DateTime             @default(now())
  note             String?              @db.Text

  // Relations
  attachmentType AttachmentType @relation(fields: [attachmentTypeId], references: [id], onDelete: Restrict)
  uploadedBy     Person         @relation(fields: [uploadedById], references: [id], onDelete: Restrict)

  // Indexes
  @@index([attachmentTypeId])
  @@index([targetType, targetId])  // Critical for polymorphic queries
  @@index([uploadedById])
  @@map("attachments")
}
```

**Key Design Features**:

- **Polymorphic Association**: `targetType` + `targetId` allow linking to any entity
- **Composite Index**: `[targetType, targetId]` enables fast queries for "all attachments for this CI"
- **Restrict Delete**: Prevents deleting attachment types or users if attachments exist
- **BigInt for File Size**: Supports large files (JavaScript BigInt compatible)

---

## Use Cases

### Common Workflows

#### 1. Upload Invoice for Asset Purchase

```typescript
// Scenario: Attach invoice PDF to asset
const invoice = await createAttachment({
  attachmentTypeId: invoiceTypeId,
  targetType: "ASSET",
  targetId: assetId,
  fileName: "laptop-invoice-2024-001.pdf",
  filePath: "/storage/attachments/2024/01/laptop-invoice-2024-001.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(2450000), // 2.45 MB
  uploadedById: currentUserId,
  note: "Purchase invoice from Vendor ABC for laptop asset",
});
```

#### 2. Attach Certificate to Asset Disposal

```typescript
// Scenario: Attach disposal certificate after data sanitization
const certificate = await createAttachment({
  attachmentTypeId: certificateTypeId,
  targetType: "ASSET_DISPOSAL",
  targetId: disposalId,
  fileName: "disposal-certificate-DSP-2024-0042.pdf",
  filePath: "/storage/attachments/disposals/DSP-2024-0042-cert.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(850000), // 850 KB
  uploadedById: currentUserId,
  note: "Data sanitization certificate - all data securely erased per policy",
});
```

#### 3. View All Attachments for Configuration Item

```typescript
// Scenario: View all documents attached to a database server CI
const attachments = await listAttachmentsByTarget("CI", ciId);

// Returns all attachments:
// - Network diagram
// - Installation guide
// - Compliance audit report
// - Backup configuration
```

#### 4. Attach Architecture Diagram to CI Relationship

```typescript
// Scenario: Document network topology between CIs
const diagram = await createAttachment({
  attachmentTypeId: diagramTypeId,
  targetType: "CI_RELATIONSHIP",
  targetId: relationshipId,
  fileName: "network-topology-datacenter-a.png",
  filePath: "/storage/attachments/diagrams/network-topology-datacenter-a.png",
  mimeType: "image/png",
  sizeBytes: BigInt(5200000), // 5.2 MB
  uploadedById: currentUserId,
  note: "Network topology showing fiber connection between core switches",
});
```

#### 5. Attach Warranty Certificate to Warranty Record

```typescript
// Scenario: Store warranty certificate PDF
const warranty = await createAttachment({
  attachmentTypeId: certificateTypeId,
  targetType: "WARRANTY",
  targetId: warrantyId,
  fileName: "warranty-cert-WRN-2024-001.pdf",
  filePath: "/storage/attachments/warranties/WRN-2024-001-cert.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(1200000), // 1.2 MB
  uploadedById: currentUserId,
  note: "Extended warranty certificate - 3 years on-site service",
});
```

---

## Business Rules

### File Validation

**1. Extension Validation**

- Attachment must match one of the allowed extensions in its AttachmentType
- Extensions are normalized (lowercase, no leading dot)
- Validation happens at entity creation

**2. File Size Limits**

- Default: 100 MB per file
- AttachmentType can override with custom `maxFileSizeMB`
- Enforced at DTO validation layer (Zod) and entity layer

**3. MIME Type Validation**

- Format: `type/subtype` (e.g., `application/pdf`, `image/jpeg`)
- Validated with regex: `/^[a-zA-Z0-9]+\/[a-zA-Z0-9+.-]+$/`
- Optional field but recommended for accurate file type detection

**4. File Name Validation**

- Required, max 255 characters
- Trimmed of whitespace
- Should include file extension for clarity

### Polymorphic Attachment Rules

**1. Target Validation**

- `targetType` must be valid `TargetObjectTypeEnum` value
- `targetId` must reference an existing entity (validated at use case layer)
- Cannot change target after creation (create new attachment instead)

**2. Cascade Behavior**

- Deleting AttachmentType: **Restricted** (fails if attachments exist)
- Deleting User (uploader): **Restricted** (fails if attachments exist)
- Deleting target entity: **No database constraint** (application handles cleanup)

**3. Access Control**

- View: User must have `ATTACHMENTS_VIEW` permission
- Create: User must have `ATTACHMENTS_CREATE` permission
- Update: User must have `ATTACHMENTS_UPDATE` permission (metadata only, not file)
- Delete: User must have `ATTACHMENTS_DELETE` permission

---

## API Reference

### Attachment Type Controllers

#### 1. Create Attachment Type

```typescript
import { createAttachmentType } from "@/interface-adapters/controllers/attachment-type.controller";

const result = await createAttachmentType({
  name: "Invoice",
  code: "INVOICE",
  description: "Purchase invoices and receipts",
  allowedExtensions: ["pdf", "jpg", "png"],
  maxFileSizeMB: 50,
});

// Returns
{
  success: true,
  data: AttachmentTypeDTO
}
```

**Permission Required**: `ATTACHMENT_TYPES_CREATE`

#### 2. List Attachment Types

```typescript
import { listAttachmentTypes } from "@/interface-adapters/controllers/attachment-type.controller";

const result = await listAttachmentTypes({ activeOnly: true });

// Returns
{
  success: true,
  data: AttachmentTypeDTO[]
}
```

**Permission Required**: `ATTACHMENT_TYPES_VIEW`

#### 3. Update Attachment Type

```typescript
import { updateAttachmentType } from "@/interface-adapters/controllers/attachment-type.controller";

const result = await updateAttachmentType(typeId, {
  maxFileSizeMB: 100,
  allowedExtensions: ["pdf", "jpg", "png", "docx"],
});
```

**Permission Required**: `ATTACHMENT_TYPES_UPDATE`

#### 4. Delete Attachment Type

```typescript
import { deleteAttachmentType } from "@/interface-adapters/controllers/attachment-type.controller";

const result = await deleteAttachmentType(typeId);
```

**Permission Required**: `ATTACHMENT_TYPES_DELETE`

### Attachment Controllers

#### 1. Create Attachment

```typescript
import { createAttachment } from "@/interface-adapters/controllers/attachment.controller";

const result = await createAttachment({
  attachmentTypeId: "type-id",
  targetType: "ASSET",
  targetId: "asset-id",
  fileName: "invoice.pdf",
  filePath: "/storage/attachments/invoice.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(2450000),
  uploadedById: currentUserId,
  note: "Purchase invoice",
});

// Returns
{
  success: true,
  data: AttachmentDTO  // Includes computed fields
}
```

**Permission Required**: `ATTACHMENTS_CREATE`

**Computed Fields in DTO**:

```typescript
{
  ...attachmentFields,
  fileExtension: "pdf",
  fileSizeKB: 2392.58,
  fileSizeMB: 2.34,
  formattedFileSize: "2.34 MB",
  isImage: false,
  isPDF: true
}
```

#### 2. List Attachments by Target (Polymorphic)

```typescript
import { listAttachmentsByTarget } from "@/interface-adapters/controllers/attachment.controller";

const result = await listAttachmentsByTarget("CI", ciId);

// Returns all attachments for this CI
{
  success: true,
  data: AttachmentDTO[]
}
```

**Permission Required**: `ATTACHMENTS_VIEW`

**Use Cases**:

- View all attachments for an asset
- View all attachments for a contract
- View all attachments for a disposal
- View all attachments for a warranty

#### 3. List Attachments (General)

```typescript
import { listAttachments } from "@/interface-adapters/controllers/attachment.controller";

const result = await listAttachments({
  uploadedById: userId,        // Filter by uploader
  attachmentTypeId: typeId,    // Filter by type
});
```

**Permission Required**: `ATTACHMENTS_VIEW`

#### 4. Get Attachment

```typescript
import { getAttachment } from "@/interface-adapters/controllers/attachment.controller";

const result = await getAttachment(attachmentId);
```

**Permission Required**: `ATTACHMENTS_VIEW`

#### 5. Update Attachment

```typescript
import { updateAttachment } from "@/interface-adapters/controllers/attachment.controller";

const result = await updateAttachment(attachmentId, {
  fileName: "updated-name.pdf",
  note: "Updated note",
});
```

**Permission Required**: `ATTACHMENTS_UPDATE`

**Note**: Cannot update `targetType`, `targetId`, or `uploadedById` after creation.

#### 6. Delete Attachment

```typescript
import { deleteAttachment } from "@/interface-adapters/controllers/attachment.controller";

const result = await deleteAttachment(attachmentId);
```

**Permission Required**: `ATTACHMENTS_DELETE`

---

## RBAC Permissions

### Complete Permission List

```typescript
// Attachment Types (5 permissions)
PERMISSIONS.ATTACHMENT_TYPES_VIEW;    // "attachment-types:view"
PERMISSIONS.ATTACHMENT_TYPES_CREATE;  // "attachment-types:create"
PERMISSIONS.ATTACHMENT_TYPES_UPDATE;  // "attachment-types:update"
PERMISSIONS.ATTACHMENT_TYPES_DELETE;  // "attachment-types:delete"
PERMISSIONS.ATTACHMENT_TYPES_MANAGE;  // "attachment-types:manage" (all actions)

// Attachments (5 permissions)
PERMISSIONS.ATTACHMENTS_VIEW;         // "attachments:view"
PERMISSIONS.ATTACHMENTS_CREATE;       // "attachments:create"
PERMISSIONS.ATTACHMENTS_UPDATE;       // "attachments:update"
PERMISSIONS.ATTACHMENTS_DELETE;       // "attachments:delete"
PERMISSIONS.ATTACHMENTS_MANAGE;       // "attachments:manage" (all actions)
```

### Default Role Assignments

- **Admin**: All 10 permissions
- **Manager**: View, Create, Update (both types and attachments)
- **Viewer**: View only (both types and attachments)
- **Asset Manager**: Create, View, Update attachments (for asset documentation)
- **IT Auditor**: View only (for compliance review)

### Implementation Examples

```typescript
// Page level protection
export default async function AttachmentsPage() {
  await requirePermission(PERMISSIONS.ATTACHMENTS_VIEW);
  // ... page content
}

// UI component level
<PermissionGuard permission={PERMISSIONS.ATTACHMENTS_CREATE}>
  <Button onClick={handleUpload}>Upload File</Button>
</PermissionGuard>

// Controller level (server action)
export async function createAttachment(data: CreateAttachmentDTO) {
  await requirePermission(PERMISSIONS.ATTACHMENTS_CREATE);
  // ... create logic
}
```

---

## File Storage

### Current Implementation: File System Storage

**Storage Path Pattern**:

```
/storage/attachments/
  ├── 2024/
  │   ├── 01/
  │   │   ├── asset-invoice-001.pdf
  │   │   └── warranty-cert-002.pdf
  │   └── 02/
  │       ├── disposal-cert-DSP-2024-001.pdf
  │       └── network-diagram.png
  └── 2025/
      └── 01/
          └── contract-signed.pdf
```

**Storage Fields**:

- `filePath`: Relative path from storage root (e.g., `/storage/attachments/2024/01/invoice.pdf`)
- Current implementation: Local file system (on-premises deployment)

### Future Enhancements: Cloud Storage

**Planned Integration**:

1. **Amazon S3 / MinIO**
   - Object storage for scalability
   - Pre-signed URLs for secure downloads
   - Automatic versioning and lifecycle policies

2. **Implementation Approach**:

```typescript
// Future: FileStorageService interface
interface IFileStorageService {
  uploadFile(file: Buffer, metadata: FileMetadata): Promise<string>; // Returns path/URL
  downloadFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<void>;
  getPresignedUrl(path: string, expiresIn: number): Promise<string>;
}

// Storage providers
class S3StorageService implements IFileStorageService { ... }
class MinIOStorageService implements IFileStorageService { ... }
class LocalFileStorageService implements IFileStorageService { ... }
```

3. **Migration Strategy**:
   - Update `filePath` to support both local paths and S3 URLs
   - Add `storageProvider` field to Attachment model
   - Implement background migration job for existing files

**Benefits**:

- **Scalability**: Handle TBs of attachments without server storage limits
- **Durability**: S3 11 9's durability (99.999999999%)
- **Performance**: CDN integration for faster downloads
- **Cost**: Pay-per-use pricing, cheaper than server storage
- **Security**: Pre-signed URLs expire automatically, preventing unauthorized access

---

## Examples

### Example 1: Complete Invoice Upload Flow

```typescript
// 1. Define Invoice attachment type (one-time setup)
const invoiceType = await createAttachmentType({
  name: "Invoice",
  code: "INVOICE",
  description: "Purchase invoices and vendor receipts",
  allowedExtensions: ["pdf", "jpg", "png"],
  maxFileSizeMB: 50,
});

// 2. Upload file (application handles file upload)
const uploadedFile = await uploadFileToStorage(file); // Returns file path

// 3. Create attachment record
const invoice = await createAttachment({
  attachmentTypeId: invoiceType.data.id,
  targetType: "ASSET",
  targetId: laptopAssetId,
  fileName: file.name,
  filePath: uploadedFile.path,
  mimeType: file.type,
  sizeBytes: BigInt(file.size),
  uploadedById: currentUser.id,
  note: "Purchase invoice from Vendor XYZ for Laptop Asset LAP-2024-0042",
});

// 4. Verify attachment
console.log(invoice.data.formattedFileSize); // "2.34 MB"
console.log(invoice.data.isPDF);             // true
console.log(invoice.data.fileExtension);     // "pdf"
```

### Example 2: Attach Multiple Certificates to Disposal

```typescript
// Scenario: Asset disposal requires multiple certificates
const disposalId = "DSP-2024-0042";

// 1. Data sanitization certificate
await createAttachment({
  attachmentTypeId: certificateTypeId,
  targetType: "ASSET_DISPOSAL",
  targetId: disposalId,
  fileName: "data-sanitization-cert.pdf",
  filePath: "/storage/attachments/disposals/DSP-2024-0042-sanitization.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(850000),
  uploadedById: technicianId,
  note: "Certificate of data destruction - DoD 5220.22-M standard",
});

// 2. Environmental disposal certificate
await createAttachment({
  attachmentTypeId: certificateTypeId,
  targetType: "ASSET_DISPOSAL",
  targetId: disposalId,
  fileName: "environmental-disposal-cert.pdf",
  filePath: "/storage/attachments/disposals/DSP-2024-0042-environmental.pdf",
  mimeType: "application/pdf",
  sizeBytes: BigInt(1200000),
  uploadedById: complianceOfficerId,
  note: "Certificate of environmentally responsible e-waste disposal",
});

// 3. Retrieve all disposal certificates
const certificates = await listAttachmentsByTarget("ASSET_DISPOSAL", disposalId);
console.log(`Disposal has ${certificates.data.length} certificates`); // 2
```

### Example 3: Dashboard Widget - Recent Attachments

```typescript
// Show recent attachments uploaded by current user
const recentAttachments = await listAttachments({
  uploadedById: currentUser.id,
});

// Display in dashboard
const widget = recentAttachments.data.slice(0, 5).map((att) => ({
  fileName: att.fileName,
  targetType: att.targetType,
  uploadedAt: att.uploadedAt,
  size: att.formattedFileSize,
  type: att.isPDF ? "PDF" : att.isImage ? "Image" : "Other",
}));
```

### Example 4: Bulk Attachment Report

```typescript
// Generate report of all attachments for an entity
async function generateAttachmentReport(targetType: TargetObjectTypeEnum, targetId: string) {
  const attachments = await listAttachmentsByTarget(targetType, targetId);

  if (!attachments.success) {
    throw new Error(attachments.error);
  }

  const totalSize = attachments.data.reduce((sum, att) => {
    return sum + att.fileSizeMB;
  }, 0);

  return {
    totalAttachments: attachments.data.length,
    totalSizeMB: totalSize.toFixed(2),
    byType: attachments.data.reduce((acc, att) => {
      const ext = att.fileExtension;
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentUploads: attachments.data.slice(0, 10),
  };
}

// Usage
const report = await generateAttachmentReport("CI", databaseCIId);
console.log(report);
// {
//   totalAttachments: 12,
//   totalSizeMB: "45.67",
//   byType: { pdf: 8, png: 3, jpg: 1 },
//   recentUploads: [...]
// }
```

---

## Integration with Other Modules

### 1. Asset Integration

**Use Cases**:

- Attach purchase invoices to assets
- Store warranty certificates
- Document asset photos (before/after maintenance)
- Attach inspection reports

**Example**:

```typescript
// Attach invoice to asset
await createAttachment({
  targetType: "ASSET",
  targetId: assetId,
  attachmentTypeId: invoiceTypeId,
  fileName: "asset-invoice.pdf",
  // ... other fields
});

// Display on asset detail page
const assetAttachments = await listAttachmentsByTarget("ASSET", assetId);
```

### 2. CMDB Integration

**Use Cases**:

- Attach architecture diagrams to CIs
- Store configuration backup files
- Document compliance audit reports
- Attach runbooks and operational procedures

**Example**:

```typescript
// Attach network diagram to CI
await createAttachment({
  targetType: "CI",
  targetId: ciId,
  attachmentTypeId: diagramTypeId,
  fileName: "network-topology.png",
  // ... other fields
});

// Attach relationship documentation
await createAttachment({
  targetType: "CI_RELATIONSHIP",
  targetId: relationshipId,
  attachmentTypeId: documentTypeId,
  fileName: "dependency-documentation.pdf",
  // ... other fields
});
```

### 3. Asset Disposal Integration

**Use Cases**:

- Attach data sanitization certificates
- Store disposal authorization documents
- Document asset condition photos
- Attach environmental compliance certificates

**Example**:

```typescript
// Complete disposal workflow with attachments
const disposal = await createAssetDisposal({...});

// 1. Attach authorization
await createAttachment({
  targetType: "ASSET_DISPOSAL",
  targetId: disposal.id,
  attachmentTypeId: documentTypeId,
  fileName: "disposal-authorization.pdf",
  // ...
});

// 2. After sanitization, attach certificate
await createAttachment({
  targetType: "ASSET_DISPOSAL",
  targetId: disposal.id,
  attachmentTypeId: certificateTypeId,
  fileName: "sanitization-certificate.pdf",
  // ...
});
```

### 4. Warranty Integration

**Use Cases**:

- Store warranty certificate PDFs
- Attach extended warranty purchase documents
- Document warranty claim communications

**Example**:

```typescript
// Create warranty with certificate
const warranty = await createWarranty({...});

await createAttachment({
  targetType: "WARRANTY",
  targetId: warranty.id,
  attachmentTypeId: certificateTypeId,
  fileName: "warranty-certificate.pdf",
  // ...
});
```

### 5. Contract Management Integration

**Use Cases**:

- Attach signed contract PDFs
- Store amendments and addendums
- Document SLA agreements
- Attach vendor insurance certificates

**Example**:

```typescript
// Attach signed contract
await createAttachment({
  targetType: "CONTRACT",
  targetId: contractId,
  attachmentTypeId: contractTypeId,
  fileName: "signed-contract-2024.pdf",
  // ...
});
```

### 6. License Management Integration

**Use Cases**:

- Store license entitlement certificates
- Attach license key documents
- Document compliance audit reports

**Example**:

```typescript
// Attach license certificate
await createAttachment({
  targetType: "LICENSE_ENTITLEMENT",
  targetId: entitlementId,
  attachmentTypeId: certificateTypeId,
  fileName: "license-certificate.pdf",
  // ...
});
```

---

## File Structure

```
src/
├── core/
│   ├── domain/
│   │   └── entities/
│   │       ├── attachment-type.entity.ts             ✅
│   │       └── attachment.entity.ts                  ✅
│   ├── repositories/
│   │   ├── attachment-type.repository.interface.ts   ✅
│   │   └── attachment.repository.interface.ts        ✅
│   └── use-cases/
│       └── attachments/
│           ├── attachment-type/
│           │   ├── create-attachment-type.use-case.ts ✅
│           │   ├── get-attachment-type.use-case.ts    ✅
│           │   ├── list-attachment-types.use-case.ts  ✅
│           │   ├── update-attachment-type.use-case.ts ✅
│           │   ├── delete-attachment-type.use-case.ts ✅
│           │   └── index.ts                           ✅
│           └── attachment/
│               ├── create-attachment.use-case.ts      ✅
│               ├── get-attachment.use-case.ts         ✅
│               ├── list-attachments.use-case.ts       ✅
│               ├── get-attachments-by-target.use-case.ts ✅
│               ├── update-attachment.use-case.ts      ✅
│               ├── delete-attachment.use-case.ts      ✅
│               └── index.ts                           ✅
│
├── infrastructure/
│   ├── database/prisma/
│   │   └── schema.prisma                              ✅
│   └── repositories/
│       ├── prisma-attachment-type.repository.ts       ✅
│       └── prisma-attachment.repository.ts            ✅
│
├── interface-adapters/
│   ├── controllers/
│   │   ├── attachment-type.controller.ts              ✅
│   │   └── attachment.controller.ts                   ✅
│   ├── dtos/generated/
│   │   ├── attachment-type.dto.ts                     ✅
│   │   └── attachment.dto.ts                          ✅
│   └── presenters/
│       ├── attachment-type.presenter.ts               ✅
│       └── attachment.presenter.ts                    ✅
│
└── di/
    ├── types.ts                                        ✅
    └── modules/
        └── attachments.module.ts                       ✅
```

---

## DI Configuration

**Module**: `src/di/modules/attachments.module.ts`
**Registration**: `src/di/container.ts` line 123

```typescript
// Container registration
export function bindAttachmentsDependencies(container: Container) {
  // Repositories (singleton scope - shared connection pool)
  container
    .bind<IAttachmentTypeRepository>(DI_TOKENS.IAttachmentTypeRepository)
    .to(PrismaAttachmentTypeRepository)
    .inSingletonScope();

  container
    .bind<IAttachmentRepository>(DI_TOKENS.IAttachmentRepository)
    .to(PrismaAttachmentRepository)
    .inSingletonScope();

  // Use Cases (transient scope - stateless operations)
  container
    .bind<CreateAttachmentTypeUseCase>(DI_TOKENS.CreateAttachmentTypeUseCase)
    .to(CreateAttachmentTypeUseCase)
    .inTransientScope();

  // ... additional use case bindings (11 total)
}
```

---

## Performance Considerations

### Database Indexes

All critical query paths are indexed:

```prisma
// AttachmentType indexes
@@index([code])      // Unique code lookups
@@index([isActive])  // Filter active types

// Attachment indexes
@@index([attachmentTypeId])      // Filter by type
@@index([targetType, targetId])  // Critical for polymorphic queries
@@index([uploadedById])          // Filter by uploader
```

**Query Performance**:

- **Polymorphic Queries**: `[targetType, targetId]` composite index enables O(log n) lookups
- **Type Filtering**: `[attachmentTypeId]` supports fast filtering
- **User Queries**: `[uploadedById]` for "my attachments" dashboards

### Repository Optimizations

- **Singleton Scope**: Repositories share connection pool (efficient)
- **Transient Scope**: Use cases are stateless (no memory leaks)
- **Order By**: Results sorted by `uploadedAt DESC` (most recent first)

### File Storage Recommendations

**Current (Local Storage)**:

- Fast for on-premises deployment
- No network latency
- Limited by disk space

**Future (S3/MinIO)**:

- Horizontal scalability
- CDN integration for global performance
- Automatic compression and optimization
- Lifecycle policies for archival

---

## Testing Scenarios

### Scenario 1: Attachment Type CRUD

1. Create attachment type with validation rules
2. List all active attachment types
3. Update allowed extensions
4. Deactivate attachment type
5. Attempt to delete (should fail if attachments exist)

### Scenario 2: Polymorphic Attachment Creation

1. Create attachment for Asset
2. Create attachment for CI
3. Create attachment for Contract
4. Query all attachments by target
5. Verify correct association

### Scenario 3: File Validation

1. Attempt to upload file exceeding size limit (should fail)
2. Attempt to upload file with disallowed extension (should fail)
3. Upload valid file (should succeed)
4. Verify computed fields (file size, extension, MIME type)

### Scenario 4: Bulk Attachment Management

1. Upload 10 attachments to single entity
2. Query all attachments for entity
3. Update metadata for multiple attachments
4. Delete selected attachments
5. Verify correct count remaining

---

## Future Enhancements

### Planned Features

1. **File Upload Service**
   - Multipart upload for large files
   - Progress tracking
   - Chunked upload with resume capability
   - Client-side file validation before upload

2. **Cloud Storage Integration**
   - S3-compatible API
   - Pre-signed URL generation
   - Automatic HTTPS encryption
   - CDN integration

3. **File Preview**
   - PDF viewer component
   - Image lightbox
   - Document thumbnail generation
   - Video player for media files

4. **Advanced Search**
   - Full-text search in file names
   - Filter by file type, size, date range
   - Search across all target types
   - Tag-based organization

5. **Versioning**
   - Track file versions
   - Restore previous versions
   - Compare versions
   - Version history timeline

6. **Virus Scanning**
   - Integration with ClamAV or similar
   - Scan on upload
   - Quarantine infected files
   - Audit log for security events

7. **Audit Trail**
   - Track downloads
   - Record view access
   - Export audit logs
   - Compliance reporting

---

## Support & Troubleshooting

### Common Issues

**Q: File upload fails with "File too large" error**

A: Check:

1. AttachmentType `maxFileSizeMB` setting
2. Default limit is 100MB in entity validation
3. Web server upload limits (nginx/apache)
4. Application server limits (Next.js)

**Q: Cannot delete AttachmentType**

A: AttachmentType deletion is **restricted** if attachments exist. Either:

- Delete all attachments first
- Deactivate the type instead: `updateAttachmentType(id, { isActive: false })`

**Q: Permission denied when viewing attachments**

A: Verify user has appropriate permissions:

- Check user roles
- Verify role has `ATTACHMENTS_VIEW` permission
- Re-seed RBAC if needed: `npm run seed:rbac`

**Q: File path not resolving**

A: Ensure:

1. `filePath` is stored correctly (relative or absolute)
2. File exists in storage location
3. Web server has read permissions
4. Storage directory is mounted correctly (if using Docker)

---

## Changelog

### Version 1.0.0 (Current - Backend Complete)

**Added**:

- ✅ Complete AttachmentType entity with validation rules
- ✅ Complete Attachment entity with polymorphic support
- ✅ 11 use cases (5 AttachmentType + 6 Attachment)
- ✅ Prisma repositories with full CRUD
- ✅ 11 server action controllers
- ✅ RBAC with 10 permission levels
- ✅ Zod validation schemas
- ✅ Entity presenters with computed fields
- ✅ DI container bindings
- ✅ Polymorphic target support (23 entity types)
- ✅ Database schema with optimized indexes

**Pending**:

- ⏳ UI components (upload form, file list, preview)
- ⏳ File upload service with progress tracking
- ⏳ Cloud storage integration (S3/MinIO)
- ⏳ File preview components
- ⏳ Advanced search and filtering
- ⏳ Version control system
- ⏳ Virus scanning integration
- ⏳ Download audit trail

---

## See Also

- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Overview of all ITAM modules
- [WARRANTY_SYSTEM.md](./WARRANTY_SYSTEM.md) - Warranty management (reference for attachment integration)
- [ASSET_DISPOSALS.md](./ASSET_DISPOSALS.md) - Disposal workflow with certificate attachments
- [CMDB_GUIDE.md](./CMDB_GUIDE.md) - CI documentation with diagram attachments
- [DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md) - Schema design patterns
- [DEVELOPER_GUIDE.md](./guides/DEVELOPER_GUIDE.md) - Development patterns
- [RBAC_DEVELOPER_GUIDE.md](./guides/RBAC_DEVELOPER_GUIDE.md) - Permission system

---

## License & Credits

Part of the Barq Assets CMDB/ITAM system.
Built with Clean Architecture principles for a SAMA-regulated financial services environment.

**Technology Stack**:

- Next.js 16 (Turbopack)
- Prisma 7 (PostgreSQL)
- InversifyJS 7 (Dependency Injection)
- Zod 4 (Validation)
- TypeScript 5.9

**Architecture**: 5-layer Clean Architecture (Presentation → Interface Adapters → Use Cases → Domain ← Infrastructure)

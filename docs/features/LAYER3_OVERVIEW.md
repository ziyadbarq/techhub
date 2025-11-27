# Layer 3: Advanced ITAM Features

This document provides a comprehensive overview of all Layer 3 (Advanced ITAM) modules implemented in the system.

## Overview

Layer 3 consists of **10 advanced modules** built with Clean Architecture patterns, providing enterprise-grade IT asset management capabilities beyond basic asset tracking.

**Total**: ~35 entities, 31+ database tables, 195+ use cases

## Modules

### 1. Asset Disposals

**Route**: `/asset-disposals`
**Permission**: `ASSET_DISPOSALS_VIEW`
**Documentation**: [ASSET_DISPOSALS.md](ASSET_DISPOSALS.md)

**Entities**: AssetDisposal, DisposalApproval, DisposalDocument (3 entities, 11 use cases)

**Features**:
- Multi-step approval workflow: PENDING_APPROVAL → APPROVED → IN_PROGRESS → SANITIZED → COMPLETED
- Approval chain with multiple approvers
- Data sanitization checklist for compliance
- PDF certificate generation (ready for integration)
- Full audit trail for regulatory compliance

**Key Permissions**:
- `ASSET_DISPOSALS_VIEW`, `ASSET_DISPOSALS_CREATE`, `ASSET_DISPOSALS_UPDATE`, `ASSET_DISPOSALS_DELETE`
- `ASSET_DISPOSALS_APPROVE`, `ASSET_DISPOSALS_REJECT`, `ASSET_DISPOSALS_START`, `ASSET_DISPOSALS_COMPLETE`, `ASSET_DISPOSALS_CANCEL`
- `ASSET_DISPOSALS_MANAGE`

---

### 2. Asset Kits

**Route**: `/asset-kits`
**Permission**: `ASSET_KITS_VIEW`
**Documentation**: [ASSET_KITS.md](ASSET_KITS.md)

**Entities**: AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem (4 entities, 19 use cases)

**Features**:
- Predefined bundles (e.g., "New Hire Kit" = laptop + mouse + keyboard + monitor)
- Kit builder with item quantity tracking
- Checkout workflow with partial returns support
- Individual item status tracking (active, damaged, lost, returned)
- Automatic asset reservation during checkout

**Key Permissions**:
- `ASSET_KITS_VIEW`, `ASSET_KITS_CREATE`, `ASSET_KITS_UPDATE`, `ASSET_KITS_DELETE`
- `ASSET_KITS_CHECKOUT`, `ASSET_KITS_RETURN`
- `ASSET_KITS_MANAGE`

---

### 3. Asset Reservations

**Route**: `/asset-reservations`
**Permission**: `ASSET_RESERVATIONS_VIEW`
**Documentation**: [ASSET_RESERVATIONS.md](ASSET_RESERVATIONS.md)

**Entities**: AssetReservation, AssetReservationConflict (2 entities, 17 use cases)

**Features**:
- Future date reservations with start/end time
- Conflict detection engine (prevents double-booking)
- Availability checker across date ranges
- Calendar view integration (ready for `react-big-calendar`)
- Background job infrastructure (activation, reminders, overdue checks)
- Status workflow: PENDING → CONFIRMED → ACTIVE → COMPLETED/CANCELLED

**Key Permissions**:
- `ASSET_RESERVATIONS_VIEW`, `ASSET_RESERVATIONS_CREATE`, `ASSET_RESERVATIONS_UPDATE`, `ASSET_RESERVATIONS_DELETE`
- `ASSET_RESERVATIONS_CANCEL`, `ASSET_RESERVATIONS_CONFIRM`
- `ASSET_RESERVATIONS_MANAGE`

---

### 4. Configuration Management Database (CMDB)

**Routes**:
- `/configuration-items`
- `/ci-relationships`
- `/relationship-types`
- `/ci-classes`
- `/relationship-type-scopes`

**Permissions**: `CONFIGURATION_ITEMS_VIEW`, `CI_RELATIONSHIPS_VIEW`, `RELATIONSHIP_TYPES_VIEW`
**Documentation**: [CMDB_GUIDE.md](CMDB_GUIDE.md)

**Entities**: ConfigurationItem, CIRelationship, RelationshipType, CIClass, CIClassField, RelationshipTypeScope (6 entities, 28 use cases)

**Features**:
- Configuration Items (CIs) with CI classes and lifecycle tracking
- Relationship Types with bidirectional support (DEPENDS_ON, RUNS_ON, INSTALLED_ON, CONNECTS_TO, etc.)
- CI Relationships with validity periods and active/inactive state
- Impact analysis support (isImpacting flag for dependency tracking)
- Dependency graph foundation (ready for visualization)
- Integration with Service Management module

**Key Permissions**:
- **Configuration Items**: `CONFIGURATION_ITEMS_VIEW`, `CONFIGURATION_ITEMS_CREATE`, `CONFIGURATION_ITEMS_UPDATE`, `CONFIGURATION_ITEMS_DELETE`, `CONFIGURATION_ITEMS_MANAGE`
- **CI Relationships**: `CI_RELATIONSHIPS_VIEW`, `CI_RELATIONSHIPS_CREATE`, `CI_RELATIONSHIPS_UPDATE`, `CI_RELATIONSHIPS_DELETE`, `CI_RELATIONSHIPS_MANAGE`
- **Relationship Types**: `RELATIONSHIP_TYPES_VIEW`, `RELATIONSHIP_TYPES_CREATE`, `RELATIONSHIP_TYPES_UPDATE`, `RELATIONSHIP_TYPES_DELETE`, `RELATIONSHIP_TYPES_MANAGE`
- **CI Classes**: `CI_CLASSES_VIEW`, `CI_CLASSES_CREATE`, `CI_CLASSES_UPDATE`, `CI_CLASSES_DELETE`, `CI_CLASSES_MANAGE`
- **CI Class Fields**: `CI_CLASS_FIELDS_VIEW`, `CI_CLASS_FIELDS_CREATE`, `CI_CLASS_FIELDS_UPDATE`, `CI_CLASS_FIELDS_DELETE`, `CI_CLASS_FIELDS_MANAGE`
- **Relationship Type Scopes**: `RELATIONSHIP_TYPE_SCOPES_VIEW`, `RELATIONSHIP_TYPE_SCOPES_CREATE`, `RELATIONSHIP_TYPE_SCOPES_UPDATE`, `RELATIONSHIP_TYPE_SCOPES_DELETE`, `RELATIONSHIP_TYPE_SCOPES_MANAGE`

---

### 5. Service Management

**Routes**:
- `/services`
- `/business-processes`

**Permissions**: `SERVICES_VIEW`, `BUSINESS_PROCESSES_VIEW`
**Documentation**: [SERVICE_MANAGEMENT.md](SERVICE_MANAGEMENT.md), In-app docs at `/docs/service-management`

**Entities**: Service, ServiceOwnership, BusinessProcess, ServiceInfrastructure, ServiceAsset (5 entities, 25 use cases)

**Features**:
- Service catalog with 80+ seeded services (applications, databases, APIs, infrastructure)
- Multiple ownership types with primary owner designation:
  - Technical Owner (day-to-day operations)
  - Product Owner (roadmap, features)
  - Business Owner (funding, business value)
- NDMO framework classification (data confidentiality, business impact, criticality)
- Business processes linked to services for business-IT alignment
- Service infrastructure tracking (location, cloud provider, region, IP addresses, backup configuration)
- Asset linking with relationship types (HOSTS, SUPPORTS, DEPENDS_ON, MONITORS, BACKS_UP)
- Essential service designation for SAMA compliance
- Lifecycle management (deployment dates, patch schedules, decommission planning)

**Key Permissions**:
- **Services**: `SERVICES_VIEW`, `SERVICES_CREATE`, `SERVICES_UPDATE`, `SERVICES_DELETE`, `SERVICES_MANAGE`
- **Business Processes**: `BUSINESS_PROCESSES_VIEW`, `BUSINESS_PROCESSES_CREATE`, `BUSINESS_PROCESSES_UPDATE`, `BUSINESS_PROCESSES_DELETE`, `BUSINESS_PROCESSES_MANAGE`

---

### 6. Contract Management

**Routes**:
- `/contract-types`
- `/contracts`

**Permissions**: `CONTRACT_TYPES_VIEW`, `CONTRACTS_VIEW`
**Documentation**: Detailed in ITAM_FEATURES.md

**Entities**: ContractType, Contract, ContractLinkedObject (3 entities, 17 use cases)

**Features**:
- Contract Types with customizable field definitions
- Contracts with vendor linkage and lifecycle dates (start, end, renewal)
- Polymorphic linking to Assets, Configuration Items, and License Products
- Financial tracking with contract values and renewal management
- Renewal notification infrastructure (ready for automation)

**Key Permissions**:
- **Contract Types**: `CONTRACT_TYPES_VIEW`, `CONTRACT_TYPES_CREATE`, `CONTRACT_TYPES_UPDATE`, `CONTRACT_TYPES_DELETE`, `CONTRACT_TYPES_MANAGE`
- **Contracts**: `CONTRACTS_VIEW`, `CONTRACTS_CREATE`, `CONTRACTS_UPDATE`, `CONTRACTS_DELETE`, `CONTRACTS_MANAGE`
- **Contract Linked Objects**: `CONTRACT_LINKED_OBJECTS_VIEW`, `CONTRACT_LINKED_OBJECTS_CREATE`, `CONTRACT_LINKED_OBJECTS_UPDATE`, `CONTRACT_LINKED_OBJECTS_DELETE`, `CONTRACT_LINKED_OBJECTS_MANAGE`

---

### 7. License Management

**Routes**:
- `/license-products`
- `/license-entitlements`
- `/license-allocations`

**Permissions**: `LICENSE_PRODUCTS_VIEW`, `LICENSE_ENTITLEMENTS_VIEW`, `LICENSE_ALLOCATIONS_VIEW`
**Documentation**: [LICENSE_MANAGEMENT.md](LICENSE_MANAGEMENT.md)

**Entities**: LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation, LicenseAddon, LicenseEntitlementAddon (6 entities, 33 use cases)

**Features**:
- License Products with multiple metric types:
  - `per_device` - Device-based licensing
  - `per_user` - User-based licensing
  - `per_core` - CPU core-based licensing
  - `per_vm` - Virtual machine licensing
  - `per_cluster` - Cluster-based licensing
- License Entitlements with purchased quantities and validity date ranges
- **Cost Tracking** with multi-currency support:
  - Unit cost per license (cost per seat/device/core)
  - Total cost calculation (unit cost × quantity)
  - Dual currency display (original + SAR conversion)
- **License Addons** for extras like premium support, training, maintenance
  - Product-level addon templates
  - Entitlement-level addon attachments with quantity overrides
  - Addon cost aggregation in total cost calculation
- Polymorphic allocations to Persons, Configuration Items, or Assets
- Available quantity tracking (purchased - allocated)
- Soft deactivation support (deallocate/reactivate without deletion)
- Compliance tracking and over-allocation prevention

**Key Permissions**:
- **License Products**: `LICENSE_PRODUCTS_VIEW`, `LICENSE_PRODUCTS_CREATE`, `LICENSE_PRODUCTS_UPDATE`, `LICENSE_PRODUCTS_DELETE`, `LICENSE_PRODUCTS_MANAGE`
- **License Product Fields**: `LICENSE_PRODUCT_FIELDS_VIEW`, `LICENSE_PRODUCT_FIELDS_CREATE`, `LICENSE_PRODUCT_FIELDS_UPDATE`, `LICENSE_PRODUCT_FIELDS_DELETE`, `LICENSE_PRODUCT_FIELDS_MANAGE`
- **License Entitlements**: `LICENSE_ENTITLEMENTS_VIEW`, `LICENSE_ENTITLEMENTS_CREATE`, `LICENSE_ENTITLEMENTS_UPDATE`, `LICENSE_ENTITLEMENTS_DELETE`, `LICENSE_ENTITLEMENTS_MANAGE`
- **License Allocations**: `LICENSE_ALLOCATIONS_VIEW`, `LICENSE_ALLOCATIONS_CREATE`, `LICENSE_ALLOCATIONS_UPDATE`, `LICENSE_ALLOCATIONS_DELETE`, `LICENSE_ALLOCATIONS_DEALLOCATE`, `LICENSE_ALLOCATIONS_REACTIVATE`, `LICENSE_ALLOCATIONS_MANAGE`

---

### 8. Governance & Compliance

**Routes**:
- `/data-domains`
- `/data-ownerships`
- `/verification-campaigns`

**Permissions**: `DATA_DOMAINS_VIEW`, `DATA_OWNERSHIPS_VIEW`, `VERIFICATION_CAMPAIGNS_VIEW`
**Documentation**: [GOVERNANCE_SYSTEM.md](GOVERNANCE_SYSTEM.md)

**Entities**: DataDomain, DataOwnership, VerificationCampaign, VerificationItem (4 entities, 24 use cases)

**Features**:
- Data Domains for data classification (PII, Financial Data, Customer Data, etc.)
- Data Ownerships with flexible polymorphic mapping:
  - Asset Category OR CI Class (what owns the data)
  - Person OR Organization Unit (who owns the data)
- Verification Campaigns for scheduled compliance audits
- Verification Items with status tracking workflow:
  - PENDING → IN_PROGRESS → VERIFIED / EXCEPTION / FAILED
- SAMA compliance support with full audit trails
- Integration with Asset and CMDB modules

**Key Permissions**:
- **Data Domains**: `DATA_DOMAINS_VIEW`, `DATA_DOMAINS_CREATE`, `DATA_DOMAINS_UPDATE`, `DATA_DOMAINS_DELETE`, `DATA_DOMAINS_MANAGE`
- **Data Ownerships**: `DATA_OWNERSHIPS_VIEW`, `DATA_OWNERSHIPS_CREATE`, `DATA_OWNERSHIPS_UPDATE`, `DATA_OWNERSHIPS_DELETE`, `DATA_OWNERSHIPS_MANAGE`
- **Verification Campaigns**: `VERIFICATION_CAMPAIGNS_VIEW`, `VERIFICATION_CAMPAIGNS_CREATE`, `VERIFICATION_CAMPAIGNS_UPDATE`, `VERIFICATION_CAMPAIGNS_DELETE`, `VERIFICATION_CAMPAIGNS_START`, `VERIFICATION_CAMPAIGNS_COMPLETE`, `VERIFICATION_CAMPAIGNS_MANAGE`
- **Verification Items**: `VERIFICATION_ITEMS_VIEW`, `VERIFICATION_ITEMS_CREATE`, `VERIFICATION_ITEMS_UPDATE`, `VERIFICATION_ITEMS_DELETE`, `VERIFICATION_ITEMS_VERIFY`, `VERIFICATION_ITEMS_MANAGE`

---

### 9. Attachments & Documents

**Routes**:
- `/attachment-types`
- `/attachments`

**Permissions**: `ATTACHMENT_TYPES_VIEW`, `ATTACHMENTS_VIEW`
**Documentation**: [ATTACHMENTS_SYSTEM.md](ATTACHMENTS_SYSTEM.md)

**Entities**: AttachmentType, Attachment (2 entities, 11 use cases)

**Features**:
- Attachment Types with file validation rules (allowed extensions, max file size)
- Universal polymorphic attachments to any entity type (23 supported target types):
  - Assets, Configuration Items, Contracts, Warranties, Disposals
  - License Products/Entitlements/Allocations
  - Services, Business Processes
  - Verification Campaigns/Items
  - And more...
- File metadata tracking (fileName, mimeType, sizeBytes, storagePath, uploadedBy, uploadedAt)
- Business helper methods (isImage, isPDF, isDocument, getFormattedFileSize)
- Ready for compliance documentation, invoices, certificates, audit reports, photos
- Integration foundation for cloud storage (S3, Azure Blob, etc.)

**Key Permissions**:
- **Attachment Types**: `ATTACHMENT_TYPES_VIEW`, `ATTACHMENT_TYPES_CREATE`, `ATTACHMENT_TYPES_UPDATE`, `ATTACHMENT_TYPES_DELETE`, `ATTACHMENT_TYPES_MANAGE`
- **Attachments**: `ATTACHMENTS_VIEW`, `ATTACHMENTS_CREATE`, `ATTACHMENTS_UPDATE`, `ATTACHMENTS_DELETE`, `ATTACHMENTS_DOWNLOAD`, `ATTACHMENTS_MANAGE`

---

### 10. Intune Integration

**Routes**:
- `/intune/devices`
- `/intune/devices/[id]`
- `/intune/compliance` (planned)

**Permissions**: `INTUNE_DEVICES_VIEW`, `INTUNE_COMPLIANCE_VIEW`
**Feature Flag**: `INTUNE`
**Documentation**: [INTUNE_INTEGRATION.md](INTUNE_INTEGRATION.md)

**Entities**: IntuneDevice, IntuneComplianceHistory (2 entities, 9 use cases)

**Features**:
- Microsoft Intune device synchronization via MS Graph API
- Device compliance tracking (COMPLIANT, NON_COMPLIANT, IN_GRACE_PERIOD, etc.)
- Ownership type tracking (CORPORATE, PERSONAL, UNKNOWN)
- Auto-linking to ITAM Assets via serial number matching
- Auto-linking to ITAM Persons via Azure AD user ID
- Compliance history tracking for SAMA governance
- Security status monitoring (encryption, supervised, jailbroken)
- Scheduled background sync job (daily at 3 AM UTC)
- Manual sync trigger via UI

**Key Permissions**:
- **Intune Devices**: `INTUNE_DEVICES_VIEW`, `INTUNE_DEVICES_SYNC`, `INTUNE_DEVICES_LINK`, `INTUNE_DEVICES_MANAGE`
- **Intune Compliance**: `INTUNE_COMPLIANCE_VIEW`

---

## Database Implementation

**Total Tables**: 31+ new tables

**Breakdown by Module**:
- CMDB: 6 tables (ConfigurationItem, CIRelationship, RelationshipType, CIClass, CIClassField, RelationshipTypeScope)
- Service Management: 5 tables (Service, ServiceOwnership, BusinessProcess, ServiceInfrastructure, ServiceAsset)
- Contracts: 3 tables (ContractType, Contract, ContractLinkedObject)
- Licenses: 6 tables (LicenseProduct, LicenseProductField, LicenseEntitlement, LicenseAllocation, LicenseAddon, LicenseEntitlementAddon)
- Governance: 4 tables (DataDomain, DataOwnership, VerificationCampaign, VerificationItem)
- Disposals: 3 tables (AssetDisposal, DisposalApproval, DisposalDocument)
- Asset Kits: 4 tables (AssetKit, AssetKitItem, AssetKitCheckout, AssetKitCheckoutItem)
- Reservations: 2 tables (AssetReservation, AssetReservationConflict)
- Attachments: 2 tables (AttachmentType, Attachment)
- Intune: 2 tables (IntuneDevice, IntuneComplianceHistory)

**Schema Documentation**: See [DATABASE_SCHEMA.md](../architecture/DATABASE_SCHEMA.md) for complete schema design

---

## Dependency Injection Configuration

All Layer 3 modules are registered in `src/di/container.ts`:

**Module Binding Functions**:
- `bindCMDBDependencies()` - CMDB entities and relationships
- `bindServiceDependencies()` - Service catalog, business processes, infrastructure, asset linking
- `bindContractsDependencies()` - Contract management system
- `bindLicensesDependencies()` - License management system
- `bindGovernanceDependencies()` - Governance features (data domains, ownerships, verification)
- `bindAttachmentsDependencies()` - Universal attachment system
- `bindIntuneDependencies()` - Intune device sync and compliance tracking
- `loadDisposalModule()` - Asset disposal workflows
- `loadAssetKitsModule()` - Asset kit bundles and checkouts
- `loadReservationsModule()` - Asset reservation system

**Registration**: All modules are automatically initialized when the DI container loads

---

## Navigation Structure

New navigation groups added with permission-based filtering:

- **CMDB Group**: Configuration Items, CI Relationships, Relationship Types, CI Classes
- **Services Group**: Service Catalog, Business Processes
- **Contracts Group**: Contract Types, Contracts
- **Licenses Group**: License Products, License Entitlements, License Allocations
- **Governance Group**: Data Domains, Data Ownerships, Verification Campaigns
- **Attachments Group**: Attachment Types, Attachments
- **Intune Group**: Managed Devices, Compliance Status
- **Asset Operations Group**: Disposals, Kits, Reservations (alongside existing Asset features)

**Auto-Filtering**: Navigation items automatically hide based on user permissions and feature flags

**See**: `src/lib/navigation.ts` for complete navigation configuration

---

## Feature Integration

Layer 3 modules integrate with each other and with Layer 1 (Foundation) and Layer 2 (Assets):

**Cross-Module Relationships**:
- **Contracts** link to Assets, CIs, and License Products
- **License Allocations** link to Persons (Layer 1), CIs (Layer 3), or Assets (Layer 2)
- **Service Assets** link Services to physical/virtual Assets
- **Service Infrastructure** links Services to Configuration Items
- **Attachments** link to all entities across all layers
- **Governance Data Ownerships** link to Asset Categories (Layer 2) or CI Classes (Layer 3)
- **Asset Kits** integrate with Asset Reservations for checkout workflow
- **Intune Devices** link to Assets (via serial number) and Persons (via Azure AD user ID)

**SAMA Compliance**:
- Service Management: Essential service tracking
- Governance: Data classification and verification campaigns
- Attachments: Compliance documentation and audit trails
- Asset Disposals: Data sanitization checklists and certificates
- Intune Integration: Device compliance monitoring and historical tracking

---

## Development Resources

**Adding New Layer 3 Features**:
1. Follow Clean Architecture patterns (see [ARCHITECTURE.md](../architecture/ARCHITECTURE.md))
2. Implement all 5 layers: Domain → Use Cases → Controllers → Repositories → Presentation
3. Create barrel exports (`index.ts`) in use case modules
4. Register DI bindings in `src/di/container.ts`
5. Add navigation entries with permission checks
6. Update RBAC permissions and permission groups
7. Create comprehensive documentation

**Reference Implementations**:
- **Simple Module**: Attachments (2 entities, basic CRUD)
- **Medium Module**: Contract Management (3 entities, polymorphic relationships)
- **Complex Module**: Service Management (5 entities, multiple ownership types, infrastructure tracking)

**See**: [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) section "Adding a New Feature" for complete step-by-step guide

---

## Related Documentation

- [ITAM_FEATURES.md](ITAM_FEATURES.md) - Original Layer 3 implementation overview
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) - Clean Architecture implementation
- [RBAC_DEVELOPER_GUIDE.md](../guides/RBAC_DEVELOPER_GUIDE.md) - Permission system implementation
- [FEATURE_FLAGS.md](FEATURE_FLAGS.md) - Feature flag system for Layer 3 modules
- Individual feature documentation files linked in each module section above

# Asset Disposals System

**Multi-step disposal workflow with approval chain and certificate generation**

## Overview

The Asset Disposals module manages end-of-life asset processing through a structured workflow with approval chains, data sanitization tracking, and certificate generation.

## Workflow States

```
PENDING_APPROVAL → User creates disposal request
     ↓
APPROVED        → Approvers review and approve
     ↓
IN_PROGRESS     → Disposal process begins
     ↓
SANITIZED       → Data sanitization completed
     ↓
COMPLETED       → Disposal finished with certificate
```

**Alternative Paths**:

- PENDING_APPROVAL → REJECTED (Approval denied)
- Any State → CANCELLED (Process cancelled)

## Key Features

- **Multi-Approver Workflow**: Assign multiple approvers with individual approval tracking
- **Disposal Types**: SELL, DONATE, RECYCLE, DESTROY, RETURN_TO_VENDOR, OTHER
- **Sanitization Checklist**: Track data wiping and security measures
- **Document Tracking**: Upload disposal-related documents
- **Certificate Generation**: Ready for PDF certificate of destruction
- **Estimated Value**: Track disposal proceeds or costs

## Routes & Permissions

**Route**: `/asset-disposals`
**Permissions**: `ASSET_DISPOSALS_*` (VIEW, CREATE, UPDATE, DELETE, APPROVE, REJECT, START, COMPLETE, CANCEL, MANAGE)

## Database Schema

**Tables**:

1. `asset_disposals` - Main disposal records
2. `disposal_approvals` - Approval tracking per approver
3. `disposal_documents` - Supporting documents

## Use Cases (12)

- Create, Get, List, Delete disposal requests
- Approve, Reject disposal
- Start, Complete Sanitization, Complete disposal
- Generate certificate, Cancel disposal

## See Also

- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Complete ITAM overview
- [CMDB_GUIDE.md](./CMDB_GUIDE.md) - CMDB implementation

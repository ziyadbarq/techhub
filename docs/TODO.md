# Implementation TODO

**Last Updated**: 2025-11-22

Priority-ordered list of features to implement next.

## High Priority (1-2 days)

### 1. License Entitlements Table Component
**Effort**: 3-4 hours
**Files Needed**:
- `src/components/license-entitlements/license-entitlements-table.tsx`
- Update `src/app/(dashboard)/license-entitlements/page.tsx`

**Features**:
- Show purchased quantity, allocated quantity, available quantity
- Display effective dates with expiry badges
- Link to license product
- Usage gauge visualization

### 2. License Allocations Table Component
**Effort**: 3-4 hours
**Files Needed**:
- `src/components/license-allocations/license-allocations-table.tsx`
- Update `src/app/(dashboard)/license-allocations/page.tsx`

**Features**:
- Polymorphic target display (Person/CI/Asset)
- Show allocated quantity
- Deallocate/Reactivate actions
- Active status badge

### 3. Contracts Create/Edit Forms
**Effort**: 4-6 hours
**Files Needed**:
- `src/app/(dashboard)/contracts/new/page.tsx`
- `src/app/(dashboard)/contracts/[id]/edit/page.tsx`
- `src/components/contracts/contract-form.tsx`

**Features**:
- Multi-step form (basic info, dates, linked objects)
- Vendor selector
- Contract type selector
- Date range picker
- Auto-renew toggle

### 4. Contract Detail Page
**Effort**: 3-4 hours
**Files Needed**:
- `src/app/(dashboard)/contracts/[id]/page.tsx`
- `src/components/contracts/contract-detail-view.tsx`
- `src/components/contracts/contract-linked-objects-section.tsx`

**Features**:
- Contract overview
- Linked objects display (polymorphic)
- Renewal information
- Status badges (active/expired)

## Medium Priority (3-5 days)

### 5. Reservation Calendar View
**Effort**: 4-6 hours
**Status**: `react-big-calendar` already installed
**Files**:
- Update `src/app/(dashboard)/asset-reservations/page.tsx`
- Add calendar/list view toggle
- Color code by status

### 6. License Product Forms
**Effort**: 4-6 hours
**Files Needed**:
- `src/components/license-products/license-product-form.tsx`
- Update page with create/edit dialog

**Features**:
- Vendor selector
- Metric type selector
- Custom field builder integration
- Lifecycle model selector

### 7. License Entitlement Forms
**Effort**: 3-4 hours
**Features**:
- License product selector
- Contract linkage
- Quantity input
- Date range picker
- Scope definition

### 8. License Allocation Forms
**Effort**: 4-5 hours
**Features**:
- Entitlement selector
- Polymorphic target selector (Person/CI/Asset)
- Quantity validation against available
- Allocation notes

## Low Priority (Future)

### 9. Dashboard Widgets - Real Data
**Effort**: 4-6 hours
**Files**: All dashboard widget components
**Issue**: Currently using mock data

### 10. Contract Linked Objects CRUD
**Effort**: 2-3 hours
**Status**: Backend exists, needs UI

### 11. Mock Email Service → Production
**Effort**: 4-6 hours
**Action**: Replace with SendGrid/AWS SES

### 12. Settings Page - User Profile Updates
**Effort**: 2-3 hours
**Issue**: Form exists but save is placeholder

## Roadmap Features (Planned)

See `/roadmap` directory for full specifications:

1. **Seed Mode Separation** - Split essential vs full seeds (2-3 hours)
2. **Security Patch Workflow** - Automated patch tracking (2-3 days)
3. **Multi-Currency Support** - SAR-primary with FX rates (2-3 days)
4. **Service Management System** - IT service catalog (5-7 days)
5. **Schema-API Alignment** - Complete remaining phases (6-8 days)

## Quick Wins (Start Here)

If you want to make the system immediately more functional:

1. **License Entitlements Table** (3-4 hours) - Makes license tracking usable
2. **License Allocations Table** (3-4 hours) - Shows who has what
3. **Contracts Create Form** (4-6 hours) - Enables contract creation
4. **Calendar View for Reservations** (4-6 hours) - Visual reservation management

**Total Quick Wins**: 14-20 hours of work for major functionality boost

## Development Notes

- All controllers already exist and are functional
- All backend use cases implemented
- All DTOs and presenters ready
- Focus is purely on UI components
- No database changes needed
- No new permissions required

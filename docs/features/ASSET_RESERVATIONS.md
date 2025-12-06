# Asset Reservation System

**Pre-assignment workflow for holding assets before formal assignment to employees**

## Overview

The Asset Reservations module is a production-ready system that enables administrators to reserve assets as a temporary hold before assigning them to employees. This is NOT a booking/calendar system - it's a pre-assignment workflow where reservations automatically cancel when the asset is assigned.

## Key Concept: Pre-Assignment Workflow

**Asset Lifecycle**:
```
AVAILABLE → RESERVED → ASSIGNED
```

1. **Available**: Asset is in inventory, no reservations, no assignments
2. **Reserved**: Asset is on hold for planned assignment to a specific employee (e.g., new hire starting next week)
3. **Assigned**: Asset is formally assigned to employee, reservation automatically cancelled

**Critical Business Rules**:
- ✅ **Strict one-at-a-time**: Only ONE active reservation per asset at any time
- ✅ **Cannot reserve assigned assets**: Reservations blocked if asset has active assignment
- ✅ **Auto-cancellation**: When asset is assigned, any active reservation is automatically cancelled
- ✅ **Cannot assign reserved assets**: Assignment workflow checks for active reservations
- ✅ **Expiration**: Reservations expire after end date (default 30 days) if not assigned

## Use Case Example

**Scenario**: New employee "Ahmed" is starting on Dec 15th. IT Admin reserves a laptop for him on Dec 1st.

```typescript
// Dec 1st: Reserve laptop for Ahmed (who starts Dec 15th)
const reservation = await createReservation({
  assetId: "laptop-macbook-pro-15",
  reservedForPersonId: "ahmed-person-id",  // The new employee
  startDate: new Date("2024-12-01"),       // Today
  endDate: new Date("2024-12-31"),         // 30 days default
  purpose: "New hire onboarding",
});
// Status: PENDING
// Asset is now "held" for Ahmed - no one else can reserve or assign it

// Dec 15th: Ahmed starts, admin assigns the laptop from reservations page
await assignAssetToEmployee({
  assetId: "laptop-macbook-pro-15",
  personId: "ahmed-person-id",
  // Reservation automatically cancelled with reason: "Asset assigned"
});
// Reservation status: CANCELLED
// Asset assignment status: ACTIVE
```

**What if reservation expires without assignment?**
- Background job marks reservation as COMPLETED after end date
- Asset returns to AVAILABLE status
- Admin can create new reservation or assign to someone else

## Reservation States

```
PENDING    → Initial reservation (asset on hold)
  ↓
CONFIRMED  → Reservation confirmed (optional approval step)
  ↓
ACTIVE     → Start date reached, still waiting for assignment
  ↓
COMPLETED  → End date reached, asset returned to available pool
```

**Alternative Paths**:
- Any State → **CANCELLED** (manually cancelled OR auto-cancelled on assignment)

**Note**: Most workflows go directly from PENDING → CANCELLED (via assignment). ACTIVE and COMPLETED states exist for expiration handling when reservations are not fulfilled.

## Routes & Permissions

**Route**: `/asset-reservations`
**Permissions**: `ASSET_RESERVATIONS_*` (VIEW, CREATE, UPDATE, DELETE, CANCEL, CONFIRM, MANAGE)

**Views**:

- **List View**: TanStack Table showing all reservations with action buttons
  - **Assign Button**: Click to assign reserved asset to the reserved employee (completes workflow)
  - **Cancel Button**: Cancel reservation if no longer needed
  - Shows: Asset tag, reserved for person, dates, status, purpose
  - Simple, focused interface for pre-assignment workflow

### Asset Detail Integration

The Asset detail page (`/assets/[assetTag]`) includes a **Reservations tab** showing all reservations for that asset:

- **Component**: `src/components/assets/asset-reservations-tab.tsx`
- **Controller Action**: `listReservationsByAssetAction(assetId)`
- Shows: Purpose, date range, reserved by person, status badge
- Quick actions: Cancel reservation, Assign asset

## Database Schema

**Tables**:

1. `asset_reservations` - Reservation records with person/org unit assignment
2. `asset_reservation_conflicts` - Legacy conflict detection (currently unused in simple workflow)

**Key Fields**:
- `assetId`: The asset being reserved
- `reservedForPersonId`: Employee who will receive the asset (XOR with orgunit)
- `reservedForOrgUnitId`: Organizational unit (XOR with person)
- `reservedById`: Admin who created the reservation
- `startDate`: Reservation start (usually immediate)
- `endDate`: Expiration date if not assigned (default +30 days)
- `status`: PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED
- `cancelledAt`, `cancelledById`, `cancellationReason`: Auto-filled on assignment

## Use Cases

**Core Workflow**:
- `CreateReservationUseCase` - Reserve asset for employee (blocks if assigned/reserved)
- `CancelReservationUseCase` - Manual cancellation (also used for auto-cancel on assignment)
- `ListReservationsUseCase` - Show all reservations with filters

**State Management**:
- `ConfirmReservationUseCase` - Optional approval step (PENDING → CONFIRMED)
- `StartReservationUseCase` - Background job (CONFIRMED → ACTIVE on start date)
- `CompleteReservationUseCase` - Background job (ACTIVE → COMPLETED on end date)

**Helper**:
- `CheckAvailabilityUseCase` - Check if asset is available (no reservations, no assignments)
- `ListAvailableAssetsUseCase` - Filter assets by availability

**Integration**:
- Assignment workflow (`assignAssetToEmployeeAction`) auto-cancels reservations before creating assignment

## Workflow Integration

### Creating a Reservation

**UI**: Reservation Form
**Action**: `createReservationAction()`
**Business Logic**:
1. Validates dates (end > start)
2. **Checks for active assignments** - blocks if asset is assigned
3. **Checks for active reservations** - blocks if another reservation exists
4. Creates reservation with status PENDING
5. Asset now unavailable in assignment/reservation dropdowns

**Controller**: `src/interface-adapters/controllers/asset-reservation.controller.ts`

### Assigning a Reserved Asset

**UI**: Reservations page → Click "Assign" button on reservation row
**Action**: `assignAssetToEmployeeAction()`
**Business Logic** (from `asset-workflow.controller.ts`):
1. Resolves current admin person ID from session
2. **Auto-cancels all active reservations for the asset** with reason: "Asset assigned - reservation automatically cancelled"
3. Creates asset assignment
4. Creates stock movement OUT
5. Updates asset location to null (with employee)
6. Revalidates `/asset-reservations` to update UI

**Integration Point**: [asset-workflow.controller.ts:90-115](src/interface-adapters/controllers/asset-workflow.controller.ts#L90-L115)

### Blocking Reservations for Assigned Assets

**Business Logic** (from `create-reservation.use-case.ts`):
1. Before creating reservation, checks `assignmentRepository.findActiveByAsset()`
2. If active assignments exist, throws error: "This asset is currently assigned and cannot be reserved. Please return the asset to inventory before creating a reservation."
3. Only creates reservation if asset is truly available

**Integration Point**: [create-reservation.use-case.ts:42-58](src/core/use-cases/reservations/create-reservation.use-case.ts#L42-L58)

### Filtering Available Assets

**UI**: Reservation form dropdown shows only available assets
**Action**: `listUnreservedAssetsAction()`
**Business Logic**:
1. Fetches all assets
2. Fetches all active reservations (PENDING, CONFIRMED, ACTIVE)
3. Fetches all active assignments (endDate = null or future)
4. Filters out assets that are **either reserved OR assigned**
5. Returns truly available assets only

**Controller**: [asset-reservation.controller.ts:625-682](src/interface-adapters/controllers/asset-reservation.controller.ts#L625-L682)

## Background Jobs

All background jobs run via BullMQ. Handlers are in `src/infrastructure/services/queue/handlers/`.

### Job 1: Activate Reservations
**Schedule**: Every hour
**Handler**: `activate-ready-reservations.handler.ts`
**Logic**: Finds reservations where `startDate ≤ now AND status = CONFIRMED`, transitions to ACTIVE

### Job 2: Complete Expired Reservations
**Schedule**: Every hour
**Handler**: `complete-expired-reservations.handler.ts`
**Logic**: Finds reservations where `endDate ≤ now AND status = ACTIVE`, transitions to COMPLETED

### Job 3: Send Reminder Notifications
**Schedule**: Daily
**Handler**: `send-reservation-reminders.handler.ts`
**Logic**: Sends emails 24-48 hours before start date (reminder to assign the asset)

**Email Template**: `reservation-reminder`
- Production: Microsoft Graph Email Service
- Development: Mock Email Service (console logging)

## Backend Components (Not Exposed in UI)

The following components exist in the codebase for future use or alternative workflows but are **not currently exposed in the main UI**:

### Calendar View
**Component**: `src/components/asset-reservations/reservation-calendar.tsx`
- Monthly calendar grid with color-coded status blocks
- Available for re-enabling if visual timeline is needed

### Availability Checker
**Component**: `src/components/asset-reservations/availability-checker.tsx`
- Real-time asset availability search by date range
- Backend logic (`listUnreservedAssetsAction`) already filters unavailable assets in reservation form

## Components

**UI Components** (`src/components/asset-reservations/`):
- `asset-reservations-page-client.tsx` - Main page with simple list view
- `asset-reservations-table.tsx` - Table with **Assign** and **Cancel** actions
- `reservation-form.tsx` - Create reservation (only shows available assets)
- `reservation-detail.tsx` - View reservation details with state actions
- `reservation-calendar.tsx` - Monthly calendar view (not exposed in UI)
- `availability-checker.tsx` - Search available assets by date range (not exposed in UI)

**Controllers**:
- `asset-reservation.controller.ts` - Reservation CRUD operations
- `asset-workflow.controller.ts` - Assignment workflow with auto-cancellation

**DTOs**: `src/interface-adapters/dtos/generated/asset-reservation.dto.ts`
- `CreateReservationDTO` - Validates CUID2, XOR person/orgunit, date ranges
- `UpdateReservationDTO` - Extend end date, update notes
- `AssetReservationDTO` - Presentation with computed fields

## Security

**Server-Side Validation**:
- ✅ `reservedById` resolved from session (NOT from client)
- ✅ `cancelledById` resolved from session (NOT from client)
- ✅ XOR validation: Must specify exactly ONE of person OR org unit
- ✅ CUID2 validation for all IDs (Prisma 7 compatibility)
- ✅ Permission checks: `requirePermission(PERMISSIONS.ASSET_RESERVATIONS_CREATE)`

**Defense in Depth**:
1. Server actions check permissions
2. Use cases enforce business rules (no assigned/reserved assets)
3. Repository layer prevents database-level conflicts
4. UI hides unavailable options (but server validates anyway)

## Production Readiness

✅ **Type Safety**: All use case files compile without errors (no `@ts-nocheck`)
✅ **Full Implementation**: Pre-assignment workflow complete with auto-cancellation
✅ **Business Rules**: Strict one-at-a-time, assignment integration, expiration handling
✅ **Error Handling**: Structured logging with `ILoggerService`
✅ **Permissions**: Server-side enforcement at all layers
✅ **Database**: Schema migrated, seed data available
✅ **UI/UX**: Complete table, calendar, and forms with assign workflow

## Difference from Booking Systems

This is NOT a resource booking system like conference room reservations. Key differences:

| Traditional Booking | Pre-Assignment Workflow |
|---------------------|------------------------|
| Multiple bookings per asset (by date) | ONE reservation at a time (strict) |
| Reservation ends automatically on date | Reservation cancelled when assigned |
| Asset returns after use | Asset permanently assigned to employee |
| Calendar planning primary use case | New hire onboarding primary use case |
| Conflicts resolved by dates | Conflicts prevented entirely |

**Real-World Use Case**: IT admin reserves laptop on Dec 1st for new employee starting Dec 15th. On Dec 15th, admin goes to reservations page, clicks "Assign", and the laptop is formally assigned. Reservation automatically cancelled. Employee keeps the laptop until they leave the company.

## See Also

- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Complete ITAM overview
- [ASSET_KITS.md](./ASSET_KITS.md) - Kit system for bundling multiple assets
- Asset Assignment workflow in `asset-workflow.controller.ts`

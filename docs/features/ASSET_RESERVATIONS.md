# Asset Reservation System

**Future asset booking with conflict detection and calendar view**

## Overview

The Asset Reservations module enables users to reserve assets for future dates with automatic conflict detection, preventing double-booking and ensuring asset availability.

## Key Features

- **Future Reservations**: Book assets for specific date/time ranges
- **Conflict Detection**: Automatic detection of overlapping reservations
- **Reservation States**: PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED
- **Availability Checker**: Search for available assets by date range
- **Calendar View**: Ready for `react-big-calendar` integration
- **Background Jobs**: Auto-activation, reminders, overdue checks (ready for BullMQ)

## Reservation States

```
PENDING    → Initial reservation request
  ↓
CONFIRMED  → Reservation approved/confirmed
  ↓
ACTIVE     → Start date reached, asset in use
  ↓
COMPLETED  → End date reached, asset returned
```

**Alternative**: Any State → CANCELLED

## Routes & Permissions

**Route**: `/asset-reservations`
**Permissions**: `ASSET_RESERVATIONS_*` (VIEW, CREATE, UPDATE, DELETE, CANCEL, CONFIRM, MANAGE)

**Views**:

- List View: Table of all reservations
- Calendar View: Visual calendar (ready for implementation)
- Availability Checker: Find available assets
- **Asset Detail View**: Reservations tab shows all reservations for a specific asset (via `/assets/[id]`)

### Asset Detail Integration

The Asset detail page includes a **Reservations tab** that displays all reservations (past and future) for that specific asset:

- **Component**: `src/components/assets/asset-reservations-tab.tsx`
- **Controller Action**: `listReservationsByAssetAction(assetId)`
- Shows: Purpose, date range, reserved by person, status badge
- Status colors: PENDING (outline), CONFIRMED (secondary), ACTIVE (default), COMPLETED (secondary), CANCELLED (destructive)

## Database Schema

**Tables**:

1. `asset_reservations` - Reservation records with date ranges
2. `asset_reservation_conflicts` - Detected conflicts between reservations

## Use Cases (16)

**Management**: Create, Get, List, Update, Delete reservations
**State Changes**: Cancel, Confirm, Start, Complete reservation
**Conflict Handling**: Detect conflicts, Resolve conflict, List conflicts
**Availability**: Check availability, List available assets
**Background Jobs**: Activate ready reservations, Complete expired, Send reminders

## Workflow Example

```typescript
// 1. Check Availability
const available = await checkAvailability({
  assetId: "laptop-001",
  startDate: new Date("2024-12-01"),
  endDate: new Date("2024-12-07"),
});

// 2. Create Reservation
const reservation = await createReservation({
  assetId: "laptop-001",
  reservedByPersonId: "user-id",
  startDate: new Date("2024-12-01"),
  endDate: new Date("2024-12-07"),
  purpose: "Conference presentation",
});

// 3. Conflict Detection (automatic)
// If another user tries to reserve same asset for overlapping dates:
const conflictingReservation = await createReservation({
  assetId: "laptop-001",
  startDate: new Date("2024-12-05"), // Overlaps!
  endDate: new Date("2024-12-10"),
});
// → Conflict detected and logged

// 4. State Progression
await confirmReservation(reservation.id); // PENDING → CONFIRMED
// On start date (background job):
await startReservation(reservation.id); // CONFIRMED → ACTIVE
// On end date (background job):
await completeReservation(reservation.id); // ACTIVE → COMPLETED
```

## Conflict Resolution

When conflicts are detected:

1. **Conflict Record Created**: Logged in `asset_reservation_conflicts`
2. **Options**:
   - Modify reservation dates
   - Cancel one reservation
   - Find alternative asset
3. **Resolution**: Mark conflict as resolved when addressed

## Background Jobs (Ready for BullMQ)

### Job 1: Activate Reservations

```typescript
// Runs every hour
// Finds reservations where startDate ≤ now AND status = CONFIRMED
// Sets status to ACTIVE
```

### Job 2: Complete Expired

```typescript
// Runs every hour
// Finds reservations where endDate ≤ now AND status = ACTIVE
// Sets status to COMPLETED
```

### Job 3: Send Reminders

```typescript
// Runs daily
// Finds reservations starting in 24-48 hours
// Sends email reminder to reserver
```

## Calendar Integration

**Ready for `react-big-calendar`**:

```typescript
// Convert reservations to calendar events
const events = reservations.map(r => ({
  id: r.id,
  title: `${r.assetTag} - ${r.reservedByPersonName}`,
  start: new Date(r.startDate),
  end: new Date(r.endDate),
  resource: r
}));

// Render calendar
<Calendar
  events={events}
  onSelectEvent={handleViewReservation}
  onSelectSlot={handleCreateReservation}
/>
```

## See Also

- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Complete ITAM overview
- [ASSET_KITS.md](./ASSET_KITS.md) - Kit system
- [CMDB_GUIDE.md](./CMDB_GUIDE.md) - CMDB implementation

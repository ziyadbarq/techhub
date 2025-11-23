# Asset Kits & Bundles System

**Predefined asset bundles with checkout tracking and partial returns**

## Overview

The Asset Kits module enables creation of reusable asset bundles (e.g., "New Hire Kit", "Meeting Room Kit") that can be checked out as a single unit with individual item tracking.

## Key Features

- **Kit Builder**: Define kits with multiple asset types and quantities
- **Flexible Checkout**: Check out entire kit or partial quantities
- **Item Tracking**: Track individual items (status: CHECKED_OUT, RETURNED, DAMAGED, LOST)
- **Partial Returns**: Return items individually, not all-or-nothing
- **Availability Checks**: Verify kit availability before checkout
- **Overdue Tracking**: Monitor checkout duration

## Common Use Cases

### Example Kits

1. **New Hire Kit**
   - 1× Laptop
   - 1× Mouse
   - 1× Keyboard
   - 1× Monitor
   - 1× Docking Station

2. **Meeting Room Kit**
   - 1× Projector
   - 1× HDMI Cable
   - 1× Presentation Clicker
   - 1× Whiteboard Markers Set

3. **Field Service Kit**
   - 1× Laptop
   - 1× Testing Equipment
   - 1× Tool Set
   - 1× Safety Gear

## Routes & Permissions

**Route**: `/asset-kits`
**Permissions**: `ASSET_KITS_*` (VIEW, CREATE, UPDATE, DELETE, CHECKOUT, RETURN, MANAGE)

## Database Schema

**Tables**:

1. `asset_kits` - Kit definitions
2. `asset_kit_items` - Items in each kit (with quantities)
3. `asset_kit_checkouts` - Checkout records
4. `asset_kit_checkout_items` - Individual item tracking per checkout

## Use Cases (18)

**Kit Management**: Create, Get, List, Update, Delete kits
**Item Management**: Add, Remove, Update kit items
**Checkout**: Create, Get, List checkouts
**Returns**: Return entire kit, Return individual items
**Status**: Mark items damaged/lost, Extend checkout, List overdue
**Availability**: Check availability

## Workflow Example

```typescript
// 1. Create Kit
const newHireKit = await createAssetKit({
  name: "New Hire Kit",
  description: "Standard equipment for new employees"
});

// 2. Add Items
await addKitItem({
  kitId: newHireKit.id,
  assetModelId: "laptop-model-id",
  quantity: 1
});

// 3. Check Availability
const available = await checkKitAvailability(newHireKit.id, quantity: 1);

// 4. Checkout
const checkout = await createKitCheckout({
  kitId: newHireKit.id,
  assignedToPersonId: "employee-id",
  checkoutDate: new Date(),
  dueDate: addDays(new Date(), 30)
});

// 5. Partial Return
await returnKitItem({
  checkoutId: checkout.id,
  itemId: "laptop-item-id"
});
```

## See Also

- [ITAM_FEATURES.md](./ITAM_FEATURES.md) - Complete ITAM overview
- [ASSET_RESERVATIONS.md](./ASSET_RESERVATIONS.md) - Reservation system

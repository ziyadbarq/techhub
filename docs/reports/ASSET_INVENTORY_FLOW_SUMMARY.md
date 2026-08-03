# Asset & Inventory Flow Summary

## Purpose

This note explains the main Asset & Inventory pages in simple terms, with a practical example and the recommended process flow.

---

## Recommended Flow

Use this order when explaining or operating the asset lifecycle:

1. Asset Categories
2. Asset Models
3. Custom Fields (if needed)
4. Lifecycle Models
5. Lifecycle States
6. Lifecycle Trans     ‘itions
7. Assets
8. Stock Locations
9. Stock Movements
10. Asset Assignments
11. Asset Reservations (if future booking is needed)
12. Asset Kits (if multiple assets are issued together)
13. Warranties
14. Maintenance Schedules
15. Maintenance Records
16. Asset Disposals

---

## Service Summary

### 1. Asset Categories

Defines the general type of asset.

Example:
- Laptop
- Monitor
- Printer

Why it matters:
- Organizes assets into clear groups
- Controls how assets are classified in the system

### 2. Asset Models

Defines the exact model within a category.

Example:
- Category: Laptop
- Model: Dell Latitude 7440

Why it matters:
- Standardizes the technical identity of assets
- Avoids repeating the same model details on each asset record

### 3. Custom Fields

Adds extra information when the standard asset form is not enough.

Example:
- CPU Cores
- RAM Size
- Rack Position
- Warranty Code

Why it matters:
- Captures business-specific or technical details
- Makes the asset record flexible without changing the system design

### 4. Lifecycle Models

Defines the full journey an asset follows.

Example:
- IT Asset Lifecycle
- Software License Lifecycle
- Facility Asset Lifecycle

Why it matters:
- Separates different lifecycle journeys for different asset types

### 5. Lifecycle States

Defines one stage inside a lifecycle model.

Example:
- New
- Received
- Deployed
- Maintenance
- Retired

Why it matters:
- Shows the current stage of the asset
- Makes status tracking consistent

### 6. Lifecycle Transitions

Defines which state changes are allowed.

Example:
- New -> Received
- Received -> Deployed
- Deployed -> Maintenance
- Maintenance -> Deployed
- Deployed -> Retired

Why it matters:
- Prevents invalid status changes
- Keeps the lifecycle process controlled

### 7. Assets

Represents the actual physical or logical asset record.

Example:
- Asset Tag: IT-000123
- Category: Laptop
- Model: Dell Latitude 7440
- Serial Number: ABC12345

Why it matters:
- This is the real item being tracked in the system

### 8. Stock Locations

Defines where assets are stored.

Example:
- Main Warehouse
- IT Room
- Riyadh Office Shelf A

Why it matters:
- Identifies where the asset is physically located before issue or transfer

### 9. Stock Movements

Tracks asset movement between locations.

Example:
- From Main Warehouse -> Riyadh Office
- From Riyadh Office -> Jeddah Office

Why it matters:
- Creates traceability for asset transfers
- Shows where the asset moved and when

### 10. Asset Assignments

Tracks who currently uses or owns the asset operationally.

Example:
- Laptop assigned to Ahmed
- Monitor assigned to Finance Department

Why it matters:
- Identifies responsibility and current usage

### 11. Asset Reservations

Reserves an asset for a future period.

Example:
- Projector reserved for Thursday meeting

Why it matters:
- Prevents double booking
- Supports future planning

### 12. Asset Kits

Groups multiple assets into one reusable bundle.

Example:
- New Hire Kit:
  - Laptop
  - Monitor
  - Keyboard
  - Mouse

Why it matters:
- Makes bulk assignment easier
- Standardizes common asset bundles

### 13. Warranties

Tracks vendor or manufacturer coverage for an asset.

Example:
- Warranty Start: Jan 1, 2026
- Warranty End: Jan 1, 2028

Why it matters:
- Helps determine if repair or replacement is covered

### 14. Maintenance Schedules

Defines planned maintenance activities.

Example:
- Preventive maintenance every 6 months

Why it matters:
- Reduces failures
- Supports proactive upkeep

### 15. Maintenance Records

Tracks maintenance that was actually performed.

Example:
- Battery replaced
- Fan cleaned
- Screen repaired

Why it matters:
- Provides maintenance history
- Supports audit and operational review

### 16. Asset Disposals

Tracks retirement and disposal of assets.

Example:
- Retired laptop sent for approved disposal

Why it matters:
- Closes the asset lifecycle properly
- Supports compliance and audit trail requirements

---

## Simple End-to-End Example

Example: New employee laptop

1. Create `Laptop` in Asset Categories
2. Create `Dell Latitude 7440` in Asset Models
3. Add Custom Fields if needed, such as RAM or CPU
4. Use `IT Asset Lifecycle`
5. Set asset state to `New`, then `Received`
6. Configure allowed transitions such as `Received -> Deployed`
7. Create the actual asset record
8. Place it in `Main Warehouse`
9. Record a stock movement from warehouse to office
10. Assign the laptop to the employee
11. Add warranty coverage
12. Add preventive maintenance schedule
13. Record maintenance when work is completed
14. Retire and dispose of the asset when it reaches end of life

---

## Key Distinctions

- Asset Category = general asset type
- Asset Model = exact model definition
- Asset = the actual tracked item
- Stock Movement = where the asset moved
- Asset Assignment = who the asset is assigned to
- Lifecycle Model = the full asset journey
- Lifecycle State = one stage in that journey
- Lifecycle Transition = the allowed move from one state to another

---

## Short Meeting Version

The correct operating flow starts by defining the asset structure through categories, models, custom fields, and lifecycle rules. After that, the real asset is created, placed in stock, moved when needed, and assigned to a user or department. Once the asset is active, the system tracks its warranty and maintenance history, and finally closes its lifecycle through proper disposal.

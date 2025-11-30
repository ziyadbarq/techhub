# Profile Page Enhancement

**Status**: Planned
**Priority**: Medium
**Complexity**: Medium
**Estimated Effort**: 2-3 days

## Overview

Enhance the `/profile` page to provide a unified view of the authenticated user's account (Better Auth User) and their linked employee record (Person entity). Currently, the profile page only shows basic auth data while employee information is scattered across the dashboard widget and Person Details page.

### Business Value

- Employees see their complete profile in one place (account + organizational data)
- Quick access to assigned assets, devices, and licenses
- Clear visibility into roles and permissions
- Self-service preferences management
- Improved user experience for enterprise employees

## Current State

### Implemented ✅
- Basic profile page showing User (auth) data: name, email, avatar, member since
- Settings form structure (but submission is placeholder - TODO comment)
- Dashboard widget showing Person data separately
- CurrentPersonContext for fetching linked Person
- Profile page now links to Person record and shows My Assets summary (assets, licenses, reservations)
- Settings form updates Better Auth user name/image (email remains managed by SSO)

### Not Implemented ❌
- User preferences persistence in database (currently Redis-backed)
- Notification delivery wires (UI toggles only)
- Role & permissions display missing
- Notification preferences (personal)
- Display preferences (theme, timezone, etc.)

### Key Gap
User (auth account) and Person (employee) data are separate. Profile page shows only User data while dashboard widget shows Person data. No unified view exists.

---

## Technical Design

### Phase 1: MVP (Profile Overview + My Assets + Roles)

#### New Database Schema

```prisma
// Add to schema/auth.prisma
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Display preferences
  timezone           String?   @default("Asia/Riyadh")
  dateFormat         String?   @default("dd/MM/yyyy")
  currencyDisplay    String?   @default("dual")  // "sar" | "original" | "dual"

  // Notification preferences (Phase 2)
  emailNotifications    Boolean @default(true)
  teamsNotifications    Boolean @default(false)
  whatsappNotifications Boolean @default(false)
  weeklyDigest          Boolean @default(true)
  assetAlerts           Boolean @default(true)
  approvalAlerts        Boolean @default(true)
  warrantyAlerts        Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Update User model
model User {
  // ... existing fields
  preferences UserPreferences?
}
```

#### Profile Page Structure (MVP)

```
┌─────────────────────────────────────────────────────────────────┐
│ Profile                                                         │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ PROFILE OVERVIEW                                            │ │
│ │ ┌──────────┐  John Smith                                    │ │
│ │ │  Avatar  │  Senior Developer • Engineering                │ │
│ │ │          │  john.smith@barq.com                           │ │
│ │ └──────────┘  Employee ID: EMP-001 • Hired: Jan 2022        │ │
│ │               Manager: Jane Doe                             │ │
│ │               Location: Riyadh HQ • Office: Floor 3         │ │
│ │               [View Full Employee Record]                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ MY ASSETS & DEVICES                                         │ │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │ │
│ │ │ 📱 Devices  │ │ 📋 Licenses │ │ 📅 Reserved │             │ │
│ │ │     2      │ │      5      │ │      1      │             │ │
│ │ │ Intune     │ │ Allocated   │ │ Pending     │             │ │
│ │ └─────────────┘ └─────────────┘ └─────────────┘             │ │
│ │                                                             │ │
│ │ Recent Devices:                                             │ │
│ │ • MacBook Pro 14" (Compliant) - Last sync: 2h ago          │ │
│ │ • iPhone 15 Pro (Compliant) - Last sync: 30m ago           │ │
│ │                                                             │ │
│ │ [View All My Assets →]                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ROLES & PERMISSIONS                                         │ │
│ │ Primary Role: [Asset Manager]                               │ │
│ │                                                             │ │
│ │ Permission Groups:                                          │ │
│ │ [Assets ✓] [Persons ✓] [CMDB ✓] [Licenses ✓] [Settings ✓]  │ │
│ │                                                             │ │
│ │ Total: 45 permissions across 5 groups                       │ │
│ │ [View All Permissions →] (if has RBAC_VIEW)                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ACCOUNT SECURITY                                            │ │
│ │ Authentication: Microsoft SSO                               │ │
│ │ Email Verified: ✓ Yes                                       │ │
│ │ Last Login: Today at 9:30 AM                                │ │
│ │ Member Since: January 2022                                  │ │
│ │                                                             │ │
│ │ [Change Password] (disabled) [Enable 2FA] (disabled)        │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Account Security + Notification Preferences

- Session management (view active sessions)
- Login history (last 10 logins from audit logs)
- Notification preferences:
  - Email notifications toggle
  - MS Teams notifications toggle
  - WhatsApp notifications toggle
  - Weekly digest preference
  - Asset/approval/warranty alert toggles

### Phase 3: Display Preferences + Activity Log

- Timezone selection
- Date format preference
- Currency display mode (SAR only / original / dual)
- Personal activity log (actions performed by this user)

---

## Files to Create

```
src/app/(dashboard)/profile/page.tsx                    # Enhanced server page
src/components/profile/profile-page-client.tsx          # Main client component
src/components/profile/sections/profile-overview.tsx    # User + Person merged view
src/components/profile/sections/my-assets-summary.tsx   # Assets, devices, licenses
src/components/profile/sections/roles-permissions.tsx   # Roles and permission groups
src/components/profile/sections/account-security.tsx    # Auth status, login history
src/components/profile/sections/notification-prefs.tsx  # Phase 2
src/components/profile/sections/display-prefs.tsx       # Phase 3
src/components/profile/sections/activity-log.tsx        # Phase 3
src/interface-adapters/controllers/profile.controller.ts # Server actions
```

## Files to Modify

```
schema/auth.prisma                                      # Add UserPreferences model
src/app/(dashboard)/profile/page.tsx                    # Add permission check, fetch Person
src/components/settings/settings-form.tsx               # Implement actual submission
src/interface-adapters/controllers/my-dashboard.controller.ts # Add profile actions
```

---

## Implementation Checklist

### Phase 1: MVP

**Database & Backend:**
- [ ] Add `UserPreferences` model to schema
- [ ] Run migration
- [ ] Create `profile.controller.ts` with server actions:
  - `getMyProfileAction()` - Returns User + Person + Preferences + Counts
  - `updateMyPreferencesAction()` - Updates UserPreferences
- [ ] Add permission check to profile page (`requirePermission` or just auth check)

**Profile Overview Section:**
- [ ] Merge User (auth) and Person (employee) data display
- [ ] Show: name, email, avatar, title, department, manager, location, hire date
- [ ] "View Full Employee Record" link to `/persons/[id]`
- [ ] Handle case where User has no linked Person

**My Assets Summary Section:**
- [ ] Fetch counts: Intune devices, license allocations, asset reservations
- [ ] Show 3 stat cards with counts
- [ ] Display recent devices (top 2-3) with compliance status
- [ ] "View All My Assets" link to Person Details → Assets tab

**Roles & Permissions Section:**
- [ ] Display primary role badge
- [ ] Show permission group badges (14 groups)
- [ ] Count total permissions
- [ ] "View All Permissions" link (if has ROLES_VIEW permission)

**Account Security Section:**
- [ ] Show authentication method (Microsoft SSO)
- [ ] Email verification status
- [ ] Last login date/time
- [ ] Member since date
- [ ] Disabled buttons for password/2FA (placeholder)

### Phase 2: Notification Preferences

- [ ] Add notification preferences form
- [ ] Toggle: Email notifications
- [ ] Toggle: MS Teams notifications
- [ ] Toggle: WhatsApp notifications
- [ ] Toggle: Weekly digest
- [ ] Toggle: Asset alerts, Approval alerts, Warranty alerts
- [ ] Save preferences to UserPreferences table

### Phase 3: Display Preferences + Activity

- [ ] Timezone dropdown (common timezones + Asia/Riyadh default)
- [ ] Date format select (dd/MM/yyyy, MM/dd/yyyy, yyyy-MM-dd)
- [ ] Currency display mode (SAR only / original currency / dual)
- [ ] Activity log: Fetch from AuditLog where changedById = userId
- [ ] Paginated activity list with action type filters

---

## Server Actions

| Action | Permission | Purpose |
|--------|------------|---------|
| `getMyProfileAction()` | Authenticated | Get User + linked Person + preferences + asset counts |
| `updateMyPreferencesAction(prefs)` | Authenticated | Update UserPreferences record |
| `getMyPermissionSummaryAction()` | Authenticated | Get permission groups with counts |
| `getMyRecentDevicesAction()` | Authenticated | Get top 3 Intune devices |
| `getMyActivityLogAction(pagination)` | Authenticated | Get audit log entries for this user |

---

## Data Fetching Strategy

**Initial Page Load (Server-Side):**
```typescript
const [user, person, preferences, counts] = await Promise.all([
  getSession(),                           // Better Auth session
  getCurrentPersonAction(),               // Linked Person record
  getMyPreferencesAction(),              // UserPreferences
  getMyAssetCountsAction(),              // Device/license/reservation counts
]);
```

**Client-Side (Lazy):**
- Recent devices loaded on mount
- Activity log loaded on Phase 3 tab mount
- Permission details loaded on expand

---

## Key Decisions

1. **User Preferences Table**: Dedicated `UserPreferences` table (Option A) - clean separation
2. **Password/2FA**: Disabled placeholders - Azure SSO only
3. **Notifications**: Email, MS Teams, WhatsApp (no Slack)
4. **Asset Kits**: Excluded from scope
5. **No new permissions**: Profile page uses authentication check only (users can always view their own profile)

---

## Testing Strategy

- Unit tests for profile controller actions
- Integration tests for UserPreferences CRUD
- E2E tests for profile page loading with/without linked Person
- Permission boundary tests for "View All Permissions" link

## Risk & Considerations

1. **User without Person**: Handle gracefully - show auth data only with message
2. **Migration**: New UserPreferences table requires migration
3. **Performance**: Parallel data fetching to avoid waterfall
4. **SSO-only**: Password/2FA buttons disabled but visible for consistency

---

**Related Documentation:**
- [Person Details Page](../docs/features/PERSON_DETAILS.md)
- [RBAC Developer Guide](../docs/guides/RBAC_DEVELOPER_GUIDE.md)
- [Better Auth Integration](../docs/features/SYSTEM_SETUP.md)

# Profile Page Enhancement - Combined Refreshed Plan

**Status**: Partially Complete
**Priority**: Medium
**Last Updated**: 2026-03-27

## Executive Summary

This plan delivers **Two-Factor Authentication (2FA)** and **database-backed user preferences** for the Profile/Settings pages. The Person Details page is **fully implemented** and excluded from this scope.

**Priorities:**
1. **HIGH**: ~~Database-backed UserPreferences~~ ✅ DONE + 2FA implementation (TOTP)
2. **MEDIUM**: Photo upload functionality + Roles/Permissions display
3. **LOW**: Session management + Activity log (future)

## Current State Analysis

### ✅ Already Implemented
- Profile page (`/profile`) - User + Person merged view, My Assets summary
- Settings page (`/settings`) - Profile form, preferences, notification toggles
- Person Details page (`/persons/[id]`) - Fully complete with all 6 tabs
- Better Auth v1.3.34 - Microsoft OAuth SSO + Email/Password auth
- **UserPreferences entity** — domain entity, repository interface, Prisma implementation, DI module all done
- **Use cases** — `GetUserPreferencesUseCase`, `UpdateUserPreferencesUseCase` implemented
- **Controller** — preferences server actions wired to database

### ❌ Remaining Features
- Two-Factor Authentication (TOTP) — design complete, implementation pending
- Photo upload (only URL input works)
- Roles & Permissions display on profile
- Session management UI
- Personal activity log

## Architecture Decisions

### 1. Database-Backed Preferences
**Decision**: Migrate from Redis to PostgreSQL via `UserPreferences` model

**Rationale**:
- Redis is ephemeral - preferences lost on restart
- Database provides persistence, backup, and audit trails
- Aligns with Better Auth storing sessions in DB

**Trade-off**: Slightly higher latency vs reliability

### 2. Two-Factor Authentication
**Decision**: Use Better Auth TOTP plugin (Time-based One-Time Password)

**Approach**:
- Server: `twoFactor()` plugin from `better-auth/plugins`
- Client: `twoFactorClient()` from `better-auth/client/plugins`
- Storage: Encrypted secret + hashed backup codes in User model
- UI: QR code generation, verification dialog, 2FA login challenge page

### 3. Photo Upload
**Decision**: Use existing `LocalFileStorageService` with Attachment validation

**Benefits**:
- Reuses battle-tested upload infrastructure
- Magic number detection prevents fake extensions
- MIME type validation + size limits (5MB)
- Date-based directory structure: `public/uploads/{year}/{month}/{cuid}.{ext}`

### 4. Roles Display
**Decision**: Read-only view of user's roles + permission groups

**Approach**:
- No permission required to view own roles
- Link to full permissions page if user has `RBAC_VIEW`

## Database Schema Changes

### UserPreferences Model
**File**: [src/infrastructure/database/prisma/schema/auth.prisma](src/infrastructure/database/prisma/schema/auth.prisma)

```prisma
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique

  timezone        String  @default("Asia/Riyadh")
  dateFormat      String  @default("dd/MM/yyyy")
  currencyDisplay String  @default("dual")

  notifications Json @default("{\"emailNotifications\":true,\"teamsNotifications\":false,\"whatsappNotifications\":false,\"weeklyDigest\":true,\"assetAlerts\":true,\"approvalAlerts\":true,\"warrantyAlerts\":true}")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_preferences")
}
```

### 2FA Fields (Better Auth TOTP plugin adds automatically)
```prisma
model User {
  twoFactorEnabled     Boolean?
  twoFactorSecret      String?  @db.Text
  twoFactorBackupCodes String?  @db.Text

  preferences UserPreferences?  // NEW relation
}
```

**Migration**:
```bash
npx prisma migrate dev --name add_user_preferences_and_2fa
npm run db:generate
```

## Implementation Plan

### Phase 1: Database Migration & UserPreferences (Foundation)

#### 1.1 Domain Layer
**Create**: [src/core/domain/entities/user-preferences.entity.ts](src/core/domain/entities/user-preferences.entity.ts)
- `UserPreferences` entity with validation
- `NotificationPreferences` interface
- Factory methods: `create()`, `restore()`

**Create**: [src/core/repositories/user-preferences.repository.interface.ts](src/core/repositories/user-preferences.repository.interface.ts)
- `IUserPreferencesRepository` interface
- Methods: `findByUserId()`, `create()`, `update()`, `delete()`

#### 1.2 Infrastructure Layer
**Create**: [src/infrastructure/repositories/prisma-user-preferences.repository.ts](src/infrastructure/repositories/prisma-user-preferences.repository.ts)
- Prisma implementation of repository
- JSON serialization for notifications field

#### 1.3 Use Cases
**Create**: [src/core/use-cases/user-preferences/get-user-preferences.use-case.ts](src/core/use-cases/user-preferences/get-user-preferences.use-case.ts)
- Fetches preferences, creates defaults if missing

**Create**: [src/core/use-cases/user-preferences/update-user-preferences.use-case.ts](src/core/use-cases/user-preferences/update-user-preferences.use-case.ts)
- Partial updates with validation

**Create**: [src/core/use-cases/user-preferences/index.ts](src/core/use-cases/user-preferences/index.ts)
- Barrel export (CRITICAL - pre-commit hook fails without it)

#### 1.4 DI Registration
**Create**: [src/di/modules/user-preferences.module.ts](src/di/modules/user-preferences.module.ts)
- Bind repository + use cases

**Modify**: [src/di/types.ts](src/di/types.ts)
- Add DI_TOKENS for UserPreferences

**Modify**: [src/di/container.ts](src/di/container.ts)
- Call `bindUserPreferencesDependencies()`

#### 1.5 Controller Layer
**Modify**: [src/interface-adapters/controllers/my-dashboard.controller.ts](src/interface-adapters/controllers/my-dashboard.controller.ts)
- Replace Redis actions with database actions:
  - `getMyPreferencesAction()` - Use `GetUserPreferencesUseCase`
  - `updateMyPreferencesAction()` - Use `UpdateUserPreferencesUseCase`
- Remove Redis imports (`getRedis()`, `preferencesKey()`)

#### 1.6 Data Migration Script
**Create**: [scripts/users/migrate-preferences-to-db.ts](scripts/users/migrate-preferences-to-db.ts)
- Read all `user:preferences:*` keys from Redis
- Create `UserPreferences` records in database
- Validate migration
- Optional: Clear Redis keys after confirmation

**Usage**:
```bash
dotenv -e .env.local -- tsx scripts/users/migrate-preferences-to-db.ts
```

### Phase 2: Two-Factor Authentication (2FA)

#### 2.1 Better Auth Configuration
**Modify**: [src/infrastructure/services/auth/better-auth.ts](src/infrastructure/services/auth/better-auth.ts)
```typescript
import { twoFactor } from "better-auth/plugins";

plugins: [
  nextCookies(),
  lastLoginMethod({ ... }),
  twoFactor({
    issuer: "Barq ITAM",
    skipVerificationOnEnable: false,
  }),
]
```

**Modify**: [src/lib/auth/client.ts](src/lib/auth/client.ts) or create if missing
```typescript
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    twoFactorClient({
      twoFactorPage: "/auth/two-factor",
    }),
  ],
});
```

#### 2.2 Server Actions
**Create**: [src/interface-adapters/controllers/two-factor.controller.ts](src/interface-adapters/controllers/two-factor.controller.ts)
- `enable2FAAction(password)` - Returns TOTP URI + backup codes
- `verify2FASetupAction(code)` - Verify initial TOTP code
- `disable2FAAction(password)` - Disable 2FA with password
- `regenerateBackupCodesAction(password)` - Generate new codes

#### 2.3 UI Components
**Create**: [src/components/settings/enable-2fa-dialog.tsx](src/components/settings/enable-2fa-dialog.tsx)
- Three-step dialog:
  1. Password confirmation
  2. QR code display + TOTP verification (uses `qrcode` library)
  3. Backup codes display with copy button
- Dependencies: `npm install qrcode @types/qrcode`

**Create**: [src/components/settings/disable-2fa-dialog.tsx](src/components/settings/disable-2fa-dialog.tsx)
- Password confirmation
- Call `disable2FAAction()`

**Create**: [src/app/auth/two-factor/page.tsx](src/app/auth/two-factor/page.tsx)
- 2FA login challenge page (required by Better Auth)
- TOTP code input (6 digits)
- Trust device option
- Backup code fallback

#### 2.4 Settings Page Integration
**Modify**: [src/components/settings/settings-form.tsx](src/components/settings/settings-form.tsx)
- Add 2FA section to Security card:
  - Show badge: "2FA Enabled" (green) or "Not Enabled" (yellow)
  - Button: "Enable 2FA" or "Disable 2FA"
  - Open respective dialog on click
- Props: Pass `user.twoFactorEnabled` status

**Modify**: [src/app/(dashboard)/settings/page.tsx](src/app/(dashboard)/settings/page.tsx)
- Fetch user's 2FA status from session
- Pass to SettingsForm component

### Phase 3: Photo Upload

#### 3.1 Server Action
**Modify**: [src/interface-adapters/controllers/my-dashboard.controller.ts](src/interface-adapters/controllers/my-dashboard.controller.ts)
- Add `uploadProfilePhotoAction(formData)`:
  - Extract file from FormData
  - Validate MIME type (JPEG, PNG, WebP)
  - Validate size (max 5MB)
  - Use `LocalFileStorageService.uploadFile()`
  - Update `User.image` with URL
  - Return `{ imageUrl }`

#### 3.2 UI Component
**Modify**: [src/components/settings/settings-form.tsx](src/components/settings/settings-form.tsx)
- Replace image URL input with file input:
  - `<Input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" />`
  - On change: Call `uploadProfilePhotoAction()` with FormData
  - Update avatar preview on success
  - Show toast notification
  - Call `router.refresh()` to update page

### Phase 4: Roles & Permissions Display

#### 4.1 Server Action
**Modify**: [src/interface-adapters/controllers/my-dashboard.controller.ts](src/interface-adapters/controllers/my-dashboard.controller.ts)
- Add `getMyRolesAction()`:
  - Fetch `UserRole` with joined `Role` and `RolePermission`
  - Extract unique permissions + resource groups
  - Check if user has `RBAC_VIEW` permission
  - Return:
    - `roles[]` - Array of role objects
    - `permissionGroups[]` - Unique resource names
    - `totalPermissions` - Count
    - `canViewFullPermissions` - Boolean

#### 4.2 Profile Page
**Modify**: [src/app/(dashboard)/profile/page.tsx](src/app/(dashboard)/profile/page.tsx)
- Add `getMyRolesAction()` to parallel fetch on page load
- Add "Roles & Permissions" card:
  - Display role badges (displayName)
  - Display permission group badges
  - Show total permission count
  - Link to `/rbac/permissions` if `canViewFullPermissions`

## Security Considerations

### 2FA Security
- **Secret Storage**: Encrypted by Better Auth using `BETTER_AUTH_SECRET`
- **Backup Codes**: Hashed with bcrypt before storage
- **Rate Limiting**: Built-in Better Auth protection on verification
- **Admin Override**: Create script `scripts/users/disable-2fa-for-user.ts` for emergency access

### File Upload Security
1. **Client-side**: Type/size validation (UX only)
2. **Server-side**: MIME type whitelist
3. **Magic number detection**: `LocalFileStorageService` prevents fake extensions
4. **Path traversal**: Protected by `isValidUploadPath()`
5. **Size limit**: 5MB enforced server-side
6. **Rate limiting**: Add to upload endpoint using `rate-limiter-flexible` with Redis

### Permission Checks
- All server actions: `await getCurrentUserId()` check
- Viewing own roles: No permission required
- Full permissions page: Requires `RBAC_VIEW`

## Testing Strategy

### Unit Tests
- UserPreferences entity validation
- Use cases: get/update preferences
- File upload validation (MIME, size, magic number)

### Integration Tests
- 2FA flow: enable → verify → backup codes → disable
- Preferences migration: Redis → DB with defaults
- Photo upload: FormData → storage → User.image update

### E2E Tests (Playwright)
- Enable 2FA journey (password → QR → verify → backup)
- Disable 2FA journey (password → confirm)
- Photo upload: file select → upload → avatar update
- Preferences update: timezone change → save → persist

## Rollout Plan

### Week 1: Foundation + 2FA
1. Create Prisma migration (`add_user_preferences_and_2fa`)
2. Deploy to staging
3. Run data migration script (Redis → DB)
4. Implement UserPreferences (entity, repository, use cases, DI)
5. Update my-dashboard.controller (replace Redis with DB)
6. Install Better Auth TOTP plugin
7. Implement 2FA server actions
8. Build 2FA UI components
9. Test on staging
10. Deploy to production

### Week 2: Photo Upload + Roles Display
1. Implement `uploadProfilePhotoAction()`
2. Update settings form with file input
3. Test photo upload on staging
4. Implement `getMyRolesAction()`
5. Add Roles & Permissions card to profile
6. Deploy to production

### Week 3: Polish + Monitoring
1. Monitor 2FA adoption rate
2. Fix any bugs from production
3. Write admin script for 2FA emergency disable
4. Update documentation

## Critical Files to Modify

### Schema & Database
1. [src/infrastructure/database/prisma/schema/auth.prisma](src/infrastructure/database/prisma/schema/auth.prisma) - Add UserPreferences model

### Authentication
2. [src/infrastructure/services/auth/better-auth.ts](src/infrastructure/services/auth/better-auth.ts) - Add TOTP plugin
3. [src/lib/auth/client.ts](src/lib/auth/client.ts) - Add twoFactorClient plugin

### Controllers
4. [src/interface-adapters/controllers/my-dashboard.controller.ts](src/interface-adapters/controllers/my-dashboard.controller.ts) - Replace Redis, add photo upload, add roles action
5. [src/interface-adapters/controllers/two-factor.controller.ts](src/interface-adapters/controllers/two-factor.controller.ts) - NEW: 2FA actions

### UI Components
6. [src/components/settings/settings-form.tsx](src/components/settings/settings-form.tsx) - 2FA controls, photo upload
7. [src/components/settings/enable-2fa-dialog.tsx](src/components/settings/enable-2fa-dialog.tsx) - NEW: 2FA setup flow
8. [src/components/settings/disable-2fa-dialog.tsx](src/components/settings/disable-2fa-dialog.tsx) - NEW: 2FA disable flow
9. [src/app/auth/two-factor/page.tsx](src/app/auth/two-factor/page.tsx) - NEW: Login challenge
10. [src/app/(dashboard)/profile/page.tsx](src/app/(dashboard)/profile/page.tsx) - Roles card

### Domain & Infrastructure
11. [src/core/domain/entities/user-preferences.entity.ts](src/core/domain/entities/user-preferences.entity.ts) - NEW
12. [src/core/repositories/user-preferences.repository.interface.ts](src/core/repositories/user-preferences.repository.interface.ts) - NEW
13. [src/infrastructure/repositories/prisma-user-preferences.repository.ts](src/infrastructure/repositories/prisma-user-preferences.repository.ts) - NEW
14. [src/core/use-cases/user-preferences/get-user-preferences.use-case.ts](src/core/use-cases/user-preferences/get-user-preferences.use-case.ts) - NEW
15. [src/core/use-cases/user-preferences/update-user-preferences.use-case.ts](src/core/use-cases/user-preferences/update-user-preferences.use-case.ts) - NEW
16. [src/core/use-cases/user-preferences/index.ts](src/core/use-cases/user-preferences/index.ts) - NEW (barrel export)

### DI Container
17. [src/di/modules/user-preferences.module.ts](src/di/modules/user-preferences.module.ts) - NEW
18. [src/di/types.ts](src/di/types.ts) - Add tokens
19. [src/di/container.ts](src/di/container.ts) - Bind module

### Scripts
20. [scripts/users/migrate-preferences-to-db.ts](scripts/users/migrate-preferences-to-db.ts) - NEW: Data migration

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 2FA lockout (lost phone + backup codes) | High | Admin script to disable 2FA after identity verification |
| Preferences migration data loss | Medium | Non-destructive migration (keeps Redis), prompt before clearing |
| File upload abuse (large/malicious files) | Medium | 5MB limit, magic number detection, rate limiting |
| Better Auth breaking changes | Low | Pin version `1.4.1`, test upgrades in staging |

## Dependencies to Install

```bash
npm install qrcode @types/qrcode
```

## Environment Variables (Already Set)

```env
BETTER_AUTH_SECRET=<encryption key for 2FA secrets>
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=<postgres connection>
REDIS_URL=<redis connection>
```

## Success Metrics

- 2FA enrollment rate: Target 80% within 3 months
- Preferences migration: 100% successful (0 data loss)
- Photo upload adoption: 50% users with custom avatars within 1 month
- Zero 2FA lockouts requiring admin intervention

## Next Steps (Post-Implementation)

1. **Session Management UI** - View/revoke active sessions
2. **Personal Activity Log** - Audit trail of user's actions
3. **API Tokens** - Generate personal access tokens for API
4. **Force 2FA for All Users** - Admin setting to require 2FA
5. **Backup Code Recovery Flow** - Use backup code if TOTP unavailable

# User Provisioning System

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: November 25, 2024

## Overview

The User Provisioning System enables administrators to create login accounts for employees who already exist in the system as Person records. This supports a two-phase employee onboarding workflow:

1. **Phase 1**: Import employees via the Universal Data Importer (creates Person records)
2. **Phase 2**: Provision user accounts for selected employees (creates User records linked to Persons)

This approach is particularly useful for:
- Gradual rollout of system access
- Organizations with contractors/external personnel who shouldn't have login access
- Pre-importing employee data before access provisioning
- Manual account creation until SSO integration is ready

## Key Features

- **Secure Password Generation**: Cryptographically secure 16-character random passwords
- **Better Auth Compatibility**: Uses scrypt-based hashing compatible with Better Auth
- **One-Time Credential Display**: Passwords shown only once for security
- **Easy Distribution**: Copy credentials for Slack/Teams DMs
- **Password Reset**: Admin-initiated password resets with session invalidation
- **Permission-Protected**: Requires `USERS_MANAGE` permission
- **Audit Trail**: All operations logged with user context

## Architecture

### Components

```
User Provisioning System
├── Use Cases
│   ├── CreateUserForPersonUseCase       # Create User account for existing Person
│   └── ResetUserPasswordUseCase         # Reset user password
├── Controllers
│   └── user-provisioning.controller.ts  # Server actions
├── UI Components
│   ├── /admin/user-provisioning         # Main provisioning page
│   ├── PersonsWithoutUsersTable         # List of Persons without Users
│   └── PasswordResetDialog              # Password reset component
└── Utilities
    └── password.ts                      # Secure password generation
```

### Data Flow

```
1. Admin navigates to /admin/user-provisioning
   ↓
2. Server fetches Persons without userId (only active employees)
   ↓
3. Admin selects employee and confirms account creation
   ↓
4. CreateUserForPersonUseCase executes:
   - Validates Person exists and not already linked
   - Generates secure random password
   - Hashes password with Better Auth crypto
   - Creates User record
   - Links Person.userId → User.id
   - Assigns default "viewer" role
   ↓
5. Credentials displayed ONCE (email + password)
   ↓
6. Admin copies credentials and shares via secure channel
```

## User Workflows

### Provisioning New User Accounts

**Prerequisites**:
- User must have `USERS_MANAGE` permission
- Employees must exist as Person records

**Steps**:

1. Navigate to **Admin → User Provisioning**
2. View list of employees without user accounts
3. Click **"Create User Account"** for the desired employee
4. Confirm the action in the dialog
5. **Copy credentials immediately** (displayed only once):
   - Email address
   - Generated password
   - Or use "Copy for Slack/Teams" for formatted message
6. Share credentials securely with the employee via:
   - Slack/Teams DM
   - Encrypted email
   - In-person handoff
7. Employee logs in with provided credentials

### Resetting User Passwords

**Prerequisites**:
- User must have `USERS_MANAGE` permission

**Steps**:

1. Navigate to **Admin → Users**
2. Find the user in the table
3. Click the **actions menu (⋮)** for the user
4. Select **"Reset Password"**
5. Confirm the reset action
6. **Copy new credentials immediately**:
   - Email (unchanged)
   - New generated password
7. Share new credentials securely with the user
8. User's existing sessions are invalidated automatically

## Technical Details

### Password Generation

```typescript
// Located in: src/lib/utils/password.ts

/**
 * Generates cryptographically secure random passwords
 *
 * Default: 16 characters with uppercase, lowercase, numbers, symbols
 * Character sets exclude ambiguous characters (I, O, l, 0, 1)
 */
generateSecurePassword(options?: {
  length?: number;           // Default: 16
  includeUppercase?: boolean; // Default: true
  includeLowercase?: boolean; // Default: true
  includeNumbers?: boolean;   // Default: true
  includeSymbols?: boolean;   // Default: true
})

// Example output: "kR7#mQx9Wp2$NbT5"
```

### Password Hashing

**CRITICAL**: Uses Better Auth's scrypt-based hashing, NOT bcrypt!

```typescript
import { hashPassword, verifyPassword } from "better-auth/crypto";

// Hash format: "salt:hash" (161 characters total)
const passwordHash = await hashPassword(plainPassword);

// Verification
const isValid = await verifyPassword(plainPassword, passwordHash);
```

**Why scrypt?**
- Better Auth v1.4.1 uses scrypt internally
- Mixing bcrypt and scrypt would break authentication
- Format: `salt:hash` (hex-encoded)
- Length: 161 characters

### Use Cases

#### CreateUserForPersonUseCase

**Location**: `src/core/use-cases/user-provisioning/create-user-for-person.use-case.ts`

**Input**:
```typescript
{
  personId: string;
  password?: string;      // Optional: auto-generated if not provided
  createdBy?: string;     // For audit trail
}
```

**Output**:
```typescript
{
  userId: string;
  personId: string;
  email: string;
  password: string;       // Plain text (only returned once!)
  passwordGenerated: boolean;
}
```

**Business Logic**:
1. Validates Person exists and has no existing User
2. Checks email uniqueness
3. Generates/hashes password
4. Creates User record via repository
5. Links Person to User (`person.userId = user.id`)
6. Assigns default "viewer" role
7. Logs all operations

#### ResetUserPasswordUseCase

**Location**: `src/core/use-cases/user-provisioning/reset-user-password.use-case.ts`

**Input**:
```typescript
{
  userId: string;
  newPassword?: string;   // Optional: auto-generated if not provided
  resetBy?: string;       // For audit trail
}
```

**Output**:
```typescript
{
  userId: string;
  email: string;
  password: string;       // Plain text (only returned once!)
  passwordGenerated: boolean;
}
```

**Business Logic**:
1. Validates User exists
2. Generates/hashes new password
3. Updates User's password via repository
4. Invalidates all existing sessions
5. Logs all operations

### Repository Methods

#### updatePassword

**Location**: `src/infrastructure/repositories/prisma-user.repository.ts`

```typescript
async updatePassword(userId: string, passwordHash: string): Promise<void> {
  // 1. Find credential account for user
  const account = await this.prisma.account.findFirst({
    where: { userId, provider: "credential" }
  });

  // 2. Update password hash
  await this.prisma.account.update({
    where: { id: account.id },
    data: { password: passwordHash, updatedAt: new Date() }
  });

  // 3. Invalidate all existing sessions (force re-login)
  await this.prisma.session.deleteMany({ where: { userId } });
}
```

### Security Considerations

#### Defense in Depth

1. **Server-Side Permission Checks** (Primary):
   ```typescript
   // In page.tsx
   await requirePermission(PERMISSIONS.USERS_MANAGE);
   ```

2. **Server Action Validation** (Secondary):
   ```typescript
   // In controllers
   const hasPermission = await checkPermission.execute({
     userId: user.id,
     permission: PERMISSIONS.USERS_MANAGE,
   });
   ```

3. **Client-Side Guards** (UX Only):
   ```typescript
   // For hiding UI elements
   <PermissionGuard permission={PERMISSIONS.USERS_MANAGE}>
   ```

#### Password Security

- **Generated Passwords**: 16 characters, high entropy (~95 bits)
- **Hashing**: scrypt (memory-hard, CPU-intensive)
- **Salt**: Unique per password (included in hash)
- **Display**: One-time only (not stored in plain text)
- **Transport**: HTTPS only (enforced by proxy.ts)

#### Session Management

- **Invalidation**: All sessions deleted on password reset
- **Force Re-login**: Users must re-authenticate with new password
- **Audit Trail**: All password changes logged with admin user ID

### Error Handling

All controllers use centralized error handling:

```typescript
import { handleControllerError } from "./error-handler";

try {
  // ... business logic
  return { success: true, data: result };
} catch (error) {
  const { user } = await getSession();
  return handleControllerError(
    error,
    {
      function: "createUserForPersonAction",
      userId: user?.id,
      personId,
    },
    "Failed to create user account for person",
  );
}
```

**Error Categories**:
- **Validation Errors**: ZodError → User-friendly field messages
- **Domain Errors**: NotFound, Duplicate, etc. → Business rule violations
- **Generic Errors**: Unexpected failures → Logged with full context

## UI Components

### PersonsWithoutUsersTable

**Location**: `src/components/user-provisioning/PersonsWithoutUsersTable.tsx`

**Features**:
- Displays Persons without User accounts
- Shows employee details (name, email, org unit, role)
- Inline "Create User Account" action
- Confirmation dialog before creation
- Credentials display with copy functionality
- Auto-refresh after account creation

**Dialog Flow**:
```
[Table] → [Create User] → [Confirm Dialog] → [Credentials Dialog]
                              ↓ Cancel
                           [Back to Table]
```

### PasswordResetDialog

**Location**: `src/components/user-provisioning/PasswordResetDialog.tsx`

**Features**:
- Reusable password reset component
- Confirmation before reset
- Credentials display with copy buttons
- "Copy for Slack/Teams" formatted message
- Session invalidation warning
- Auto-refresh after closing

**Usage**:
```tsx
<PasswordResetDialog
  userId={user.id}
  userEmail={user.email}
  trigger={
    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
      Reset Password
    </DropdownMenuItem>
  }
/>
```

## Database Schema

### Relevant Tables

#### Person
```prisma
model Person {
  id          String   @id @default(cuid())
  userId      String?  @unique  // Link to User account
  email       String   @unique
  firstName   String
  lastName    String
  middleName  String?
  isActive    Boolean  @default(true)

  // Relations
  user        User?    @relation(fields: [userId], references: [id])
}
```

#### User
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  emailVerified Boolean   @default(false)

  // Relations
  accounts      Account[]
  sessions      Session[]
  person        Person?   // Reverse relation
}
```

#### Account (Better Auth)
```prisma
model Account {
  id        String   @id @default(cuid())
  userId    String
  provider  String   // "credential" for password-based accounts
  password  String?  // scrypt hash (161 chars, "salt:hash" format)

  user      User     @relation(fields: [userId], references: [id])
}
```

## Configuration

### DI Container Registration

**Location**: `src/di/modules/user-provisioning.module.ts`

```typescript
export function bindUserProvisioningDependencies(container: Container): void {
  container
    .bind(DI_TOKENS.CreateUserForPersonUseCase)
    .to(CreateUserForPersonUseCase);

  container
    .bind(DI_TOKENS.ResetUserPasswordUseCase)
    .to(ResetUserPasswordUseCase);
}
```

### Permissions

**Required Permission**: `USERS_MANAGE`

**Permission Group**: Users Management

**Granted To** (by default):
- `system-administrator` role
- `user-manager` role

**To Grant Permission**:
```bash
npm run roles:manage
# Select user → Assign role with USERS_MANAGE permission
```

## Testing

### Manual Testing Checklist

**User Provisioning**:
- [ ] Navigate to `/admin/user-provisioning`
- [ ] Verify only Persons without Users are shown
- [ ] Click "Create User Account" for a Person
- [ ] Confirm action
- [ ] Verify credentials display
- [ ] Copy email and password
- [ ] Close dialog
- [ ] Verify Person removed from list (now has User)
- [ ] Login with generated credentials
- [ ] Verify successful authentication

**Password Reset**:
- [ ] Navigate to `/admin/users`
- [ ] Find user with account
- [ ] Click actions menu → "Reset Password"
- [ ] Confirm reset
- [ ] Verify new credentials display
- [ ] Copy new password
- [ ] Close dialog
- [ ] Login with new password (original should fail)
- [ ] Verify successful authentication

**Permission Guards**:
- [ ] Login as viewer (no USERS_MANAGE permission)
- [ ] Navigate to `/admin/user-provisioning`
- [ ] Verify "Access Denied" message
- [ ] Verify User Provisioning link not in admin nav

### Automated Tests

**Password Utilities**:
```bash
# Test password generation and hashing
npx tsx scripts/dev/test-password-compatibility.ts
```

Expected output:
```
✓ Generated password length: 16
✓ Hash length: 161 (Better Auth scrypt format)
✓ Hash format: VALID (salt:hash)
✓ Verification: PASS
✓ Passwords are unique: PASS
```

## Troubleshooting

### Issue: "Person is already linked to user account"

**Cause**: Person already has a User account

**Solution**:
1. Check Person record: `person.userId` should be `null` for provisioning
2. Verify User doesn't already exist with same email
3. If unlinking needed, use utility script:
   ```bash
   npx tsx scripts/users/link-user-to-person.ts
   ```

### Issue: "User account already exists with email"

**Cause**: Email address already registered

**Solution**:
1. Check if User exists: `/admin/users`
2. If duplicate, update Person email before provisioning
3. If legitimate, link existing User to Person instead

### Issue: "Viewer role not found"

**Cause**: Database not seeded properly

**Solution**:
```bash
npm run db:seed
```

This creates default roles including "viewer".

### Issue: Password doesn't work for login

**Cause**: Password hash format mismatch

**Diagnosis**:
```bash
# Check existing password hash format
npx dotenv -e .env.local -- npx tsx -e "
import { prisma } from './src/infrastructure/database/prisma/client.ts';
(async()=>{
  const account = await prisma.account.findFirst({
    where: { provider: 'credential' },
    select: { password: true }
  });
  console.log('Hash length:', account?.password?.length);
  console.log('Expected: 161 (scrypt)');
  await prisma.\$disconnect();
})();
"
```

**Solution**: Ensure using Better Auth crypto functions:
```typescript
import { hashPassword } from "better-auth/crypto";
// NOT bcrypt!
```

### Issue: Dialog auto-dismisses after password reset

**Cause**: Event propagation or timing issues

**Solution**: Already fixed in v1.0.0 via:
- Event prevention (`e.preventDefault()`, `e.stopPropagation()`)
- Timing delay between dialog transitions (100ms)
- Explicit button type (`type="button"`)

## Future Enhancements

### Planned Features

1. **Email Delivery** (Post-SSO Integration):
   - Send credentials via email
   - Password reset links
   - Email templates

2. **Temporary Passwords**:
   - Force password change on first login
   - Expiration timers
   - Password strength requirements

3. **Bulk Provisioning**:
   - Select multiple employees
   - CSV export of credentials
   - Batch operations

4. **Self-Service Password Reset**:
   - User-initiated resets
   - Email verification
   - Security questions

5. **SSO Integration**:
   - OAuth providers (Google, Microsoft)
   - SAML support
   - Auto-provisioning from directory

### Migration Path to SSO

When SSO is ready:
1. Enable SSO provider in Better Auth config
2. Migrate existing users to SSO accounts
3. Deprecate password-based provisioning
4. Keep password reset for emergency access

## Related Documentation

- [SYSTEM_SETUP.md](./SYSTEM_SETUP.md) - Initial admin setup
- [RBAC_ADMIN_GUIDE.md](./RBAC_ADMIN_GUIDE.md) - Permission management
- [DATABASE_SEEDING.md](../guides/DATABASE_SEEDING.md) - Seed data setup
- [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md) - Development workflow

## API Reference

### Server Actions

#### listPersonsWithoutUsersAction

**Location**: `src/interface-adapters/controllers/user-provisioning.controller.ts`

```typescript
export async function listPersonsWithoutUsersAction(): Promise<
  ActionResponse<PersonWithoutUserDTO[]>
>
```

**Returns**: Array of Persons with `userId: null` and `isActive: true`

#### createUserForPersonAction

**Location**: `src/interface-adapters/controllers/user-provisioning.controller.ts`

```typescript
export async function createUserForPersonAction(
  personId: string
): Promise<ActionResponse<UserCredentialsDTO>>
```

**Returns**: User credentials with generated password

#### resetUserPasswordAction

**Location**: `src/interface-adapters/controllers/user-provisioning.controller.ts`

```typescript
export async function resetUserPasswordAction(
  userId: string
): Promise<ActionResponse<UserCredentialsDTO>>
```

**Returns**: New user credentials with reset password

## Changelog

### v1.0.0 (November 25, 2024)

**Added**:
- ✅ User provisioning for existing Persons
- ✅ Admin password reset functionality
- ✅ Secure password generation (16 chars, crypto.randomBytes)
- ✅ Better Auth scrypt-compatible hashing
- ✅ One-time credentials display
- ✅ Copy for Slack/Teams formatting
- ✅ Session invalidation on password reset
- ✅ Permission guards (USERS_MANAGE)
- ✅ Audit logging
- ✅ /admin/user-provisioning page
- ✅ Enhanced /admin/users with reset option
- ✅ Comprehensive documentation

**Fixed**:
- ✅ Dialog auto-dismiss issues
- ✅ Event propagation in confirmation dialogs
- ✅ Timing issues with sequential dialogs

**Security**:
- ✅ Server-side permission validation
- ✅ Cryptographically secure password generation
- ✅ Better Auth-compatible password hashing
- ✅ Session invalidation on password changes
- ✅ One-time credential display
- ✅ Comprehensive error handling

---

**Maintained by**: Barq Technology Team
**Questions**: See [DEVELOPER_GUIDE.md](../guides/DEVELOPER_GUIDE.md)

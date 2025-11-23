# First User System Administrator Assignment

## Overview

The first user to sign in to the application is **automatically assigned the System Administrator role**. This provides a seamless bootstrap experience without requiring manual database manipulation.

## How It Works

### Automatic Assignment (Primary Method)

When a user signs in via Microsoft OAuth (or any other auth method):

1. Better Auth hook intercepts the sign-in event
2. System checks if this user has any roles
3. If user has no roles, system counts total users
4. A serializable transaction re-checks total users and role existence atomically
5. If total users = 1, user is assigned the **System Administrator role** automatically and the audit log records the change

**Location**: [src/lib/auth/better-auth.ts](../../src/lib/auth/better-auth.ts#L28-L135)

### Manual Assignment (Fallback Method)

If automatic assignment fails or you need to manually assign System Administrator to the first user:

```bash
# Run the System Administrator assignment utility
npm run db:assign-admin
```

This script:

- Finds the first user (by creation date)
- Checks if they have System Administrator role
- Assigns System Administrator role if missing
- Safe to run multiple times (idempotent)

**Location**: [src/lib/auth/assign-first-admin.ts](../../src/lib/auth/assign-first-admin.ts)

## Setup Requirements

### 1. Run RBAC Seed First

Before the first user signs in, ensure roles and permissions exist:

```bash
# Seed roles and permissions
npm run db:seed
```

This creates the system roles including **System Administrator**.

### 2. Sign In as First User

Simply sign in via Microsoft OAuth:

1. Navigate to `/login`
2. Click "Continue with Microsoft"
3. Complete OAuth flow
4. You're now a System Administrator! 🎉

## Verification

### Check System Administrator Assignment

After signing in as the first user:

1. **Via Database**:

   ```sql
   SELECT u.email, r.name as role
   FROM users u
   JOIN user_roles ur ON u.id = ur."userId"
   JOIN roles r ON ur."roleId" = r.id
   ORDER BY u."createdAt" ASC
   LIMIT 1;
   ```

2. **Via UI**:
   - Navigate to `/admin/users`
   - View your user entry
   - Should show "system-administrator" role

3. **Via Logs**:
   Check server console for:
   ```
   ✅ First user {userId} automatically assigned System Administrator role
   ```

## Troubleshooting

### System Administrator Role Not Assigned

**Problem**: First user doesn't have System Administrator role after sign-in

**Solutions**:

1. **Check if RBAC seed was run**:

   ```bash
   npm run db:seed
   ```

2. **Manually assign System Administrator**:

   ```bash
   npm run db:assign-admin
   ```

3. **Check server logs** for errors (transaction failures or missing role warnings):
   ```
   ⚠️ System Administrator role not found. Run: npm run db:seed
   ```

### Multiple Users, No Admin

**Problem**: Database has multiple users, none are System Administrators

**Solution**: Manually assign System Administrator to a specific user via admin UI or SQL:

```sql
-- Get System Administrator role ID
SELECT id FROM roles WHERE name = 'system-administrator';

-- Assign to user by email
INSERT INTO user_roles (id, "userId", "roleId", "assignedBy", "createdAt", "updatedAt")
SELECT gen_random_uuid(), u.id, r.id, 'manual', NOW(), NOW()
FROM users u, roles r
WHERE u.email = 'your-email@example.com'
  AND r.name = 'system-administrator'
ON CONFLICT DO NOTHING;
```

## Technical Details

### Better Auth Hook

The automatic assignment uses Better Auth's lifecycle hooks and an internal helper that runs inside a Prisma serializable transaction. This guarantees only the first successful transaction can grant the admin role:

```typescript
const result = await assignAdminRoleToFirstUser(userId);

if (result.assigned) {
  console.log(
    `✅ First user ${userId} automatically assigned System Administrator role`,
  );
} else if (result.reason === "missing-role") {
  console.error("⚠️ System Administrator role not found. Run: npm run db:seed");
}
```

### Why This Approach?

**Advantages**:

- ✅ Zero manual setup for first-time users
- ✅ Works with any auth provider (OAuth, email/password)
- ✅ Idempotent (safe to run multiple times)
- ✅ Non-blocking (user creation succeeds even if hook fails)

**Alternatives Considered**:

- ❌ Manual SQL insertion (requires database access)
- ❌ Hardcoded admin email (inflexible)
- ❌ CLI during setup (extra step for developers)

## Security Considerations

### Is This Secure?

Yes, with proper precautions:

1. **Only first user gets System Administrator** - Serializable transaction prevents race conditions where two simultaneous sign-ups both get the role.
2. **Requires RBAC seed** - System must be initialized first
3. **Non-reversible** - Once assigned, role persists (intentional)
4. **Logged** - All assignments are logged for audit trail

### Production Deployment

For production environments:

1. **Deploy with RBAC seed** - Ensure `npm run db:seed` runs during deployment
2. **First deployment sign-in** - Have a trusted user sign in first
3. **Verify admin assignment** - Check logs and database
4. **Lock down auth** - Configure Microsoft OAuth for your organization only

### Revoking First User System Administrator

If the first user should not be a System Administrator:

```sql
-- Remove System Administrator role from user
DELETE FROM user_roles
WHERE "userId" = 'user-id-here'
  AND "roleId" = (SELECT id FROM roles WHERE name = 'system-administrator');
```

Or via Admin UI:

1. Navigate to `/admin/users`
2. Select the user
3. Remove System Administrator role
4. Assign appropriate role

## Related Documentation

- [RBAC System Overview](../architecture/RBAC.md) - Complete RBAC documentation
- [Authentication Setup](./AUTHENTICATION.md) - Better Auth configuration
- [Admin Dashboard](./ADMIN_DASHBOARD.md) - Managing users and roles

## Quick Reference

| Task                  | Command                       |
| --------------------- | ----------------------------- |
| Seed RBAC data        | `npm run db:seed`             |
| Manually assign admin | `npm run db:assign-admin`     |
| View first user       | Prisma Studio or SQL query    |
| Check logs            | Server console during sign-in |

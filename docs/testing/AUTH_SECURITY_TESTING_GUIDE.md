# Authentication Security Testing Guide

This guide provides manual testing procedures to verify the OAuth token encryption and hybrid route protection implementation.

## Prerequisites

- Development environment running (`npm run dev`)
- PostgreSQL database running
- Redis running (for session storage)
- Microsoft OAuth credentials configured in `.env.local`
- Database seeded with RBAC roles (`npm run db:seed`)

## Test Suite Overview

### 1. Token Encryption Tests

### 2. Route Protection Tests (Middleware Layer)

### 3. Component-Level Auth Tests

### 4. Permission-Based Access Tests

---

## 1. Token Encryption Tests

### 1.1 Verify Encryption is Active

**Objective**: Confirm that OAuth tokens are encrypted in the database

**Steps**:

1. **Clear existing sessions and accounts** (optional - fresh start):

   ```sql
   -- In Prisma Studio or psql
   DELETE FROM "sessions";
   DELETE FROM "accounts";
   DELETE FROM "user_roles";
   DELETE FROM "users";
   ```

2. **Sign in with Microsoft OAuth**:
   - Navigate to `http://localhost:3000/login`
   - Click "Continue with Microsoft"
   - Complete OAuth flow
   - You should be redirected to `/dashboard`

3. **Inspect database to verify encryption**:

   ```bash
   npm run db:studio
   ```

   In Prisma Studio:
   - Open `accounts` table
   - Find your account record
   - Inspect `accessToken`, `refreshToken`, and `idToken` fields

**Expected Results**:

- ✅ All token fields should contain base64-encoded encrypted data (not plain JWT)
- ✅ Encrypted values should be significantly longer than original tokens
- ✅ Encrypted values should NOT start with `eyJ` (JWT prefix)
- ✅ Each token should have different encrypted values even for same user

**Example**:

```
❌ BAD (Plaintext):
accessToken: "eyJhbGciOiJSUzI1NiIsImtpZCI..."

✅ GOOD (Encrypted):
accessToken: "xK9mJ2vL8pN5qR3tY7wZ1..." (base64-encoded ciphertext)
```

### 1.2 Verify Decryption Works

**Objective**: Confirm that encrypted tokens are decrypted correctly for use

**Steps**:

1. **After signing in, stay on dashboard**
2. **Open browser DevTools → Network tab**
3. **Trigger any API request that requires authentication**:
   - Navigate to `/tasks` page
   - Create a new task
   - Observe API requests

**Expected Results**:

- ✅ All authenticated API requests should succeed (200 OK)
- ✅ No decryption errors in console
- ✅ Session remains active (user stays logged in)

### 1.3 Verify Token Re-encryption on Update

**Objective**: Confirm tokens are re-encrypted when updated (e.g., token refresh)

**Steps**:

1. **Force a token refresh** (if your OAuth provider supports it)
2. **Check database**:

   ```bash
   npm run db:studio
   ```

   - Inspect `accounts` table
   - Note the `accessToken` value

3. **Wait for token to be refreshed** (or manually trigger via API)
4. **Check database again**

**Expected Results**:

- ✅ New `accessToken` value should be different (new encryption with new IV/salt)
- ✅ Still base64-encoded (encrypted)
- ✅ No errors during refresh process

### 1.4 Run Automated Encryption Tests

**Objective**: Verify encryption unit tests pass

**Steps**:

```bash
npm test tests/unit/auth-encryption.test.ts
```

**Expected Results**:

- ✅ All 20+ test cases should pass
- ✅ No test failures or errors
- ✅ Tests cover:
  - Encryption/decryption round-trip
  - Random IV (different ciphertexts)
  - Null token handling
  - Long token handling
  - Tampering detection
  - Real-world OAuth token formats

---

## 2. Route Protection Tests (Middleware Layer)

### 2.1 Test Unauthenticated Access to Protected Routes

**Objective**: Verify middleware redirects unauthenticated users

**Steps**:

1. **Sign out** (if signed in):
   - Click user menu → Sign Out
   - OR clear cookies in DevTools

2. **Attempt to access protected routes directly**:
   - Navigate to `http://localhost:3000/dashboard`
   - Navigate to `http://localhost:3000/tasks`
   - Navigate to `http://localhost:3000/admin`

**Expected Results**:

- ✅ Immediately redirected to `/login?from=/dashboard` (or respective route)
- ✅ No content from protected page is rendered
- ✅ Redirect happens BEFORE page component loads

### 2.2 Test Public Routes are Accessible

**Objective**: Verify public routes remain accessible without auth

**Steps**:

1. **Ensure you're signed out**
2. **Access public routes**:
   - Navigate to `http://localhost:3000/` (home)
   - Navigate to `http://localhost:3000/login`
   - Navigate to `http://localhost:3000/setup` (should redirect if admin exists)

**Expected Results**:

- ✅ All public routes load without redirect
- ✅ No authentication errors
- ✅ Login page displays correctly

### 2.3 Test Return URL After Login

**Objective**: Verify users are redirected to intended page after login

**Steps**:

1. **Sign out** (if signed in)
2. **Navigate to protected route**: `http://localhost:3000/tasks`
3. **You should be redirected to**: `/login?from=/tasks`
4. **Complete Microsoft OAuth login**

**Expected Results**:

- ✅ After login, redirected to `/tasks` (the `from` parameter)
- ✅ Not redirected to default `/dashboard`
- ✅ Seamless UX - user lands where they intended

### 2.4 Test Middleware Performance

**Objective**: Verify middleware doesn't add significant latency

**Steps**:

1. **Sign in** (to test authenticated requests)
2. **Open DevTools → Network tab**
3. **Navigate between protected pages**:
   - `/dashboard` → `/tasks` → `/admin` → `/dashboard`
4. **Observe request timings**

**Expected Results**:

- ✅ Page loads remain fast (< 200ms server time)
- ✅ No noticeable delay from middleware
- ✅ Session check is efficient (cached in Better Auth)

---

## 3. Component-Level Auth Tests

### 3.1 Test Dashboard Template Protection

**Objective**: Verify server-side auth check in dashboard template

**Steps**:

1. **Disable middleware temporarily** (for testing):
   - Comment out middleware matcher in `proxy.ts`:
     ```typescript
     export const config = {
       matcher: [], // Disabled for testing
     };
     ```

2. **Restart dev server**: `npm run dev`

3. **Sign out and try to access**: `http://localhost:3000/dashboard`

**Expected Results**:

- ✅ Still protected (template-level check catches it)
- ✅ Error page or redirect occurs
- ✅ No dashboard content rendered

4. **Re-enable middleware**:
   - Uncomment matcher
   - Restart dev server

### 3.2 Test Admin Layout Protection

**Objective**: Verify admin routes check for admin permissions

**Steps**:

1. **Sign in as non-admin user** (create test user without admin role):

   ```bash
   # Create a second user via login
   # Don't assign admin role
   ```

2. **Attempt to access**: `http://localhost:3000/admin`

**Expected Results**:

- ✅ Redirected to `/` (home/dashboard)
- ✅ Not allowed to view admin panel
- ✅ `hasAnyPermission()` check in layout works

3. **Sign in as admin user** (first user or manually assigned)
4. **Access**: `http://localhost:3000/admin`

**Expected Results**:

- ✅ Admin panel loads successfully
- ✅ All admin tabs visible
- ✅ Full access granted

### 3.3 Test Page-Level Permission Checks

**Objective**: Verify individual pages check for specific permissions

**Steps**:

1. **Sign in as user with limited permissions** (e.g., viewer role)
2. **Attempt to access**: `http://localhost:3000/tasks`

**Expected Results**:

- ✅ If viewer has `TASKS_VIEW` permission: Page loads
- ✅ If viewer lacks permission: Error or redirect
- ✅ `requirePermission()` enforced in server component

---

## 4. Permission-Based Access Tests

### 4.1 Test Permission Cache

**Objective**: Verify permission caching works correctly

**Steps**:

1. **Sign in as admin**
2. **Access admin panel**: `http://localhost:3000/admin/users`
3. **Open DevTools → Network tab**
4. **Navigate between admin pages**:
   - Users → Roles → Permissions → Users (repeat)

**Expected Results**:

- ✅ Permission API called once on first load
- ✅ Subsequent navigation uses cached permissions (no API call)
- ✅ UI remains responsive

### 4.2 Test Permission Invalidation

**Objective**: Verify cache invalidates when permissions change

**Steps**:

1. **Sign in as admin**
2. **Open two browser windows**:
   - Window A: Admin panel
   - Window B: User management

3. **In Window B, remove a permission from your role**
4. **In Window A, try to access a feature requiring that permission**

**Expected Results**:

- ✅ Initially can access (cached permissions)
- ✅ After cache TTL (5 min), permission denied
- ✅ Cache invalidation works as expected

### 4.3 Test Ownership-Based Permissions

**Objective**: Verify `:own` suffix permissions work

**Steps**:

1. **Create two users**:
   - User A (editor role - can edit own tasks)
   - User B (editor role - can edit own tasks)

2. **As User A, create a task**
3. **Note the task ID**
4. **Sign in as User B**
5. **Attempt to edit User A's task**

**Expected Results**:

- ✅ User B cannot edit User A's task (`TASKS_UPDATE:own` enforced)
- ✅ User B can only edit their own tasks
- ✅ Ownership check in permission system works

---

## 5. Security Tests

### 5.1 Test Session Expiry

**Objective**: Verify sessions expire after 7 days

**Steps**:

1. **Sign in**
2. **Check database for session expiry**:
   ```sql
   SELECT "userId", "expires", "sessionToken"
   FROM "sessions"
   WHERE "userId" = 'your-user-id';
   ```

**Expected Results**:

- ✅ `expires` field is ~7 days from now
- ✅ Session cookie has matching expiry
- ✅ Expiry matches config (60 _ 60 _ 24 \* 7)

### 5.2 Test CSRF Protection

**Objective**: Verify CSRF tokens are validated (Better Auth should handle)

**Steps**:

1. **Sign in**
2. **Open DevTools → Console**
3. **Attempt manual POST request without CSRF token**:
   ```javascript
   fetch("/api/auth/signout", {
     method: "POST",
     credentials: "include",
   });
   ```

**Expected Results**:

- ✅ Request blocked or fails validation
- ✅ Better Auth CSRF protection active
- ✅ No unauthorized actions performed

### 5.3 Test Token Tampering Detection

**Objective**: Verify authentication tag prevents tampering

**Steps**:

1. **Sign in and get OAuth tokens**
2. **In database, manually tamper with encrypted token**:

   ```sql
   UPDATE "accounts"
   SET "accessToken" = SUBSTRING("accessToken", 1, LENGTH("accessToken") - 5) || 'XXXXX'
   WHERE "userId" = 'your-user-id';
   ```

3. **Make an authenticated API request**

**Expected Results**:

- ✅ Decryption fails (authentication tag mismatch)
- ✅ Error thrown: "Failed to decrypt data"
- ✅ Tampering detected and prevented

---

## 6. Hybrid Defense Verification

### 6.1 Test Defense-in-Depth Layers

**Objective**: Verify all 3 protection layers work

**Steps**:

1. **Sign out**
2. **Attempt to access protected route**: `/dashboard`

**Verify Layer 1 (Middleware)**:

- ✅ Redirected to `/login` immediately
- ✅ No page render started

3. **Disable middleware** (comment out matcher)
4. **Restart server and try again**

**Verify Layer 2 (Template)**:

- ✅ Template-level `requireAuth()` catches it
- ✅ Error or redirect occurs
- ✅ Still protected

5. **Disable template check** (comment out `requireAuth()`)
6. **Try again**

**Verify Layer 3 (Page)**:

- ✅ Individual page permission checks catch it
- ✅ Still protected at page level

**Expected Results**:

- ✅ All 3 layers provide protection
- ✅ No single point of failure
- ✅ Defense-in-depth strategy validated

---

## 7. Automated Test Execution

### Run All Tests

```bash
# Run all unit tests
npm test

# Run specific auth encryption tests
npm test tests/unit/auth-encryption.test.ts

# Run with UI (visual test runner)
npm run test:ui
```

**Expected Results**:

- ✅ All tests pass
- ✅ 100% pass rate
- ✅ No flaky tests

---

## Common Issues & Troubleshooting

### Issue: "ENCRYPTION_KEY must be 64 hex characters"

**Solution**:

```bash
# Generate new encryption key
openssl rand -hex 32

# Add to .env.local
ENCRYPTION_KEY=<generated-key>
```

### Issue: "prisma.$use is not a function"

**Solution**:

- Already fixed in this implementation
- Using Prisma Client Extensions instead
- Ensure you've restarted dev server

### Issue: "Failed to decrypt data"

**Possible Causes**:

1. ENCRYPTION_KEY changed (tokens encrypted with old key)
2. Database corruption
3. Manual tampering

**Solution**:

```sql
-- Clear all accounts and sessions (forces re-login)
DELETE FROM "sessions";
DELETE FROM "accounts";
```

### Issue: Middleware not working

**Solution**:

1. Verify `proxy.ts` is at project root (not in `src/`)
2. Check matcher configuration
3. Restart dev server
4. Clear Next.js cache: `rm -rf .next`

---

## Success Criteria Checklist

After completing all tests, verify:

- [ ] OAuth tokens are encrypted in database (not plaintext)
- [ ] Tokens decrypt correctly for API usage
- [ ] Unauthenticated users redirected to login
- [ ] Public routes remain accessible
- [ ] Return URL works after login
- [ ] Dashboard template enforces authentication
- [ ] Admin layout enforces admin permissions
- [ ] Page-level permission checks work
- [ ] Permission caching reduces API calls
- [ ] Ownership-based permissions enforced
- [ ] Sessions expire after 7 days
- [ ] Token tampering is detected
- [ ] All 3 defense layers protect routes
- [ ] All automated tests pass

---

## Security Audit Checklist

Final security verification:

- [ ] ENCRYPTION_KEY is 64-character hex (32 bytes)
- [ ] ENCRYPTION_KEY is in `.env.local` (gitignored)
- [ ] No plaintext tokens in database
- [ ] AES-256-GCM with authentication tag
- [ ] Random IV and salt per encryption
- [ ] PBKDF2 with 100,000 iterations
- [ ] Middleware catches unauthorized access
- [ ] Template/layout layer provides backup
- [ ] CSRF protection active (Better Auth)
- [ ] Sessions have proper expiry (7 days)
- [ ] Permission cache has TTL (5 minutes)
- [ ] No credentials in version control

---

## Next Steps

After successful testing:

1. ✅ Deploy to staging environment
2. ✅ Run same test suite in staging
3. ✅ Security audit by team
4. ✅ Penetration testing (if required)
5. ✅ Deploy to production

**Documentation**:

- [ ] Update CLAUDE.md with encryption status
- [ ] Document token encryption in architecture docs
- [ ] Add troubleshooting guide to docs
- [ ] Training for team on new auth system

---

**Test Date**: **\*\***\_**\*\***
**Tester**: **\*\***\_**\*\***
**Environment**: Development / Staging / Production
**Status**: ⬜ Pass / ⬜ Fail / ⬜ Needs Review

# Role Manager Script - Testing Guide

This document provides guidance for testing the interactive user role manager script.

## Technology Stack

- **@inquirer/prompts v8**: Modern ESM API for interactive CLI prompts
- **chalk v5**: Terminal styling and colors
- **Prisma v7**: Type-safe database access
- **TypeScript 5.9**: Full type safety

## Prerequisites

- Database seeded with test users and roles (`npm run db:seed`)
- `.env.local` configured with `DATABASE_URL`
- Terminal with interactive prompt support

## Test Scenarios

### 1. Basic Functionality Tests

#### Test 1.1: Display Help
```bash
npm run roles:manage -- --help
```

**Expected**: Help text displayed with usage instructions, features, and examples.

#### Test 1.2: User Selection
```bash
npm run roles:manage
```

**Steps**:
1. Script displays banner and database connection info
2. List of users appears
3. Select a user from the list

**Expected**: User summary displayed with current roles.

### 2. Add Roles Tests

#### Test 2.1: Add Non-Conflicting Role
**Steps**:
1. Select a user (e.g., `test-viewer@barq.internal`)
2. Choose "Add roles"
3. Select "asset-manager" role
4. Confirm without expiration date
5. Confirm changes

**Expected**:
- Role added successfully
- Audit log entry created
- User summary refreshed showing new role

#### Test 2.2: Add Conflicting Role (Critical)
**Steps**:
1. Select a user with `system-administrator` role
2. Choose "Add roles"
3. Select "auditor" role
4. Attempt to add

**Expected**:
- Conflict detected with CRITICAL severity
- Assignment blocked with error message
- No changes made to database

#### Test 2.3: Add Conflicting Role (Warning)
**Steps**:
1. Select a user with `security-officer` role
2. Choose "Add roles"
3. Select "service-owner" role
4. Warning displayed - confirm to override

**Expected**:
- Conflict detected with WARNING severity
- User prompted to confirm override
- If confirmed, role added with conflict logged in audit

#### Test 2.4: Add Role with Expiration
**Steps**:
1. Select a user
2. Choose "Add roles"
3. Select any role
4. Choose to set expiration date
5. Enter future date (e.g., 2025-12-31)
6. Confirm changes

**Expected**:
- Role added with expiration date
- Summary shows expiration date next to role

#### Test 2.5: Add Duplicate Role
**Steps**:
1. Select a user with existing roles
2. Choose "Add roles"
3. Try to add a role user already has

**Expected**:
- Role not shown in available list (filtered out)
- Or if somehow selected, skipped with message

### 3. Remove Roles Tests

#### Test 3.1: Remove Single Role
**Steps**:
1. Select a user with multiple roles
2. Choose "Remove roles"
3. Select one role to remove
4. Confirm changes

**Expected**:
- Role removed successfully
- Audit log entry created with ROLE_REVOKED action
- User summary refreshed without the role

#### Test 3.2: Remove Multiple Roles
**Steps**:
1. Select a user with 3+ roles
2. Choose "Remove roles"
3. Select multiple roles (use space bar)
4. Confirm changes

**Expected**:
- All selected roles removed
- Multiple audit log entries created
- User summary refreshed

#### Test 3.3: Remove All Roles
**Steps**:
1. Select a user with roles
2. Choose "Remove roles"
3. Select all roles
4. Confirm changes

**Expected**:
- All roles removed
- User summary shows "(no roles assigned)"

### 4. Dry-Run Mode Tests

#### Test 4.1: Dry-Run Add
```bash
npm run roles:manage -- --dry-run
```

**Steps**:
1. Select user
2. Choose "Add roles"
3. Select roles
4. Confirm preview

**Expected**:
- Preview shown with changes
- Message: "Dry-run complete (no changes applied)"
- No database changes made
- No audit logs created

#### Test 4.2: Dry-Run Remove
```bash
npm run roles:manage -- --dry-run
```

**Steps**:
1. Select user
2. Choose "Remove roles"
3. Select roles
4. Confirm preview

**Expected**:
- Preview shown with roles to remove
- No database changes made
- No audit logs created

### 5. Navigation Tests

#### Test 5.1: Switch User
**Steps**:
1. Select first user
2. View roles
3. Choose "Switch user"
4. Select different user

**Expected**:
- Return to user selection
- New user summary displayed

#### Test 5.2: View Roles Only
**Steps**:
1. Select user
2. Choose "View role details"
3. Press Enter

**Expected**:
- User summary displayed (already shown)
- Return to action menu

#### Test 5.3: Exit
**Steps**:
1. Select user
2. Choose "Exit"

**Expected**:
- "Goodbye! 👋" message
- Script exits cleanly
- Prisma disconnects

### 6. Error Handling Tests

#### Test 6.1: User Not Found (Edge Case)
**Note**: This is difficult to trigger in normal flow, but handled in code.

#### Test 6.2: Database Connection Failure
**Steps**:
1. Stop PostgreSQL service
2. Run script

**Expected**:
- Connection error displayed
- Script exits with error code 1

#### Test 6.3: Ctrl+C Cancellation
**Steps**:
1. Run script
2. Press Ctrl+C during any prompt

**Expected**:
- "Operation cancelled by user"
- Clean exit

### 7. Validation Tests

#### Test 7.1: Invalid Expiration Date
**Steps**:
1. Add role with expiration
2. Enter invalid date (e.g., "not-a-date")

**Expected**:
- Validation error displayed
- Re-prompt for valid date

#### Test 7.2: Past Expiration Date
**Steps**:
1. Add role with expiration
2. Enter past date (e.g., "2023-01-01")

**Expected**:
- Validation error: "must be today or in the future"
- Re-prompt for valid date

### 8. Audit Trail Verification

After any add/remove operation, verify audit logs:

```sql
-- View recent audit logs
SELECT
  "entityId",
  "entityType",
  "action",
  "performedBy",
  details,
  "createdAt"
FROM "AuditLog"
WHERE "entityType" = 'User'
  AND "performedBy" = 'cli-script'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected Fields**:
- `entityType`: "User"
- `action`: "ROLE_ASSIGNED" or "ROLE_REVOKED"
- `performedBy`: "cli-script"
- `details`: JSON with `roleId`, `roleName`, and optional `conflicts`

## Known Limitations

1. **Permission Cache**: The script notes that permission cache invalidation requires Redis setup. If Redis is not running, a note is displayed but operations continue.

2. **Interactive Only**: Script requires TTY (terminal) and cannot be automated without additional tooling.

3. **Single User at a Time**: Designed for one user at a time. For bulk operations across multiple users, consider using the web UI bulk assignment feature.

## Conflict Detection Reference

### Critical Conflicts (Blocks Assignment)
- `system-administrator` ↔ `auditor`
- `auditor` ↔ `finance-manager`
- `auditor` ↔ `asset-coordinator`
- `external-auditor` ↔ `system-administrator`

### Error Conflicts (Blocks Assignment)
- `finance-manager` ↔ `inventory-manager`
- `asset-coordinator` ↔ `inventory-manager`

### Warning Conflicts (Allows Override)
- `security-officer` ↔ `service-owner`
- Other segregation of duties combinations

## Success Criteria

✅ All test scenarios complete without errors
✅ Audit logs created for all changes
✅ Conflict detection working for all severity levels
✅ Dry-run mode prevents database changes
✅ Help and navigation work as expected
✅ User confirmations prevent accidental changes
✅ Transaction rollback on errors

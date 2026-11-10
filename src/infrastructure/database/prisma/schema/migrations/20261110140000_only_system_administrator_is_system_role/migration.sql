-- RBAC policy: only the System Administrator remains a protected role.
-- This is a data-only migration; role IDs, assignments and permissions remain intact.
-- Existing customized roles become editable without any destructive changes.
UPDATE "roles"
SET
  "isSystem" = ("name" = 'system-administrator'),
  "updatedAt" = NOW()
WHERE "isSystem" IS DISTINCT FROM ("name" = 'system-administrator');

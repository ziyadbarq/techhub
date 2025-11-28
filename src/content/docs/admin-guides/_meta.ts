/**
 * Admin Guides Category Metadata
 * Permission-gated for administrators only
 */
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";

export default {
  title: "Admin Guides",
  description: "System administration and RBAC",
  icon: "ShieldCheck",
  order: 3,
  requiredPermission: PERMISSIONS.USERS_MANAGE,
};

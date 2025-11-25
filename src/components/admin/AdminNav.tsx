/**
 * Admin Navigation Component
 *
 * Provides navigation for admin sections with permission-based visibility.
 * Integrates with the existing permission system.
 *
 * Features:
 * - Tab-based navigation for desktop
 * - Permission guards for each section
 * - Active route highlighting
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * import { AdminNav } from "@/components/admin/AdminNav";
 *
 * export default function AdminLayout({ children }) {
 *   return (
 *     <div>
 *       <AdminNav />
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Key,
  Users,
  FileText,
  Settings,
  Database,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import {
  PERMISSIONS,
  type PermissionKey,
} from "@/core/domain/value-objects/permission-key";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
  badge?: string;
  description?: string;
}

const adminNavItems: AdminNavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: Settings,
    description: "Admin dashboard overview",
    permission: PERMISSIONS.USERS_MANAGE,
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: Shield,
    description: "Manage user roles",
    permission: PERMISSIONS.ROLES_VIEW,
  },
  {
    title: "Permissions",
    href: "/admin/permissions",
    icon: Key,
    description: "Manage permissions",
    permission: PERMISSIONS.PERMISSIONS_VIEW,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage users",
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    title: "User Provisioning",
    href: "/admin/user-provisioning",
    icon: UserPlus,
    description: "Create user accounts for employees",
    permission: PERMISSIONS.USERS_MANAGE,
  },
  {
    title: "Data Import",
    href: "/data-import",
    icon: Database,
    description: "Universal data importer for all entities",
    permission: PERMISSIONS.DATA_IMPORT_MANAGE,
  },
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    description: "View audit logs",
    permission: PERMISSIONS.AUDIT_LOGS_VIEW,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const { hasPermission, isLoading } = usePermissions();

  // Filter navigation items based on user permissions
  const visibleNavItems = adminNavItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // If loading, show skeleton or nothing
  if (isLoading) {
    return null;
  }

  // If no items are visible, don't render anything
  if (visibleNavItems.length === 0) {
    return null;
  }

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        {/* Desktop Navigation - Tabs */}
        <div className="hidden md:flex md:space-x-1">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "hover:text-foreground relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-barq-yellow text-barq-yellow"
                    : "text-muted-foreground hover:border-border border-transparent",
                )}
                aria-current={isActive ? "page" : undefined}
                title={item.description}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-1">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile Navigation - Dropdown/Buttons */}
        <div className="flex flex-col space-y-2 py-3 md:hidden">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Button
                key={item.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "justify-start",
                  isActive &&
                    "bg-barq-yellow/10 text-barq-yellow hover:bg-barq-yellow/20 hover:text-barq-yellow",
                )}
              >
                <Link href={item.href}>
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/**
 * Permission Guard Component
 * Wraps content that requires admin permissions
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: PermissionKey | PermissionKey[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permissions,
  fallback = null,
}: PermissionGuardProps) {
  const { hasAnyPermission } = usePermissions();
  const permissionsArray = Array.isArray(permissions)
    ? permissions
    : [permissions];
  const hasAccess = hasAnyPermission(permissionsArray);

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Admin Section Header Component
 * Provides consistent header styling for admin sections
 */
interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function AdminSectionHeader({
  title,
  description,
  actions,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 text-sm">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

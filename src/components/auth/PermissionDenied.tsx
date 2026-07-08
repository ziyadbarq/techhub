import { ShieldAlert, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PermissionDeniedProps {
  /**
   * The permission key that was required (e.g., "tasks:create")
   */
  requiredPermission?: string;

  /**
   * Additional description or context about why this permission is needed
   */
  description?: string;

  /**
   * Custom title (defaults to "Access Denied")
   */
  title?: string;

  /**
   * Whether to show a link back to the dashboard
   */
  showBackButton?: boolean;

  /**
   * Custom back button text
   */
  backButtonText?: string;

  /**
   * Custom back button URL
   */
  backButtonUrl?: string;
}

/**
 * Get human-readable description for common permissions
 */
function getPermissionDescription(permission?: string): string | null {
  if (!permission) return null;

  const descriptions: Record<string, string> = {
    // Dashboard & Analytics
    "dashboard:view": "Access the main dashboard and system overview",
    "dashboard:analytics": "View analytics, reports, and statistics",

    // Asset Management
    "assets:view": "View and browse asset information",
    "assets:create": "Create new assets in the system",
    "assets:update": "Edit existing asset information",
    "assets:delete": "Delete assets from the system",
    "assets:manage": "Full control over asset management",
    "assets:import": "Import assets from CSV/Excel files",
    "assets:export": "Export asset data to various formats",

    "asset-categories:view": "View asset categories and classifications",
    "asset-categories:create": "Create new asset categories",
    "asset-categories:update": "Edit asset category information",
    "asset-categories:delete": "Delete asset categories",
    "asset-categories:manage": "Full control over asset categories",

    "asset-models:view": "View asset models and specifications",
    "asset-models:create": "Create new asset models",
    "asset-models:update": "Edit asset model information",
    "asset-models:delete": "Delete asset models",

    "asset-assignments:view": "View asset assignments to persons",
    "asset-assignments:create": "Assign assets to persons",
    "asset-assignments:update": "Modify asset assignments",
    "asset-assignments:delete": "Remove asset assignments",
    "asset-assignments:return": "Process asset returns",

    // Asset Operations
    "asset-kits:view": "View predefined asset bundles and kits",
    "asset-kits:create": "Create new asset kits",
    "asset-kits:update": "Edit asset kit configurations",
    "asset-kits:delete": "Delete asset kits",
    "asset-kits:checkout": "Checkout asset kits to users",
    "asset-kits:return": "Process asset kit returns",
    "asset-kits:manage": "Full control over asset kit operations",

    "asset-reservations:view": "View asset reservations and availability",
    "asset-reservations:create": "Create new asset reservations",
    "asset-reservations:update": "Modify reservation details",
    "asset-reservations:delete": "Delete reservations",
    "asset-reservations:cancel": "Cancel active reservations",
    "asset-reservations:confirm": "Confirm pending reservations",
    "asset-reservations:manage": "Full control over reservation system",

    "asset-disposals:view": "View asset disposal records and workflows",
    "asset-disposals:create": "Initiate asset disposal processes",
    "asset-disposals:update": "Edit disposal information",
    "asset-disposals:delete": "Delete disposal records",
    "asset-disposals:approve": "Approve disposal requests",
    "asset-disposals:reject": "Reject disposal requests",
    "asset-disposals:start": "Start disposal execution",
    "asset-disposals:complete": "Complete disposal processes",
    "asset-disposals:cancel": "Cancel disposal workflows",
    "asset-disposals:manage": "Full control over disposal operations",

    // Warranties
    "warranties:view": "View warranty information and status",
    "warranties:create": "Create new warranty records",
    "warranties:update": "Edit warranty details",
    "warranties:delete": "Delete warranty records",
    "warranties:manage": "Full control over warranty management",

    // Inventory Management
    "stock-locations:view": "View warehouse and stock locations",
    "stock-locations:create": "Create new stock locations",
    "stock-locations:update": "Edit location information",
    "stock-locations:delete": "Delete stock locations",

    "stock-movements:view": "View inventory movement history",
    "stock-movements:create": "Record stock transfers and movements",
    "stock-movements:update": "Edit movement records",
    "stock-movements:delete": "Delete movement records",

    // Maintenance
    "maintenance-schedules:view": "View preventive maintenance schedules",
    "maintenance-schedules:create": "Create maintenance schedules",
    "maintenance-schedules:update": "Edit schedule configurations",
    "maintenance-schedules:delete": "Delete maintenance schedules",
    "maintenance-schedules:manage": "Full control over maintenance scheduling",

    "maintenance-records:view": "View maintenance history and work logs",
    "maintenance-records:create": "Create maintenance records",
    "maintenance-records:update": "Edit maintenance logs",
    "maintenance-records:delete": "Delete maintenance records",
    "maintenance-records:manage": "Full control over maintenance records",

    // CMDB
    "configuration-items:view": "View configuration items and their details",
    "configuration-items:create": "Create new configuration items",
    "configuration-items:update": "Edit CI information",
    "configuration-items:delete": "Delete configuration items",
    "configuration-items:manage": "Full control over CMDB",

    "ci-relationships:view": "View CI dependencies and relationships",
    "ci-relationships:create": "Create CI relationships",
    "ci-relationships:update": "Edit relationship details",
    "ci-relationships:delete": "Delete CI relationships",
    "ci-relationships:manage": "Full control over CI relationships",

    "relationship-types:view": "View relationship type definitions",
    "relationship-types:create": "Create custom relationship types",
    "relationship-types:update": "Edit relationship type configurations",
    "relationship-types:delete": "Delete relationship types",

    "ci-classes:view": "View CI class definitions",
    "ci-classes:create": "Create new CI classes",
    "ci-classes:update": "Edit CI class configurations",
    "ci-classes:delete": "Delete CI classes",

    // Service Management
    "services:view": "View IT services and application catalog",
    "services:create": "Create new service definitions",
    "services:update": "Edit service information",
    "services:delete": "Delete services",
    "services:manage": "Full control over service management",

    "business-processes:view": "View business processes linked to services",
    "business-processes:create": "Create business process definitions",
    "business-processes:update": "Edit business process information",
    "business-processes:delete": "Delete business processes",
    "business-processes:manage":
      "Full control over business process management",

    // Contracts
    "contract-types:view": "View contract type definitions",
    "contract-types:create": "Create custom contract types",
    "contract-types:update": "Edit contract type templates",
    "contract-types:delete": "Delete contract types",

    "contracts:view": "View vendor and service contracts",
    "contracts:create": "Create new contracts",
    "contracts:update": "Edit contract information",
    "contracts:delete": "Delete contracts",
    "contracts:manage": "Full control over contract management",

    // Licenses
    "license-products:view": "View software license products",
    "license-products:create": "Create license product definitions",
    "license-products:update": "Edit license product information",
    "license-products:delete": "Delete license products",

    "license-entitlements:view": "View purchased license entitlements",
    "license-entitlements:create": "Record new license purchases",
    "license-entitlements:update": "Edit entitlement details",
    "license-entitlements:delete": "Delete entitlements",

    "license-allocations:view": "View license allocations to users and assets",
    "license-allocations:create": "Allocate licenses",
    "license-allocations:update": "Edit allocation details",
    "license-allocations:delete": "Delete allocations",
    "license-allocations:deallocate": "Deallocate licenses from users",
    "license-allocations:reactivate": "Reactivate deallocated licenses",
    "license-allocations:manage": "Full control over license allocation",

    // Governance & Compliance
    "data-domains:view": "View data classification domains",
    "data-domains:create": "Create data domain definitions",
    "data-domains:update": "Edit domain classifications",
    "data-domains:delete": "Delete data domains",

    "data-ownerships:view": "View data ownership assignments",
    "data-ownerships:create": "Assign data ownership",
    "data-ownerships:update": "Edit ownership assignments",
    "data-ownerships:delete": "Remove ownership assignments",

    "verification-campaigns:view": "View compliance verification campaigns",
    "verification-campaigns:create": "Create verification campaigns",
    "verification-campaigns:update": "Edit campaign details",
    "verification-campaigns:delete": "Delete campaigns",
    "verification-campaigns:start": "Start verification campaigns",
    "verification-campaigns:complete": "Complete verification campaigns",
    "verification-campaigns:manage": "Full control over verification campaigns",

    "verification-items:view": "View verification checklist items",
    "verification-items:update": "Update verification status",
    "verification-items:verify": "Mark items as verified",
    "verification-items:flag-exception": "Flag exceptions in verification",

    // Attachments
    "attachment-types:view": "View attachment type configurations",
    "attachment-types:create": "Create attachment type definitions",
    "attachment-types:update": "Edit attachment type settings",
    "attachment-types:delete": "Delete attachment types",

    "attachments:view": "View attachments and documents",
    "attachments:create": "Upload new attachments",
    "attachments:update": "Edit attachment metadata",
    "attachments:delete": "Delete attachments",
    "attachments:download": "Download attachment files",

    // Foundation Layer
    "organization-units:view": "View organizational structure",
    "organization-units:create": "Create new organization units",
    "organization-units:update": "Edit organizational hierarchy",
    "organization-units:delete": "Delete organization units",

    "persons:view": "View person records and profiles",
    "persons:create": "Create new person records",
    "persons:update": "Edit person information",
    "persons:delete": "Delete person records",

    "locations:view": "View physical locations",
    "locations:create": "Create new locations",
    "locations:update": "Edit location information",
    "locations:delete": "Delete locations",

    "vendors:view": "View vendor information",
    "vendors:create": "Create new vendor records",
    "vendors:update": "Edit vendor details",
    "vendors:delete": "Delete vendors",

    "vendor-contacts:view": "View vendor contact information",
    "vendor-contacts:create": "Add vendor contacts",
    "vendor-contacts:update": "Edit contact details",
    "vendor-contacts:delete": "Delete vendor contacts",

    // Lifecycle Management
    "lifecycle-models:view": "View lifecycle model definitions",
    "lifecycle-models:create": "Create lifecycle models",
    "lifecycle-models:update": "Edit lifecycle configurations",
    "lifecycle-models:delete": "Delete lifecycle models",

    "lifecycle-states:view": "View lifecycle states",
    "lifecycle-states:create": "Create lifecycle states",
    "lifecycle-states:update": "Edit state definitions",
    "lifecycle-states:delete": "Delete lifecycle states",

    "lifecycle-transitions:view": "View state transition rules",
    "lifecycle-transitions:create": "Create state transitions",
    "lifecycle-transitions:update": "Edit transition rules",
    "lifecycle-transitions:delete": "Delete transitions",

    // Configuration
    "field-definitions:view": "View custom field definitions",
    "field-definitions:create": "Create custom fields",
    "field-definitions:update": "Edit field configurations",
    "field-definitions:delete": "Delete field definitions",

    "fx-rates:view": "View exchange rates for multi-currency support",
    "fx-rates:create": "Create exchange rate records",
    "fx-rates:update": "Update exchange rates",
    "fx-rates:delete": "Delete exchange rate records",
    "fx-rates:convert": "Convert currencies using exchange rates",
    "fx-rates:manage": "Full control over exchange rate management",

    // RBAC & Administration
    "users:view": "View user accounts and profiles",
    "users:create": "Create new user accounts",
    "users:update": "Edit user information",
    "users:delete": "Delete user accounts",
    "users:manage":
      "Full control over user management and system administration",

    "roles:view": "View roles and their permissions",
    "roles:create": "Create new roles",
    "roles:update": "Edit role definitions",
    "roles:delete": "Delete roles",
    "roles:manage": "Full control over role management",

    "permissions:view": "View permission definitions",
    "permissions:create": "Create custom permissions",
    "permissions:update": "Edit permission configurations",
    "permissions:delete": "Delete permissions",
    "permissions:manage": "Full control over permission system",

    "audit-logs:view": "View system audit logs and RBAC changes",
    "audit-logs:export": "Export audit logs for compliance reporting",

    // System Settings
    "settings:view": "View system settings and configuration",
    "settings:manage":
      "Manage system settings, platform configuration, and integrations",

    // Data Import
    "data-import:manage": "Access universal data importer for bulk operations",

    // Tasks (Reference)
    "tasks:view": "View task list and details",
    "tasks:create": "Create new tasks",
    "tasks:update": "Edit task information",
    "tasks:delete": "Delete tasks",
    "tasks:manage": "Full control over task management",
  };

  return descriptions[permission.toLowerCase()] || null;
}

/**
 * Reusable component for displaying permission denial messages
 * Used by unauthorized pages and PermissionGuard fallbacks
 */
export function PermissionDenied({
  requiredPermission,
  description,
  title = "Access Denied",
  showBackButton = true,
  backButtonText = "Return to Dashboard",
  backButtonUrl = "/dashboard",
}: PermissionDeniedProps) {
  const permissionDescription = getPermissionDescription(requiredPermission);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="max-w-lg space-y-6">
        {/* Icon and Title */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="bg-destructive/10 rounded-full p-4">
              <ShieldAlert className="text-destructive h-12 w-12" />
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-semibold">{title}</h2>
          <p className="text-muted-foreground">
            {description ||
              "You don't have the necessary permissions to access this resource."}
          </p>
        </div>

        {/* Required Permission */}
        {requiredPermission && (
          <Alert>
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Required Permission:</p>
                  <code className="bg-muted mt-1 block rounded px-2 py-1 font-mono text-sm">
                    {requiredPermission}
                  </code>
                </div>
                {permissionDescription && (
                  <p className="text-muted-foreground text-sm">
                    {permissionDescription}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Help Text and Actions */}
        <div className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              <strong>Need access?</strong> Contact your system administrator or
              team lead to request this permission. They can assign the
              appropriate role to your account.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {showBackButton && (
              <Button asChild className="flex-1">
                <Link href={backButtonUrl}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backButtonText}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" className="flex-1">
              <Link href="/docs/admin-guide">
                <HelpCircle className="mr-2 h-4 w-4" />
                View Permissions Guide
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

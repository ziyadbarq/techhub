import Link from "next/link";
import { Building2, MapPin, RefreshCw, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

const quickLinks = [
  { href: "/lifecycle-models", label: "Lifecycle Models" },
  { href: "/vendors", label: "Vendors" },
  { href: "/organization-units", label: "Organization Units" },
  { href: "/locations", label: "Locations" },
  { href: "/persons", label: "People" },
  { href: "/field-definitions", label: "Field Definitions" },
];

export default function HomePage() {
  return (
    <div className="from-background to-muted/30 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-14">
        {/* Hero */}
        <div className="mb-12 flex flex-col items-center text-center">
          <Logo width={200} height={60} priority />
          <h1 className="from-barq-yellow to-barq-light-blue mt-8 bg-gradient-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Keep asset and inventory data clean, connected, and auditable
          </h1>
          <p className="text-muted-foreground mt-4 max-w-3xl text-lg">
            Barq Assets gives operations, finance, and IT a single source of
            truth. Reliable records mean faster audits, smoother handoffs, and
            fewer service interruptions. This page shows how to keep the data
            healthy.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              <Link href="/lifecycle-models">Set up lifecycles</Link>
            </Button>
            <Button size="lg" variant="outline">
              <Link href="/vendors">Update vendors</Link>
            </Button>
          </div>
        </div>

        {/* What to maintain */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold">
            What matters for business value
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Accurate, linked records reduce loss, speed up procurement, and make
            audits painless. Focus on the core entities below—each one supports
            traceability and ownership.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <RefreshCw
                className="text-barq-yellow mb-2 h-10 w-10"
                strokeWidth={1.5}
              />
              <CardTitle>Lifecycle Models & States</CardTitle>
              <CardDescription>Control how assets move</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Define allowed steps (e.g., Received → In Use → Maintenance →
                Retired) so every asset follows a predictable path. Clean
                lifecycle data prevents stranded or “ghost” assets.
              </p>
              <div className="flex gap-2 text-xs">
                <Link href="/lifecycle-models" className="underline">
                  Models
                </Link>
                <span>•</span>
                <Link href="/lifecycle-states" className="underline">
                  States
                </Link>
                <span>•</span>
                <Link href="/lifecycle-transitions" className="underline">
                  Transitions
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building2
                className="text-barq-yellow mb-2 h-10 w-10"
                strokeWidth={1.5}
              />
              <CardTitle>Vendors & Contacts</CardTitle>
              <CardDescription>Who to call, how to renew</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Keep vendor records current to avoid downtime and payment
                delays. Link contacts so service requests and renewals go to the
                right people.
              </p>
              <div className="flex gap-2 text-xs">
                <Link href="/vendors" className="underline">
                  Vendors
                </Link>
                <span>•</span>
                <Link href="/vendor-contacts" className="underline">
                  Contacts
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin
                className="text-barq-yellow mb-2 h-10 w-10"
                strokeWidth={1.5}
              />
              <CardTitle>Organization & Locations</CardTitle>
              <CardDescription>Ownership and where things live</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Map assets to org units and locations. Clear ownership speeds
                approvals and helps audits reconcile stock to physical sites.
              </p>
              <div className="flex gap-2 text-xs">
                <Link href="/organization-units" className="underline">
                  Organization Units
                </Link>
                <span>•</span>
                <Link href="/locations" className="underline">
                  Locations
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users
                className="text-barq-yellow mb-2 h-10 w-10"
                strokeWidth={1.5}
              />
              <CardTitle>People & Role Assignments</CardTitle>
              <CardDescription>Accountability and access</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Tie assets to real people. Keep managers, custodians, and
                requestors accurate to make lifecycle decisions auditable.
              </p>
              <div className="flex gap-2 text-xs">
                <Link href="/persons" className="underline">
                  Persons
                </Link>
                <span>•</span>
                <Link href="/person-role-assignments" className="underline">
                  Role Assignments
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings
                className="text-barq-yellow mb-2 h-10 w-10"
                strokeWidth={1.5}
              />
              <CardTitle>Field Definitions</CardTitle>
              <CardDescription>Capture what matters</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-3 text-sm">
              <p>
                Configure the custom fields teams need (serials, warranty end,
                rack position). Good structure keeps forms consistent and
                reports reliable.
              </p>
              <div className="flex gap-2 text-xs">
                <Link href="/field-definitions" className="underline">
                  Manage fields
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Tasks & Checks Card - DEMO REFERENCE
            Maintained as example of actionable guidance patterns for dashboard pages.
            Hidden from production UI - similar to Task entity architectural reference pattern.
            See CLAUDE.md "Task Entity - Architectural Reference" for context.

          <Card>
            <CardHeader>
              <CardTitle>Tasks & Checks</CardTitle>
              <CardDescription>Keep the data healthy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Daily</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Close out received assets by moving them from "Received" to their in-use state.</li>
                <li>Attach responsible person and location to any new record.</li>
              </ul>
              <p className="font-medium text-foreground pt-2">Weekly</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Check vendors and contacts for expired contracts or wrong emails.</li>
                <li>Review lifecycle transitions that failed or stalled.</li>
              </ul>
            </CardContent>
          </Card>
          */}
        </div>

        {/* Quick links */}
        <div className="border-border mt-12 border-t pt-8">
          <h3 className="text-lg font-semibold">Jump to a section</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:border-barq-yellow hover:bg-barq-yellow/10 hover:text-foreground rounded-md border p-3 text-sm font-medium transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

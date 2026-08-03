import Link from "next/link";

import { Card } from "@/components/design";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

const SECTIONS: ReadonlyArray<{
  href: string;
  title: string;
  body: string;
  tone:
    | "yellow"
    | "rose"
    | "coral"
    | "teal"
    | "orange"
    | "lavender"
    | "lemon"
    | "blush"
    | "sky"
    | "mint"
    | "sand"
    | "lilac";
}> = [
  {
    href: "/workflows/admin/forms",
    title: "Forms",
    body: "Build form definitions, configure fields, draft and publish versions.",
    tone: "yellow",
  },
  {
    href: "/workflows/admin/workflows",
    title: "Workflows",
    body: "Define the steps, routing, and assignment for each form.",
    tone: "rose",
  },
  {
    href: "/workflows/admin/hold-reasons",
    title: "Hold reasons",
    body: "Reasons that can pause an in-flight request.",
    tone: "coral",
  },
  {
    href: "/workflows/admin/rejection-policies",
    title: "Rejection policies",
    body: "What happens when a request is rejected — full restart or resume.",
    tone: "mint",
  },
  {
    href: "/workflows/admin/outcome-codes",
    title: "Outcome codes",
    body: "Domain-specific outcome labels (e.g., ROLLED_BACK, DEFERRED).",
    tone: "lavender",
  },
  {
    href: "/workflows/admin/calendars",
    title: "Business calendars",
    body: "Working hours and holidays used by SLA computations.",
    tone: "orange",
  },
  {
    href: "/workflows/admin/maintenance-windows",
    title: "Maintenance windows",
    body: "Recurring time ranges for Schedule steps.",
    tone: "sky",
  },
  {
    href: "/workflows/admin/blackout-periods",
    title: "Blackout periods",
    body: "Date ranges where Schedule steps must BLOCK / WARN / IGNORE.",
    tone: "lemon",
  },
  {
    href: "/workflows/admin/email-templates",
    title: "Email templates",
    body: "Subject and HTML body used by the notification dispatcher.",
    tone: "blush",
  },
  {
    href: "/workflows/admin/delegations",
    title: "Delegations",
    body: "Out-of-office routing — assignments redirect to the delegate.",
    tone: "teal",
  },
  {
    href: "/workflows/admin/watcher-subscriptions",
    title: "Watcher subscriptions",
    body: "Auto-watch every request from a form for everyone in a role.",
    tone: "lilac",
  },
  {
    href: "/workflows/admin/users",
    title: "Users",
    body: "Members of this organisation, their roles, and current activity.",
    tone: "sand",
  },
];

export default async function AdminOverviewPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="text-micro-uppercase text-stone">Admin</span>
        <h1 className="text-h1">Configure the engine.</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Define the building blocks every team in your organization will use to
          submit, route, and resolve requests.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card tone={s.tone} size="feature" className="h-full">
              <div className="flex h-full flex-col">
                <h2 className="text-h3">{s.title}</h2>
                <p className="text-body-md text-charcoal/80 mt-3">{s.body}</p>
                <span className="text-body-sm-medium text-ink mt-auto pt-6">
                  Open →
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

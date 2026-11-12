import Link from "next/link";

import {
  CalendarDays,
  CalendarOff,
  ChevronRight,
  Eye,
  FileText,
  KeyRound,
  Mail,
  PauseCircle,
  Tags,
  Undo2,
  UserRoundCog,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_FLAGS } from "@/lib/features/feature-flag-keys";
import { requireFeature } from "@/lib/features/server";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { requirePermission } from "@/lib/permissions/server";

export const dynamic = "force-dynamic";

interface Section {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
}

// Grouped the way admins think about the engine, each with an icon, like
// TechHub's other settings hubs.
const GROUPS: ReadonlyArray<{ title: string; sections: Section[] }> = [
  {
    title: "Build",
    sections: [
      {
        href: "/workflows/admin/forms",
        title: "Forms",
        body: "Build form definitions, configure fields, draft and publish versions.",
        icon: FileText,
      },
      {
        href: "/workflows/designer",
        title: "Workflows",
        body: "Define the steps, routing, and assignment for each form.",
        icon: Workflow,
      },
      {
        href: "/workflows/admin/access-services",
        title: "Access services",
        body: "The IT access service catalog used in workflow forms.",
        icon: KeyRound,
      },
    ],
  },
  {
    title: "Request rules",
    sections: [
      {
        href: "/workflows/admin/hold-reasons",
        title: "Hold reasons",
        body: "Reasons that can pause an in-flight request.",
        icon: PauseCircle,
      },
      {
        href: "/workflows/admin/rejection-policies",
        title: "Rejection policies",
        body: "What happens when a request is rejected: full restart or resume.",
        icon: Undo2,
      },
      {
        href: "/workflows/admin/outcome-codes",
        title: "Outcome codes",
        body: "Outcome labels attached when closing a request (e.g. rolled back, deferred).",
        icon: Tags,
      },
    ],
  },
  {
    title: "Scheduling",
    sections: [
      {
        href: "/workflows/admin/calendars",
        title: "Business calendars",
        body: "Working hours and holidays used by SLA computations.",
        icon: CalendarDays,
      },
      {
        href: "/workflows/admin/maintenance-windows",
        title: "Maintenance windows",
        body: "Recurring time ranges for Schedule steps.",
        icon: Wrench,
      },
      {
        href: "/workflows/admin/blackout-periods",
        title: "Blackout periods",
        body: "Date ranges where Schedule steps must block, warn or ignore.",
        icon: CalendarOff,
      },
    ],
  },
  {
    title: "People & notifications",
    sections: [
      {
        href: "/workflows/admin/users",
        title: "Users",
        body: "Members of this organisation, their roles, and current activity.",
        icon: Users,
      },
      {
        href: "/workflows/admin/delegations",
        title: "Delegations",
        body: "Out-of-office routing: assignments redirect to the delegate.",
        icon: UserRoundCog,
      },
      {
        href: "/workflows/admin/watcher-subscriptions",
        title: "Watcher subscriptions",
        body: "Auto-watch every request from a form for everyone in a role.",
        icon: Eye,
      },
      {
        href: "/workflows/admin/email-templates",
        title: "Email templates",
        body: "Subject and HTML body used by the notification dispatcher.",
        icon: Mail,
      },
    ],
  },
];

export default async function AdminOverviewPage() {
  await requireFeature(FEATURE_FLAGS.WORKFLOW_ENGINE);
  await requirePermission(PERMISSIONS.WORKFLOWS_FORMS_VIEW);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-h1">Workflow Admin</h1>
        <p className="text-subtitle text-slate max-w-2xl">
          Forms, workflows and the settings every request is routed by.
        </p>
      </header>

      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium">
            {group.title}
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group bg-card hover:bg-muted/40 flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-colors"
                >
                  <div className="bg-muted text-foreground grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{section.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {section.body}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

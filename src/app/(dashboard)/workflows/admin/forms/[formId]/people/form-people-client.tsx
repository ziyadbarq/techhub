"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, Card } from "@/components/design";
import {
  PeoplePicker,
  type PersonOption,
} from "@/components/workflows/people-picker";
import type { FormMemberRole } from "@/core/domain/workflow";

const ROLES: Array<{
  role: FormMemberRole;
  title: string;
  description: string;
}> = [
  {
    role: "OWNER",
    title: "Form owners",
    description:
      "Can move any request forward: approve, reject or complete the active step without waiting for its assignee. The request's history shows the decision was made by the owner.",
  },
  {
    role: "MANAGER",
    title: "Form managers",
    description:
      "Can correct the values in a submitted request when the requester entered something wrong. Every correction is kept in the request's history with the previous value.",
  },
  {
    role: "VIEWER",
    title: "Form viewers",
    description:
      "Can open every request of this form and follow where it is. They find them under Requests → My forms.",
  },
];

function toMember(person: PersonOption, role: FormMemberRole) {
  return person.userId
    ? { role, userId: person.userId }
    : { role, personId: person.personId ?? undefined };
}

export function FormPeopleClient({
  formId,
  people,
  initial,
}: {
  formId: string;
  people: PersonOption[];
  initial: Record<FormMemberRole, PersonOption[]>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(selected) !== JSON.stringify(initial);

  async function save() {
    setSaving(true);
    try {
      const members = ROLES.flatMap(({ role }) =>
        selected[role].map((p) => toMember(p, role)),
      );
      const res = await fetch(`/api/workflow/admin/forms/${formId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        notAdded?: string[];
      };
      if (!res.ok) throw new Error(body.error ?? `Failed (${res.status})`);
      if (body.notAdded && body.notAdded.length > 0) {
        toast.warning(
          `Saved. ${body.notAdded.length} person(s) couldn't be added — they're inactive in Active Directory.`,
        );
      } else {
        toast.success("People saved");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {ROLES.map(({ role, title, description }) => (
        <Card key={role}>
          <h2 className="text-h4">{title}</h2>
          <p className="text-body-sm text-stone mt-1 max-w-2xl">
            {description}
          </p>
          <div className="mt-4">
            <PeoplePicker
              label="People"
              allUsers={people}
              selected={selected[role]}
              onChange={(next) =>
                setSelected((prev) => ({ ...prev, [role]: next }))
              }
            />
          </div>
        </Card>
      ))}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          onClick={() => void save()}
          disabled={saving || !dirty}
        >
          {saving ? "Saving…" : "Save people"}
        </Button>
        {dirty ? (
          <span className="text-caption text-stone">Unsaved changes</span>
        ) : null}
      </div>
    </div>
  );
}

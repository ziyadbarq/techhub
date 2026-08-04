"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  confirm,
  FieldLabel,
  Select,
  TextArea,
  TextInput,
} from "@/components/design";

const GENERIC_OUTCOMES = [
  "SUCCESSFUL",
  "SUCCESSFUL_WITH_ISSUES",
  "UNSUCCESSFUL",
  "WITHDRAWN",
  "REJECTED",
  "SUPERSEDED",
  "ABANDONED",
  "EXPIRED",
] as const;

interface FormRef {
  id: string;
  name: string;
}
interface Code {
  id: string;
  key: string;
  label: string;
  description: string | null;
  genericOutcome: string;
  isActive: boolean;
  form: FormRef | null;
}

export function OutcomeCodesClient({
  initial,
  forms,
}: {
  initial: Code[];
  forms: FormRef[];
}) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [genericOutcome, setGenericOutcome] =
    useState<(typeof GENERIC_OUTCOMES)[number]>("UNSUCCESSFUL");
  const [formId, setFormId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/workflow/admin/outcome-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          label,
          description: description || undefined,
          genericOutcome,
          formId: formId || undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.error || "Failed");
      }
      const body = (await response.json()) as { code: Code };
      setList([...list, body.code]);
      setKey("");
      setLabel("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate(id: string) {
    if (
      !(await confirm({
        title: "Deactivate outcome code?",
        message:
          "It won't appear as a choice on new closures, but historical entries keep their reference.",
        confirmLabel: "Deactivate",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/workflow/admin/outcome-codes/${id}`, {
      method: "DELETE",
    });
    setList(list.map((c) => (c.id === id ? { ...c, isActive: false } : c)));
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-h5">Add outcome code</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <FieldLabel>Key</FieldLabel>
            <TextInput
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="ROLLED_BACK"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Label</FieldLabel>
            <TextInput
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Rolled back"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel
              required
              helper="The canonical generic outcome this maps to (used for cross-module reporting)."
            >
              Generic outcome
            </FieldLabel>
            <Select
              value={genericOutcome}
              onChange={(e) =>
                setGenericOutcome(e.target.value as typeof genericOutcome)
              }
            >
              {GENERIC_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel helper="Leave blank to make this code available for all forms in the org.">
              Form scope (optional)
            </FieldLabel>
            <Select value={formId} onChange={(e) => setFormId(e.target.value)}>
              <option value="">All forms</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {error ? (
          <p className="text-body-sm mt-3 text-[var(--color-coral-dark)]">
            {error}
          </p>
        ) : null}
        <div className="mt-4">
          <Button
            onClick={add}
            disabled={!key || !label || busy}
            variant="primary"
          >
            {busy ? "Adding…" : "Add code"}
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)]">
              <tr className="text-micro-uppercase text-stone">
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Generic outcome</th>
                <th className="px-5 py-3">Form scope</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--color-hairline-soft)] last:border-0"
                >
                  <td className="text-caption text-charcoal px-5 py-3 font-mono">
                    {c.key}
                  </td>
                  <td className="text-body-sm-medium text-ink px-5 py-3">
                    {c.label}
                  </td>
                  <td className="text-caption text-slate px-5 py-3 font-mono">
                    {c.genericOutcome}
                  </td>
                  <td className="text-body-sm text-slate px-5 py-3">
                    {c.form?.name ?? "All forms"}
                  </td>
                  <td className="px-5 py-3">
                    {c.isActive ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {c.isActive ? (
                      <button
                        onClick={() => deactivate(c.id)}
                        className="text-body-sm-medium text-[var(--color-coral-dark)] hover:underline"
                      >
                        Deactivate
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-body-md text-stone px-5 py-12 text-center"
                  >
                    No outcome codes yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

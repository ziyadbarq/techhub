"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AccessServiceData } from "@/core/repositories/workflow/access-service.repository.interface";
import type { AccessServiceRole } from "@/generated/prisma";
import {
  createAccessServiceAction,
  updateAccessServiceAction,
  toggleAccessServiceStatusAction,
  importAccessServicesAction,
} from "@/interface-adapters/controllers/access-service.controller";

interface Props {
  initialServices: AccessServiceData[];
}

const ROLE_LABELS: Record<AccessServiceRole, string> = {
  OWNER: "Owner",
  CYBERSECURITY: "Cybersecurity",
  IMPLEMENTER: "Implementer",
};

function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function AccessServicesClient({ initialServices }: Props) {
  const [services, setServices] =
    useState<AccessServiceData[]>(initialServices);
  const [editingService, setEditingService] =
    useState<AccessServiceData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [requireManagerApproval, setRequireManagerApproval] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [ownerEmails, setOwnerEmails] = useState("");
  const [cyberEmails, setCyberEmails] = useState("");
  const [implEmails, setImplEmails] = useState("");

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<{
    errors: Array<{ row: number; message: string }>;
    importedCount: number;
    contentHash?: string;
  } | null>(null);
  const [importPending, startImportTransition] = useTransition();

  function openCreate() {
    setEditingService(null);
    setName("");
    setSlug("");
    setDescription("");
    setRequireManagerApproval(false);
    setInstructions("");
    setOwnerEmails("");
    setCyberEmails("");
    setImplEmails("");
    setShowForm(true);
  }

  function openEdit(svc: AccessServiceData) {
    setEditingService(svc);
    setName(svc.name);
    setSlug(svc.slug);
    setDescription(svc.description ?? "");
    setRequireManagerApproval(svc.requireManagerApproval);
    setInstructions(svc.instructions ?? "");
    const byRole = (role: AccessServiceRole) =>
      (svc.assignees ?? [])
        .filter((a) => a.role === role)
        .map((a) => a.userEmail)
        .join(";");
    setOwnerEmails(byRole("OWNER"));
    setCyberEmails(byRole("CYBERSECURITY"));
    setImplEmails(byRole("IMPLEMENTER"));
    setShowForm(true);
  }

  function buildEmailAssignees(emails: string, role: AccessServiceRole) {
    return emails
      .split(";")
      .map((e) => e.trim())
      .filter(Boolean)
      .map((email) => ({ email, role })); // email resolved to userId server-side
  }

  function handleSave() {
    startTransition(async () => {
      const assignees = [
        ...buildEmailAssignees(ownerEmails, "OWNER"),
        ...buildEmailAssignees(cyberEmails, "CYBERSECURITY"),
        ...buildEmailAssignees(implEmails, "IMPLEMENTER"),
      ];

      const result = editingService
        ? await updateAccessServiceAction(editingService.id, {
            name,
            slug,
            description: description || null,
            requireManagerApproval,
            instructions: instructions || null,
            assignees,
          })
        : await createAccessServiceAction({
            name,
            slug,
            description: description || null,
            requireManagerApproval,
            instructions: instructions || null,
            assignees,
          });

      if (result.success && result.data) {
        setServices((prev) =>
          editingService
            ? prev.map((s) => (s.id === editingService.id ? result.data! : s))
            : [...prev, result.data!],
        );
        toast.success(editingService ? "Service updated" : "Service created");
        setShowForm(false);
      } else {
        toast.error(
          (result as { success: false; error: string }).error ??
            "An error occurred",
        );
      }
    });
  }

  function handleToggleStatus(svc: AccessServiceData) {
    startTransition(async () => {
      const result = await toggleAccessServiceStatusAction(
        svc.id,
        !svc.isActive,
      );
      if (result.success && result.data) {
        setServices((prev) =>
          prev.map((s) => (s.id === svc.id ? result.data! : s)),
        );
        toast.success(
          result.data.isActive ? "Service activated" : "Service deactivated",
        );
      } else {
        toast.error("Failed to update status");
      }
    });
  }

  function handleDryRun() {
    if (!importFile) return;
    startImportTransition(async () => {
      const fd = new FormData();
      fd.append("file", importFile);
      const result = await importAccessServicesAction(fd, { dryRun: true });
      if (result.success && result.data) {
        setDryRunResult(result.data);
        if (result.data.errors.length === 0) {
          toast.success(
            `Dry run passed — ${result.data.importedCount} rows ready to import`,
          );
        } else {
          toast.error(`Dry run found ${result.data.errors.length} error(s)`);
        }
      } else {
        toast.error("Dry run failed");
      }
    });
  }

  function handleConfirmImport() {
    if (!importFile || !dryRunResult?.contentHash) return;
    startImportTransition(async () => {
      const fd = new FormData();
      fd.append("file", importFile);
      const result = await importAccessServicesAction(fd, {
        dryRun: false,
        confirmedHash: dryRunResult.contentHash,
      });
      if (result.success && result.data) {
        toast.success(`Imported ${result.data.importedCount} services`);
        setDryRunResult(null);
        setImportFile(null);
        // Refresh the list
        window.location.reload();
      } else {
        toast.error("Import failed");
      }
    });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Access Services</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage the IT access service catalog used in workflow forms.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/workflow/admin/access-services/template"
            download
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
          >
            Download Template
          </a>
          <a
            href="/api/workflow/admin/access-services/export"
            download
            className="inline-flex items-center rounded-md border px-3 py-2 text-sm"
          >
            Export CSV
          </a>
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground inline-flex items-center rounded-md px-3 py-2 text-sm"
          >
            Add Service
          </button>
        </div>
      </div>

      {/* CSV Import */}
      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Bulk Import (CSV)</h2>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setImportFile(e.target.files?.[0] ?? null);
              setDryRunResult(null);
            }}
            className="text-sm"
          />
          <button
            onClick={handleDryRun}
            disabled={!importFile || importPending}
            className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Validate
          </button>
          {dryRunResult && dryRunResult.errors.length === 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={importPending}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Confirm Import ({dryRunResult.importedCount} rows)
            </button>
          )}
        </div>
        {dryRunResult && dryRunResult.errors.length > 0 && (
          <ul className="text-destructive space-y-1 text-sm">
            {dryRunResult.errors.map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Service Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">
                Manager Approval
              </th>
              <th className="px-4 py-3 text-left font-medium">Roles</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted-foreground px-4 py-8 text-center"
                >
                  No access services yet. Add one or import from CSV.
                </td>
              </tr>
            )}
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{svc.name}</td>
                <td className="text-muted-foreground px-4 py-3 font-mono text-xs">
                  {svc.slug}
                </td>
                <td className="px-4 py-3">
                  <Badge active={svc.isActive} />
                </td>
                <td className="px-4 py-3">
                  {svc.requireManagerApproval ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-xs">
                    {(
                      [
                        "OWNER",
                        "CYBERSECURITY",
                        "IMPLEMENTER",
                      ] as AccessServiceRole[]
                    )
                      .map(
                        (role) =>
                          `${ROLE_LABELS[role]}: ${(svc.assignees ?? []).filter((a) => a.role === role).length}`,
                      )
                      .join(" | ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(svc)}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(svc)}
                      disabled={isPending}
                      className="rounded border px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {svc.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side sheet backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${showForm ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowForm(false)}
      />

      {/* Side sheet panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-(--color-surface) shadow-2xl transition-transform duration-300 ease-in-out ${showForm ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">
            {editingService ? "Edit Service" : "Create Service"}
          </h2>
          <button
            onClick={() => setShowForm(false)}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingService) {
                  setSlug(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  );
                }
              }}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Slug *</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="req-mgr"
              checked={requireManagerApproval}
              onChange={(e) => setRequireManagerApproval(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="req-mgr" className="text-sm">
              Requires manager approval
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Owner emails{" "}
              <span className="text-muted-foreground text-xs">
                (semicolon-separated)
              </span>
            </label>
            <input
              value={ownerEmails}
              onChange={(e) => setOwnerEmails(e.target.value)}
              placeholder="owner@example.com;owner2@example.com"
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cybersecurity emails</label>
            <input
              value={cyberEmails}
              onChange={(e) => setCyberEmails(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Implementer emails</label>
            <input
              value={implEmails}
              onChange={(e) => setImplEmails(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Saving with empty role columns is allowed — assignees can be added
            later.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={() => setShowForm(false)}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !name || !slug}
            className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

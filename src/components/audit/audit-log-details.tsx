/**
 * Audit Log Details Component
 *
 * Displays detailed information about an audit log entry:
 * - Before/after changes with JSON diff visualization
 * - Metadata display
 * - Pretty-printed JSON
 * - Highlighted differences
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditLogDTO } from "@/interface-adapters/presenters/audit-log.presenter";

interface AuditLogDetailsProps {
  log: AuditLogDTO;
}

export function AuditLogDetails({ log }: AuditLogDetailsProps) {
  return (
    <div className="space-y-4 p-4">
      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {log.ipAddress && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-24 text-sm font-medium">
                IP Address:
              </span>
              <span className="text-sm">{log.ipAddress}</span>
            </div>
          )}
          {log.userAgent && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-24 text-sm font-medium">
                User Agent:
              </span>
              <span className="text-sm">{log.userAgent}</span>
            </div>
          )}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-24 text-sm font-medium">
                Extra Data:
              </span>
              <pre className="bg-muted flex-1 overflow-x-auto rounded p-2 text-xs">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Changes Section */}
      {log.changes && Object.keys(log.changes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <JSONDiffViewer changes={log.changes} />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!log.changes || Object.keys(log.changes).length === 0) &&
        (!log.metadata || Object.keys(log.metadata).length === 0) &&
        !log.ipAddress &&
        !log.userAgent && (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No additional details available for this audit log entry.
          </div>
        )}
    </div>
  );
}

/**
 * JSON Diff Viewer Component
 *
 * Displays before/after changes with visual diff highlighting
 */
function JSONDiffViewer({ changes }: { changes: Record<string, unknown> }) {
  // Check if changes has before/after structure
  const hasBeforeAfter =
    typeof changes === "object" &&
    changes !== null &&
    ("before" in changes || "after" in changes);

  if (hasBeforeAfter) {
    const before = (changes as { before?: unknown }).before;
    const after = (changes as { after?: unknown }).after;

    return (
      <div className="space-y-4">
        {before !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-destructive/10">
                Before
              </Badge>
            </div>
            <pre className="bg-muted overflow-x-auto rounded border p-3 text-xs">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
        )}
        {after !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-success/10">
                After
              </Badge>
            </div>
            <pre className="bg-muted overflow-x-auto rounded border p-3 text-xs">
              {JSON.stringify(after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // If not before/after structure, show field-by-field changes
  const changeEntries = Object.entries(changes);

  if (changeEntries.length === 0) {
    return (
      <div className="text-muted-foreground text-center text-sm">
        No changes recorded
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {changeEntries.map(([field, value]) => {
        // Check if value has before/after structure
        const isFieldChange =
          typeof value === "object" &&
          value !== null &&
          ("before" in value || "after" in value);

        if (isFieldChange) {
          const fieldChange = value as { before?: unknown; after?: unknown };
          return (
            <div key={field} className="space-y-2">
              <div className="text-sm font-medium">{field}</div>
              <div className="grid gap-2 md:grid-cols-2">
                {fieldChange.before !== undefined && (
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="bg-destructive/10 text-destructive"
                    >
                      Before
                    </Badge>
                    <pre className="bg-muted overflow-x-auto rounded border p-2 text-xs">
                      {typeof fieldChange.before === "string"
                        ? fieldChange.before
                        : JSON.stringify(fieldChange.before, null, 2)}
                    </pre>
                  </div>
                )}
                {fieldChange.after !== undefined && (
                  <div className="space-y-1">
                    <Badge
                      variant="outline"
                      className="bg-success/10 text-success"
                    >
                      After
                    </Badge>
                    <pre className="bg-muted overflow-x-auto rounded border p-2 text-xs">
                      {typeof fieldChange.after === "string"
                        ? fieldChange.after
                        : JSON.stringify(fieldChange.after, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Simple value change
        return (
          <div key={field} className="space-y-1">
            <div className="text-sm font-medium">{field}</div>
            <pre className="bg-muted overflow-x-auto rounded border p-2 text-xs">
              {typeof value === "string"
                ? value
                : JSON.stringify(value, null, 2)}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

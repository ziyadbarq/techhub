"use client";

import { useEffect, useRef, useState } from "react";

import { Button, Card, TextArea } from "@/components/design";

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface AttachmentRef {
  id: string;
  filename: string;
  contentType: string;
  byteSize: number;
}

interface Comment {
  id: string;
  body: string;
  author: User;
  attachments: AttachmentRef[];
  createdAt: string;
}

interface AttachmentRow extends AttachmentRef {
  uploadedBy: User;
  fieldKey: string | null;
  commentId: string | null;
  createdAt: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function CommentThread({ requestId }: { requestId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    const [commentsRes, attRes] = await Promise.all([
      fetch(`/api/workflow/requests/${requestId}/comments`),
      fetch(`/api/workflow/requests/${requestId}/attachments`),
    ]);
    if (commentsRes.ok) {
      const body = (await commentsRes.json()) as { comments: Comment[] };
      setComments(body.comments);
    }
    if (attRes.ok) {
      const body = (await attRes.json()) as { attachments: AttachmentRow[] };
      setAttachments(body.attachments);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  async function postComment() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/workflow/requests/${requestId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: body.trim() }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed");
      }
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const response = await fetch(
        `/api/workflow/requests/${requestId}/attachments`,
        {
          method: "POST",
          body: fd,
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Upload failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h4">Discussion & files</h2>
        <span className="text-caption text-stone">
          {comments?.length ?? 0} comment(s) · {attachments.length} file(s)
        </span>
      </div>

      {/* New comment composer */}
      <div className="mt-4 space-y-3">
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Add a comment, ask a question, share context…"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              Attach file
            </Button>
          </div>
          <Button
            onClick={postComment}
            disabled={!body.trim() || busy}
            variant="primary"
            size="sm"
          >
            {busy ? "Posting…" : "Post comment"}
          </Button>
        </div>
        {error ? (
          <p className="text-body-sm text-[var(--color-coral-dark)]">{error}</p>
        ) : null}
      </div>

      {/* Attachments list (request-level: not tied to a specific comment) */}
      {attachments.filter((a) => !a.commentId).length > 0 ? (
        <div className="mt-6">
          <p className="text-micro-uppercase text-stone">
            Files on this request
          </p>
          <ul className="mt-2 space-y-1">
            {attachments
              .filter((a) => !a.commentId)
              .map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-[var(--color-hairline-soft)] bg-[var(--color-surface-soft)] px-3 py-2"
                >
                  <a
                    href={`/api/workflow/attachments/${a.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-body-sm-medium text-[var(--color-brand-blue)] hover:underline"
                  >
                    {a.filename}
                  </a>
                  <span className="text-caption text-stone">
                    {formatBytes(a.byteSize)} ·{" "}
                    {a.uploadedBy.name || a.uploadedBy.email} ·{" "}
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      {/* Comment thread */}
      <div className="mt-6 space-y-4">
        {comments === null ? (
          <p className="text-body-sm text-stone">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-body-sm text-stone">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              className="rounded-md border border-[var(--color-hairline-soft)] bg-canvas p-4"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-body-sm-medium text-ink">
                  {c.author.name || c.author.email}
                </p>
                <span className="text-caption text-stone">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-body-md text-charcoal">
                {c.body}
              </p>
              {c.attachments.length > 0 ? (
                <ul className="mt-3 space-y-1">
                  {c.attachments.map((a) => (
                    <li key={a.id} className="text-caption">
                      <a
                        href={`/api/workflow/attachments/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--color-brand-blue)] hover:underline"
                      >
                        {a.filename}
                      </a>{" "}
                      <span className="text-stone">
                        ({formatBytes(a.byteSize)})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

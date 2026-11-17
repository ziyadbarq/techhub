import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

vi.mock("server-only", () => ({}));

import { checkAttachmentUpload, safeFileName } from "../upload-check";
import { fileFieldIds } from "@/core/domain/workflow/file-field";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000",
  "hex",
);
const xlsx = () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["a"]]), "S");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
};

describe("checkAttachmentUpload", () => {
  it("accepts files whose content matches their extension", async () => {
    await expect(
      checkAttachmentUpload({ name: "contract.pdf", bytes: PDF }),
    ).resolves.toMatchObject({ ok: true, contentType: "application/pdf" });
    await expect(
      checkAttachmentUpload({ name: "screen.PNG", bytes: PNG }),
    ).resolves.toMatchObject({ ok: true, contentType: "image/png" });
    await expect(
      checkAttachmentUpload({ name: "list.xlsx", bytes: xlsx() }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      checkAttachmentUpload({
        name: "notes.txt",
        bytes: Buffer.from("plain text"),
      }),
    ).resolves.toMatchObject({ ok: true, contentType: "text/plain" });
  });

  it("refuses disguised, unknown, empty or binary-as-text files", async () => {
    const html = Buffer.from("<html><script>alert(1)</script></html>");
    expect(
      await checkAttachmentUpload({ name: "invoice.pdf", bytes: html }),
    ).toMatchObject({ ok: false, error: "FILE_CONTENT_MISMATCH" });
    expect(
      await checkAttachmentUpload({ name: "page.html", bytes: html }),
    ).toMatchObject({ ok: false, error: "FILE_TYPE_NOT_ALLOWED" });
    expect(
      await checkAttachmentUpload({ name: "logo.svg", bytes: html }),
    ).toMatchObject({ ok: false, error: "FILE_TYPE_NOT_ALLOWED" });
    expect(
      await checkAttachmentUpload({ name: "tool.exe", bytes: PDF }),
    ).toMatchObject({ ok: false, error: "FILE_TYPE_NOT_ALLOWED" });
    expect(
      await checkAttachmentUpload({ name: "a.txt", bytes: Buffer.alloc(0) }),
    ).toMatchObject({ ok: false, error: "EMPTY_FILE" });
    expect(
      await checkAttachmentUpload({ name: "image.txt", bytes: PNG }),
    ).toMatchObject({ ok: false, error: "FILE_CONTENT_MISMATCH" });
  });

  it("keeps file names harmless", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName('C:\\temp\\"evil"<x>.pdf')).toBe("evilx.pdf");
    expect(safeFileName("\u0000\u0007")).toBe("attachment");
  });
});

describe("fileFieldIds", () => {
  it("reads ids from file items or bare ids, ignoring junk", () => {
    expect(
      fileFieldIds([{ id: "a", name: "x", size: 1 }, "b", null, 5, {}]),
    ).toEqual(["a", "b"]);
    expect(fileFieldIds("not-a-list")).toEqual([]);
  });
});

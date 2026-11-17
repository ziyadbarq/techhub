import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUserId: vi.fn() }));
vi.mock("@/lib/permissions/server", () => ({ hasPermission: vi.fn() }));
vi.mock("@/lib/features/server", () => ({ isFeatureEnabled: vi.fn() }));
vi.mock("@/infrastructure/database/prisma/client", () => ({ prisma: {} }));
const gcs = {
  uploadFile: vi.fn(async () => "gcs/object.pdf"),
  readFile: vi.fn(),
  deleteFile: vi.fn(),
};
vi.mock("@/di/container", () => ({ getContainer: () => ({ get: () => gcs }) }));

import {
  DEV_PDF_DIR,
  getKnowledgePdfStorage,
  isDevPdfPath,
} from "../pdf-storage";

const PDF = Buffer.from("%PDF-1.4 test");

describe("Knowledge Base PDF storage", () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(path.join(tmpdir(), "kb-pdf-"));
    vi.spyOn(process, "cwd").mockReturnValue(cwd);
    vi.stubEnv("GCS_BUCKET_NAME", "");
    vi.stubEnv("GCS_ATTACHMENTS_PREFIX", "");
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    await rm(cwd, { recursive: true, force: true });
  });

  it("uses the private GCS bucket whenever it is configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GCS_BUCKET_NAME", "bucket");
    vi.stubEnv("GCS_ATTACHMENTS_PREFIX", "prefix");
    expect(await getKnowledgePdfStorage().upload(PDF, "p.pdf")).toBe(
      "gcs/object.pdf",
    );
  });

  it("fails closed outside development when GCS is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getKnowledgePdfStorage()).toThrow(
      "PRIVATE_GCS_STORAGE_REQUIRED",
    );
  });

  it("keeps development uploads in a private, unserved folder", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const storage = getKnowledgePdfStorage();
    const stored = await storage.upload(PDF, "../../evil name.pdf");
    expect(isDevPdfPath(stored)).toBe(true);
    expect(await readdir(path.join(cwd, DEV_PDF_DIR))).toHaveLength(1);
    expect(await readdir(cwd)).not.toContain("public");
    const mode = (await stat(path.join(cwd, DEV_PDF_DIR))).mode & 0o777;
    expect(mode).toBe(0o700);
    expect((await storage.read(stored)).equals(PDF)).toBe(true);
    await storage.remove(stored);
    await expect(storage.read(stored)).rejects.toThrow("PDF_NOT_FOUND");
  });

  it("refuses paths that aren't its own", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const storage = getKnowledgePdfStorage();
    for (const bad of [
      "kb-dev/../../.env",
      "/etc/passwd",
      "public/uploads/x.pdf",
    ]) {
      await expect(storage.read(bad)).rejects.toThrow("PDF_NOT_FOUND");
    }
  });
});

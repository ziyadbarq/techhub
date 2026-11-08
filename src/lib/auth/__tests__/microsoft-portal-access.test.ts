import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: { session: { findUnique: vi.fn() } },
}));

import { getSession } from "@/lib/auth/session";
import { prisma } from "@/infrastructure/database/prisma/client";
import { getMicrosoftPortalAccess } from "../microsoft-portal-access";

const mockSession = vi.mocked(getSession);
const mockFind = vi.mocked(prisma.session.findUnique);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Microsoft request portal session guard", () => {
  it("denies anonymous sessions", async () => {
    mockSession.mockResolvedValue({ session: null, user: null });
    expect(await getMicrosoftPortalAccess()).toEqual({ authenticated: false, allowed: false });
    expect(mockFind).not.toHaveBeenCalled();
  });

  it("denies an email session even if that user previously linked Microsoft", async () => {
    mockSession.mockResolvedValue({ session: { token: "email-session" }, user: { id: "u1" } } as never);
    mockFind.mockResolvedValue({ userId: "u1", authProvider: null, expires: new Date(Date.now() + 60000) } as never);
    expect((await getMicrosoftPortalAccess()).allowed).toBe(false);
  });

  it("denies a session belonging to another user", async () => {
    mockSession.mockResolvedValue({ session: { token: "token" }, user: { id: "u1" } } as never);
    mockFind.mockResolvedValue({ userId: "u2", authProvider: "microsoft", expires: new Date(Date.now() + 60000) } as never);
    expect((await getMicrosoftPortalAccess()).allowed).toBe(false);
  });

  it("denies an expired Microsoft session", async () => {
    mockSession.mockResolvedValue({ session: { token: "token" }, user: { id: "u1" } } as never);
    mockFind.mockResolvedValue({ userId: "u1", authProvider: "microsoft", expires: new Date(Date.now() - 60000) } as never);
    expect((await getMicrosoftPortalAccess()).allowed).toBe(false);
  });

  it("accepts only a current Microsoft-authenticated session", async () => {
    mockSession.mockResolvedValue({ session: { token: "token" }, user: { id: "u1" } } as never);
    mockFind.mockResolvedValue({ userId: "u1", authProvider: "microsoft", expires: new Date(Date.now() + 60000) } as never);
    expect(await getMicrosoftPortalAccess()).toEqual({ authenticated: true, allowed: true });
  });
});

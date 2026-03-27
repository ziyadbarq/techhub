import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkSetupStatusAction,
  createFirstAdminAction,
} from "../setup.controller";

const { mockAssignFirstAdminUseCase, mockLogger, mockPrisma, mockGetAuth } =
  vi.hoisted(() => ({
    mockAssignFirstAdminUseCase: {
      execute: vi.fn(),
    },
    mockLogger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      startTimer: vi.fn(() => ({ startTime: Date.now() })),
      endTimer: vi.fn(),
    },
    mockPrisma: {
      user: {
        count: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
      },
      userRole: {
        findFirst: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
      organizationUnit: {
        count: vi.fn(),
      },
      featureFlag: {
        count: vi.fn(),
      },
      session: {
        deleteMany: vi.fn(),
      },
      account: {
        deleteMany: vi.fn(),
      },
    },
    mockGetAuth: vi.fn(),
  }));

vi.mock("@/infrastructure/database/prisma/client", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/interface-adapters/auth/better-auth", () => ({
  getAuth: mockGetAuth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/di/container", () => ({
  getContainer: vi.fn(() => ({
    get: vi.fn((token) => {
      const tokenKey = token.toString();
      if (tokenKey === Symbol.for("AssignFirstAdminUseCase").toString()) {
        return mockAssignFirstAdminUseCase;
      }
      if (tokenKey === Symbol.for("ILoggerService").toString()) {
        return mockLogger;
      }
      return null;
    }),
  })),
}));

describe("Setup Recovery Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.user.delete.mockResolvedValue(undefined);
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.account.deleteMany.mockResolvedValue({ count: 0 });
  });

  it("reports recovery mode when one user exists without an assigned admin", async () => {
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.role.findUnique.mockResolvedValue({ id: "role-1" });
    mockPrisma.organizationUnit.count.mockResolvedValue(4);
    mockPrisma.featureFlag.count.mockResolvedValue(9);
    mockPrisma.userRole.findFirst.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue({ email: "first@barq.com" });

    const result = await checkSetupStatusAction();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.needsSetup).toBe(true);
      expect(result.data.hasAssignedAdmin).toBe(false);
      expect(result.data.userCount).toBe(1);
      expect(result.data.recoveryMode).toBe(true);
      expect(result.data.canSeed).toBe(false);
      expect(result.data.canCreateAdmin).toBe(true);
      expect(result.data.existingUserEmail).toBe("first@barq.com");
    }
  });

  it("recovers the existing first account instead of creating another user", async () => {
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.userRole.findFirst.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "first@barq.com",
    });
    mockAssignFirstAdminUseCase.execute.mockResolvedValue({
      success: true,
      message: "System Administrator role assigned successfully.",
    });

    const result = await createFirstAdminAction({
      email: "first@barq.com",
      password: "Password123",
      confirmPassword: "Password123",
      name: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe("user-1");
      expect(result.data.email).toBe("first@barq.com");
      expect(result.data.adminAssigned).toBe(true);
    }

    expect(mockAssignFirstAdminUseCase.execute).toHaveBeenCalledWith({
      userId: "user-1",
      metadata: {},
    });
    expect(mockGetAuth).not.toHaveBeenCalled();
  });

  it("refuses recovery if the submitted email does not match the existing first account", async () => {
    mockPrisma.user.count.mockResolvedValue(1);
    mockPrisma.userRole.findFirst.mockResolvedValue(null);
    mockPrisma.user.findFirst.mockResolvedValue({
      id: "user-1",
      email: "first@barq.com",
    });

    const result = await createFirstAdminAction({
      email: "other@barq.com",
      password: "Password123",
      confirmPassword: "Password123",
      name: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(
        "Use the existing account email to complete setup recovery.",
      );
    }

    expect(mockAssignFirstAdminUseCase.execute).not.toHaveBeenCalled();
    expect(mockGetAuth).not.toHaveBeenCalled();
  });

  it("passes the bootstrap bypass header during atomic first-admin signup", async () => {
    const signUpEmail = vi.fn().mockResolvedValue({
      user: { id: "user-1" },
    });

    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.userRole.findFirst.mockResolvedValue(null);
    mockAssignFirstAdminUseCase.execute.mockResolvedValue({
      success: true,
      message: "System Administrator role assigned successfully.",
    });
    mockGetAuth.mockReturnValue({
      api: {
        signUpEmail,
      },
    });

    const result = await createFirstAdminAction({
      email: "Admin@Barq.com",
      password: "Password123",
      confirmPassword: "Password123",
      name: "Admin User",
    });

    expect(result.success).toBe(true);
    expect(signUpEmail).toHaveBeenCalledTimes(1);

    const signUpArgs = signUpEmail.mock.calls[0]?.[0];
    expect(signUpArgs.body.email).toBe("admin@barq.com");
    expect(signUpArgs.body.callbackURL).toBe("/verify-email?verified=true");
    expect(signUpArgs.headers).toBeInstanceOf(Headers);
    expect(signUpArgs.headers.get("x-techhub-setup-bootstrap")).toBe("true");
  });
});

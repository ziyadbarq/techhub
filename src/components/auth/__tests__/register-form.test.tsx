// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "../RegisterForm";

const {
  mockPush,
  mockReplace,
  mockRefresh,
  mockCheckSetupStatusAction,
  mockSignUpEmail,
  mockSignInEmail,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockRefresh: vi.fn(),
  mockCheckSetupStatusAction: vi.fn(),
  mockSignUpEmail: vi.fn(),
  mockSignInEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/interface-adapters/controllers/setup.controller", () => ({
  checkSetupStatusAction: (...args: unknown[]) =>
    mockCheckSetupStatusAction(...args),
}));

vi.mock("@/lib/auth/client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUpEmail(...args),
    },
    signIn: {
      email: (...args: unknown[]) => mockSignInEmail(...args),
    },
  },
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /setup instead of signing up when bootstrap is still required", async () => {
    const user = userEvent.setup();

    mockCheckSetupStatusAction.mockResolvedValue({
      success: true,
      data: {
        needsSetup: true,
      },
    });

    render(<RegisterForm />);

    const emailInput = document.querySelector<HTMLInputElement>(
      'input[name="email"]',
    );
    const passwordInput = document.querySelector<HTMLInputElement>(
      'input[name="password"]',
    );
    const confirmPasswordInput = document.querySelector<HTMLInputElement>(
      'input[name="confirmPassword"]',
    );

    expect(emailInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(confirmPasswordInput).not.toBeNull();

    await user.type(emailInput!, "user@barq.com");
    await user.type(passwordInput!, "Password123");
    await user.type(confirmPasswordInput!, "Password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockCheckSetupStatusAction).toHaveBeenCalled();
    });

    expect(mockReplace).toHaveBeenCalledWith("/setup");
    expect(mockSignUpEmail).not.toHaveBeenCalled();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });
});

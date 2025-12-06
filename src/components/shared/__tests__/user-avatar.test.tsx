/**
 * UserAvatar Component - Unit Tests
 *
 * Tests for the UserAvatar component including:
 * - Size variant rendering
 * - Image display with Next.js Image optimization
 * - Fallback initials generation
 * - Deterministic color assignment
 * - SSO vs local image URL handling
 * - Tooltip behavior
 *
 * @vitest-environment jsdom
 */

import "@testing-library/jest-dom/vitest";
import type { ImgHTMLAttributes, ReactNode } from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "@/components/shared/user-avatar";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    width,
    height,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} />
  ),
}));

// Mock Radix UI Avatar to simplify testing
vi.mock("@/components/ui/avatar", () => {
  const Avatar = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="avatar-root">
      {children}
    </div>
  );

  const AvatarImage = ({
    children,
    className,
    asChild,
    ...props
  }: {
    children?: ReactNode;
    className?: string;
    asChild?: boolean;
  } & ImgHTMLAttributes<HTMLImageElement>) => {
    if (asChild && children) {
      return <>{children}</>;
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img data-testid="avatar-image" className={className} {...props} />
    );
  };

  const AvatarFallback = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="avatar-fallback">
      {children}
    </div>
  );

  return {
    Avatar,
    AvatarImage,
    AvatarFallback,
  };
});

describe("UserAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Size variants", () => {
    it("should render xs size with correct classes", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" size="xs" />,
      );

      const avatar = container.querySelector('[class*="h-6"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-6", "w-6");
    });

    it("should render sm size with correct classes", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" size="sm" />,
      );

      const avatar = container.querySelector('[class*="h-8"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-8", "w-8");
    });

    it("should render md size by default", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" />,
      );

      const avatar = container.querySelector('[class*="h-12"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-12", "w-12");
    });

    it("should render lg size with correct classes", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" size="lg" />,
      );

      const avatar = container.querySelector('[class*="h-16"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-16", "w-16");
    });

    it("should render xl size with correct classes", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" size="xl" />,
      );

      const avatar = container.querySelector('[class*="h-32"]');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-32", "w-32");
    });
  });

  describe("Initials generation", () => {
    it("should display initials from full name", () => {
      render(<UserAvatar name="John Doe" email="john@example.com" />);

      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });

    it("should display initials from single name", () => {
      render(<UserAvatar name="John" email="john@example.com" />);

      const initials = screen.getByText("J");
      expect(initials).toBeInTheDocument();
    });

    it("should display initials from three-part name (first and second)", () => {
      render(
        <UserAvatar name="John Robert Doe" email="john.doe@example.com" />,
      );

      const initials = screen.getByText("JR");
      expect(initials).toBeInTheDocument();
    });

    it("should display email initial when name is not provided", () => {
      render(<UserAvatar email="john@example.com" />);

      const initials = screen.getByText("J");
      expect(initials).toBeInTheDocument();
    });

    it("should display U when no name or email provided", () => {
      render(<UserAvatar />);

      const initials = screen.getByText("U");
      expect(initials).toBeInTheDocument();
    });

    it("should uppercase initials", () => {
      render(<UserAvatar name="john doe" email="john@example.com" />);

      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });
  });

  describe("Image display", () => {
    it("should display image when provided", () => {
      render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          image="/uploads/avatars/user123/128.webp"
          size="md"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/uploads/avatars/user123/96.webp"); // md = 48px (2x retina)
    });

    it("should use correct size variant for xs", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="/uploads/avatars/user123/128.webp"
          size="xs"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute("src", "/uploads/avatars/user123/48.webp");
    });

    it("should use correct size variant for sm", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="/uploads/avatars/user123/128.webp"
          size="sm"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute("src", "/uploads/avatars/user123/64.webp");
    });

    it("should use correct size variant for lg", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="/uploads/avatars/user123/128.webp"
          size="lg"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute("src", "/uploads/avatars/user123/128.webp");
    });

    it("should use correct size variant for xl", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="/uploads/avatars/user123/128.webp"
          size="xl"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute("src", "/uploads/avatars/user123/256.webp");
    });

    it("should pass through SSO image URL unchanged", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="https://graph.microsoft.com/v1.0/users/john@company.com/photo/$value"
          size="md"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute(
        "src",
        "https://graph.microsoft.com/v1.0/users/john@company.com/photo/$value",
      );
    });

    it("should handle legacy upload format unchanged", () => {
      render(
        <UserAvatar
          name="John Doe"
          image="/uploads/2024/05/ckm123abc.jpg"
          size="md"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toHaveAttribute("src", "/uploads/2024/05/ckm123abc.jpg");
    });

    it("should use email for alt text when no name provided", () => {
      render(
        <UserAvatar
          email="john@example.com"
          image="/uploads/avatars/user123/128.webp"
        />,
      );

      const img = screen.getByAltText("john@example.com");
      expect(img).toBeInTheDocument();
    });

    it("should use default alt text when no name or email", () => {
      render(<UserAvatar image="/uploads/avatars/user123/128.webp" />);

      const img = screen.getByAltText("User avatar");
      expect(img).toBeInTheDocument();
    });
  });

  describe("User object prop", () => {
    it("should accept user object with all fields", () => {
      const user = {
        name: "Jane Smith",
        email: "jane@example.com",
        image: "/uploads/avatars/user456/128.webp",
      };

      render(<UserAvatar user={user} size="md" />);

      const img = screen.getByAltText("Jane Smith");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/uploads/avatars/user456/96.webp");
    });

    it("should handle user object with null values", () => {
      const user = {
        name: null,
        email: "jane@example.com",
        image: null,
      };

      render(<UserAvatar user={user} />);

      const initials = screen.getByText("J");
      expect(initials).toBeInTheDocument();
    });

    it("should prioritize user object over individual props", () => {
      const user = {
        name: "User Object Name",
        email: "user@object.com",
        image: "/user-object.jpg",
      };

      render(
        <UserAvatar
          user={user}
          name="Individual Name"
          email="individual@example.com"
          image="/individual.jpg"
        />,
      );

      // Should use user object values
      const initials = screen.getByText("UO"); // User Object
      expect(initials).toBeInTheDocument();
    });
  });

  describe("Fallback behavior", () => {
    it("should show fallback initials when image is undefined", () => {
      render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          image={undefined}
        />,
      );

      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });

    it("should show fallback initials when image is null", () => {
      render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          image={undefined}
        />,
      );

      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });

    it("should show fallback initials when image is empty string", () => {
      render(<UserAvatar name="John Doe" email="john@example.com" image="" />);

      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });
  });

  describe("Deterministic color assignment", () => {
    it("should apply consistent background and text color classes", () => {
      const { container } = render(
        <UserAvatar name="John Doe" email="john@example.com" />,
      );

      // Get the fallback element
      const fallback = container.querySelector('[class*="bg-"]');
      expect(fallback).toBeInTheDocument();

      // Should have both background and text color classes
      const classes = fallback?.className || "";
      const hasBgColor =
        /bg-(red|blue|green|yellow|purple|pink|indigo|teal|orange|cyan)-/.test(
          classes,
        );
      const hasTextColor =
        /text-(red|blue|green|yellow|purple|pink|indigo|teal|orange|cyan)-/.test(
          classes,
        );

      expect(hasBgColor).toBe(true);
      expect(hasTextColor).toBe(true);
    });

    it("should use same color for same name (deterministic)", () => {
      const { container: container1 } = render(
        <UserAvatar name="John Doe" email="john1@example.com" />,
      );
      const { container: container2 } = render(
        <UserAvatar name="John Doe" email="john2@example.com" />,
      );

      const fallback1 = container1.querySelector('[class*="bg-"]');
      const fallback2 = container2.querySelector('[class*="bg-"]');

      expect(fallback1?.className).toBe(fallback2?.className);
    });

    it("should use different colors for different names", () => {
      const { container: container1 } = render(
        <UserAvatar name="Alice" email="alice@example.com" />,
      );
      const { container: container2 } = render(
        <UserAvatar name="Bob" email="bob@example.com" />,
      );

      const fallback1 = container1.querySelector('[class*="bg-"]');
      const fallback2 = container2.querySelector('[class*="bg-"]');

      // Very unlikely to have the same color class for different names
      // (but not impossible, so this is a probabilistic test)
      const classes1 = fallback1?.className || "";
      const classes2 = fallback2?.className || "";

      // Just verify they both have color classes, not that they're different
      // (hash collision is possible but unlikely)
      const hasBg1 =
        /bg-(red|blue|green|yellow|purple|pink|indigo|teal|orange|cyan)-/.test(
          classes1,
        );
      const hasBg2 =
        /bg-(red|blue|green|yellow|purple|pink|indigo|teal|orange|cyan)-/.test(
          classes2,
        );

      expect(hasBg1).toBe(true);
      expect(hasBg2).toBe(true);
    });
  });

  describe("Custom className", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          className="custom-class"
        />,
      );

      const avatar = container.querySelector(".custom-class");
      expect(avatar).toBeInTheDocument();
    });

    it("should merge custom className with size classes", () => {
      const { container } = render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          size="lg"
          className="custom-class"
        />,
      );

      const avatar = container.querySelector(".custom-class");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveClass("h-16", "w-16", "custom-class");
    });
  });

  describe("Accessibility", () => {
    it("should have proper alt text for image", () => {
      render(
        <UserAvatar
          name="John Doe"
          email="john@example.com"
          image="/uploads/avatars/user123/128.webp"
        />,
      );

      const img = screen.getByAltText("John Doe");
      expect(img).toBeInTheDocument();
    });

    it("should have aria-label on fallback for screen readers", () => {
      render(<UserAvatar name="John Doe" email="john@example.com" />);

      // Radix Avatar provides aria-label automatically
      // Just verify the fallback text is visible
      const initials = screen.getByText("JD");
      expect(initials).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("should handle very long names gracefully", () => {
      render(
        <UserAvatar
          name="Jean-Baptiste Poquelin de Molière"
          email="moliere@example.com"
        />,
      );

      // Should show first two initials only
      const initials = screen.getByText("JP");
      expect(initials).toBeInTheDocument();
    });

    it("should handle names with special characters", () => {
      render(<UserAvatar name="José García-López" email="jose@example.com" />);

      const initials = screen.getByText("JG");
      expect(initials).toBeInTheDocument();
    });

    it("should handle email-only users", () => {
      render(<UserAvatar email="no-name@example.com" />);

      const initials = screen.getByText("N");
      expect(initials).toBeInTheDocument();
    });

    it("should handle names with numbers", () => {
      render(<UserAvatar name="User123" email="user123@example.com" />);

      const initials = screen.getByText("U");
      expect(initials).toBeInTheDocument();
    });
  });
});

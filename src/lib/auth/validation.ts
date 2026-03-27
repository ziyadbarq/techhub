import { z } from "zod";

/**
 * Password validation for new passwords (registration, reset).
 * Hard requirements: 8+ chars, at least one letter and one number.
 * Strength meter in UI encourages uppercase, symbols, and length >= 12.
 */
const newPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

/**
 * Validation schema for user login with email and password
 */
export const loginSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validation schema for user registration
 */
export const registerSchema = z
  .object({
    email: z.email({ error: "Invalid email address" }),
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    name: z
      .string()
      .max(100, "Name must be less than 100 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Validation schema for forgot password (request reset link)
 */
export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Validation schema for reset password (set new password with token)
 */
export const resetPasswordSchema = z
  .object({
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

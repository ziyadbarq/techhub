/**
 * IUserRepository Interface
 * Data access contract for application users (auth accounts)
 */

import type { User } from "@/generated/prisma";

export interface IUserRepository {
  /**
   * Find all users
   */
  findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "email" | "name" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<User[]>;

  /**
   * Get all users (alias for findAll with no options)
   */
  listAll(): Promise<User[]>;

  /**
   * Count total number of users
   */
  count(): Promise<number>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Create user directly (for system setup)
   * This bypasses Better Auth and creates user directly in database
   */
  createDirectly(data: {
    email: string;
    name: string;
    passwordHash: string;
    emailVerified?: boolean;
  }): Promise<User>;

  /**
   * Update user's email verification status
   */
  updateEmailVerification(userId: string, verified: boolean): Promise<User>;

  /**
   * Update user's password (admin password reset)
   * Updates the password hash in the Account table
   */
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

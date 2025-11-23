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
}

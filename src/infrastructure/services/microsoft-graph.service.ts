/**
 * Microsoft Graph Service Implementation
 *
 * Implements the IMicrosoftGraphService interface for fetching users
 * from Microsoft Entra ID (Azure AD) via Microsoft Graph API.
 *
 * Uses Client Credentials Flow for app-only authentication,
 * suitable for background sync jobs without user interaction.
 */

import { inject, injectable } from "inversify";
import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";
import type { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import type { IMicrosoftGraphService } from "@/core/services/microsoft-graph.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { DI_TOKENS } from "@/di/types";
import {
  GraphUserSchema,
  GraphManagerResponseSchema,
  isInternalUser,
  type FetchUsersOptions,
  type GraphUser,
  type GraphManagerResponse,
} from "@/lib/schemas/graph-user.schema";

/**
 * Fields to select from Graph API user endpoint
 * Optimized for sync use case - only fields we need
 */
const SELECT_FIELDS = [
  "id",
  "givenName",
  "surname",
  "displayName",
  "mail",
  "userPrincipalName",
  "businessPhones",
  "mobilePhone",
  "employeeId",
  "jobTitle",
  "department",
  "officeLocation",
  "accountEnabled",
  "employeeHireDate",
].join(",");

/**
 * Batch size for manager fetching to avoid API throttling
 */
const MANAGER_BATCH_SIZE = 20;

/**
 * Delay between batches (ms) to respect rate limits
 */
const BATCH_DELAY_MS = 100;

/**
 * Maximum users per page from Graph API
 */
const PAGE_SIZE = 999;

@injectable()
export class MicrosoftGraphService implements IMicrosoftGraphService {
  private client: Client | null = null;
  private readonly logger: ILoggerService;

  constructor(@inject(DI_TOKENS.ILoggerService) logger: ILoggerService) {
    this.logger = logger.child({ service: "MicrosoftGraphService" });
  }

  /**
   * Lazy initialization of Graph client
   * Allows service to be instantiated even if env vars are missing
   */
  private getClient(): Client {
    if (this.client) {
      return this.client;
    }

    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        "Missing Microsoft Graph configuration. Required environment variables: " +
          "AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET",
      );
    }

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    // Create custom auth provider since the built-in one has type issues
    const authProvider = {
      getAccessToken: async (): Promise<string> => {
        const token = await credential.getToken(
          "https://graph.microsoft.com/.default",
        );
        return token.token;
      },
    };

    this.client = Client.initWithMiddleware({
      authProvider:
        authProvider as unknown as TokenCredentialAuthenticationProvider,
    });

    this.logger.debug("Graph client initialized");
    return this.client;
  }

  /**
   * Fetches all users from Microsoft Graph API with pagination
   */
  async fetchAllUsers(options?: FetchUsersOptions): Promise<GraphUser[]> {
    const client = this.getClient();
    const allUsers: GraphUser[] = [];
    let nextLink: string | undefined;
    let pageCount = 0;

    this.logger.info("Starting user fetch from Graph API", { options });

    try {
      // Build filter for enabled users
      const filters: string[] = [];
      if (!options?.includeDisabled) {
        filters.push("accountEnabled eq true");
      }
      const filterQuery =
        filters.length > 0 ? filters.join(" and ") : undefined;

      // Initial request
      let request = client.api("/users").select(SELECT_FIELDS).top(PAGE_SIZE);
      if (filterQuery) {
        request = request.filter(filterQuery);
      }

      const response = await request.get();
      pageCount++;

      // Validate and collect users from first page
      for (const user of response.value) {
        const result = GraphUserSchema.safeParse(user);
        if (result.success) {
          allUsers.push(result.data);
        } else {
          this.logger.warn("Invalid user data skipped", {
            userId: user?.id,
            errors: result.error.issues,
          });
        }
      }

      nextLink = response["@odata.nextLink"];

      // Handle pagination
      while (nextLink) {
        this.logger.debug("Fetching next page", {
          page: pageCount + 1,
        });

        const pageResponse = await client.api(nextLink).get();
        pageCount++;

        for (const user of pageResponse.value) {
          const result = GraphUserSchema.safeParse(user);
          if (result.success) {
            allUsers.push(result.data);
          }
        }

        nextLink = pageResponse["@odata.nextLink"];
      }

      // Filter out guests if not included
      const filteredUsers = options?.includeGuests
        ? allUsers
        : allUsers.filter(isInternalUser);

      this.logger.info("User fetch completed", {
        totalFetched: allUsers.length,
        afterGuestFilter: filteredUsers.length,
        pages: pageCount,
      });

      return filteredUsers;
    } catch (error) {
      this.logger.error(
        "Failed to fetch users from Graph API",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  /**
   * Fetches a specific user by Azure AD ID
   */
  async fetchUser(userId: string): Promise<GraphUser | null> {
    const client = this.getClient();

    try {
      const user = await client
        .api(`/users/${userId}`)
        .select(SELECT_FIELDS)
        .get();

      const result = GraphUserSchema.safeParse(user);
      if (result.success) {
        return result.data;
      }

      this.logger.warn("Invalid user data received", {
        userId,
        errors: result.error.issues,
      });
      return null;
    } catch (error: unknown) {
      // 404 = user not found
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetches the manager for a specific user
   */
  async fetchUserManager(userId: string): Promise<GraphManagerResponse | null> {
    const client = this.getClient();

    try {
      const manager = await client
        .api(`/users/${userId}/manager`)
        .select("id,displayName")
        .get();

      const result = GraphManagerResponseSchema.safeParse(manager);
      if (result.success) {
        return result.data;
      }

      this.logger.warn("Invalid manager data received", {
        userId,
        errors: result.error.issues,
      });
      return null;
    } catch (error: unknown) {
      // 404 = no manager assigned (normal case)
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 404
      ) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetches managers for multiple users in batches
   */
  async fetchAllManagers(userIds: string[]): Promise<Map<string, string>> {
    const managerMap = new Map<string, string>();

    this.logger.info("Starting manager fetch", {
      userCount: userIds.length,
    });

    // Process in batches to avoid API throttling
    for (let i = 0; i < userIds.length; i += MANAGER_BATCH_SIZE) {
      const batch = userIds.slice(i, i + MANAGER_BATCH_SIZE);

      await Promise.all(
        batch.map(async (userId) => {
          try {
            const manager = await this.fetchUserManager(userId);
            if (manager) {
              managerMap.set(userId, manager.id);
            }
          } catch (error) {
            // Log but don't fail entire batch for one user
            this.logger.warn("Failed to fetch manager for user", {
              userId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }),
      );

      // Rate limiting: pause between batches
      if (i + MANAGER_BATCH_SIZE < userIds.length) {
        await this.delay(BATCH_DELAY_MS);
      }
    }

    this.logger.info("Manager fetch completed", {
      userCount: userIds.length,
      managersFound: managerMap.size,
    });

    return managerMap;
  }

  /**
   * Tests connection to Microsoft Graph API
   */
  async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      // Try to fetch a minimal amount of data to verify connection
      await client.api("/users").select("id").top(1).get();
      this.logger.info("Graph API connection successful");
      return true;
    } catch (error) {
      this.logger.error(
        "Graph API connection failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Helper function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

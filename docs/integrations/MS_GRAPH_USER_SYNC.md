# Microsoft Graph User Sync - Integration Guide

> **Target File**: `docs/integrations/MS_GRAPH_USER_SYNC.md`
> **Last Updated**: 2025-11-26
> **Tested With**: Barq tenant (1000+ users)

---

## Table of Contents

1. [Tech Stack Summary](#tech-stack-summary)
2. [Implementation Checklist](#implementation-checklist)
3. [NPM Dependencies](#npm-dependencies)
4. [Schema Migration](#schema-migration)
5. [Azure AD App Registration](#azure-ad-app-registration)
6. [Database Schema](#database-schema)
7. [Microsoft Graph API](#microsoft-graph-api-integration)
8. [Graph Response Schema](#graph-api-response-schema)
9. [Field Mapping](#field-mapping)
10. [TypeScript Implementation](#typescript-implementation)
11. [DI Registration](#di-registration)
12. [Sync Strategies](#sync-strategies)
13. [Error Handling](#error-handling)
14. [Environment Variables](#environment-variables)
15. [Existing Data Backfill](#existing-data-backfill)

---

## Tech Stack Summary

**Full-stack**: Next.js 16 (Turbopack) with React 19.2 on TypeScript 5.9. UI built with shadcn/ui components and Sonner for toasts. React Compiler enabled.

**Database & ORM**: Prisma 7 with PostgreSQL, using generated client singleton from `@/generated/prisma`. Redis (ioredis) for caching and background job queues (BullMQ).

**Architecture**: 5-layer Clean Architecture—Presentation → Interface Adapters (Controllers, DTOs, Presenters) → Use Cases → Domain (Entities, business rules) ← Infrastructure (Repositories, external services). Dependency injection via InversifyJS 7; validation with Zod 4 at boundaries.

**Authentication**: Better Auth 1.3.x with Prisma adapter supporting:
- Email/password (configurable registration)
- Microsoft Entra ID (Azure AD) OAuth with configurable tenant
- AES-256-GCM encrypted OAuth token storage (PBKDF2, 100k iterations)
- Cookie-based sessions (7-day expiry, 1-day refresh, 5-minute cache)

**Authorization**: Custom RBAC system with 269 permissions across 14 groups. Server-side enforcement via `requirePermission()` in server components/actions; feature flags via `requireFeature()`.

---

## Implementation Checklist

Before the sync feature can work, complete these tasks:

### Phase 1: Infrastructure Setup

- [ ] **Install NPM dependencies** (see [NPM Dependencies](#npm-dependencies))
- [ ] **Run schema migration** (see [Schema Migration](#schema-migration))
- [ ] **Create Azure AD App Registration** (see [Azure AD App Registration](#azure-ad-app-registration))
- [ ] **Add environment variables** (see [Environment Variables](#environment-variables))

### Phase 2: Code Implementation

- [ ] Create `src/lib/schemas/graph-user.schema.ts` - Zod validation schemas
- [ ] Create `src/infrastructure/services/microsoft-graph.service.ts` - Graph API client
- [ ] Create `src/use-cases/person/sync-users-from-graph.use-case.ts` - Sync logic
- [ ] Create `src/infrastructure/jobs/user-sync.job.ts` - BullMQ job
- [ ] Register service in DI container (see [DI Registration](#di-registration))
- [ ] Add `PERSON_SYNC` permission to RBAC

### Phase 3: API & Testing

- [ ] Create `src/app/api/admin/sync-users/route.ts` - Manual trigger endpoint
- [ ] Create `scripts/sync-users.ts` - CLI script for manual sync
- [ ] Backfill existing Person records (see [Existing Data Backfill](#existing-data-backfill))
- [ ] Test sync with small batch first

---

## NPM Dependencies

Install required packages:

```bash
npm install @azure/identity @microsoft/microsoft-graph-client
```

| Package | Version | Purpose |
|---------|---------|---------|
| `@azure/identity` | `^4.x` | Azure AD authentication (Client Credentials Flow) |
| `@microsoft/microsoft-graph-client` | `^3.x` | Microsoft Graph API client |

> **Note**: These packages are only needed for the sync job (server-side). They should NOT be imported in client components.

---

## Schema Migration

### Required Changes to Person Model

**Current schema** (in `schema.prisma`):
```prisma
model Person {
  // ... existing fields
  email           String    @unique  // ❌ Currently unique
  // ... no azureAdId field
  // ... no office field
}
```

**Required schema**:
```prisma
model Person {
  // ... existing fields
  azureAdId       String?   @unique  // ✅ ADD: Immutable MS Graph ID
  email           String              // ✅ CHANGE: Remove @unique (emails can change)
  office          String?             // ✅ ADD: Office location from MS Graph
  // ... rest of fields
}
```

### Migration Steps

**Step 1: Add new fields (safe)**

```bash
# Add azureAdId and office fields first (nullable, no constraints)
npx dotenv -e .env.local -- prisma db push
```

Add to schema.prisma:
```prisma
model Person {
  id              String    @id @default(cuid())
  azureAdId       String?   @unique       // ⭐ NEW: Immutable MS Graph ID
  userId          String?   @unique
  firstName       String
  lastName        String
  middleName      String?
  email           String    @unique       // Keep unique for now
  phone           String?
  mobile          String?
  employeeId      String?   @unique
  orgUnitId       String
  primaryRoleId   String
  managerId       String?
  title           String?
  office          String?                 // ⭐ NEW: Office location
  locationId      String?
  department      String?
  // ... rest unchanged
}
```

**Step 2: Backfill azureAdId for existing users** (see [Existing Data Backfill](#existing-data-backfill))

**Step 3: Remove email unique constraint** (after backfill)

> **✅ Decision: Option A** - Remove `@unique` from email, rely on `azureAdId` as source of truth.
>
> **Rationale**: Emails can change in Azure AD (marriage, company rebranding, typo fixes). Using `azureAdId` as the immutable identity key ensures proper record matching even when emails change.

Update schema to remove `@unique` from email:
```prisma
email           String    // No @unique - emails can change, azureAdId is source of truth
```

**Final Person model after migration:**
```prisma
model Person {
  id              String    @id @default(cuid())
  azureAdId       String?   @unique       // ⭐ Source of truth for MS Graph sync
  userId          String?   @unique
  firstName       String
  lastName        String
  middleName      String?
  email           String                  // ✅ No @unique - can change in AD
  phone           String?
  mobile          String?
  employeeId      String?   @unique
  orgUnitId       String
  primaryRoleId   String
  managerId       String?
  title           String?
  office          String?                 // Office location from MS Graph
  locationId      String?
  department      String?
  hireDate        DateTime?
  terminationDate DateTime?
  isActive        Boolean   @default(true)
  metadata        Json?
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations (unchanged)
  // ...

  @@index([azureAdId])
  @@index([userId])
  @@index([email])        // Keep index for lookups, just not unique
  @@index([employeeId])
  @@index([orgUnitId])
  @@index([primaryRoleId])
  @@index([managerId])
  @@index([isActive])
  @@map("persons")
}
```

### Migration Command Sequence

```bash
# 1. Add azureAdId and office fields (keep email @unique temporarily)
# Edit schema.prisma, then:
npm run db:push
npm run db:generate

# 2. Run backfill script to populate azureAdId for existing persons
npx dotenv -e .env.local -- npx tsx scripts/backfill-azure-ad-ids.ts

# 3. Remove @unique from email in schema.prisma, then:
npm run db:push
npm run db:generate

# 4. Verify migration
npx dotenv -e .env.local -- prisma studio
```

---

## Azure AD App Registration

### Step 1: Create App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID** → **App registrations**
2. Click **New registration**
3. Configure:
   - **Name**: `Barq User Sync Service`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: Leave blank (not needed for client credentials)
4. Click **Register**

### Step 2: Note Application IDs

After registration, note these values:

```
Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Directory (tenant) ID:   xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Step 3: Create Client Secret

1. Go to **Certificates & secrets** → **Client secrets**
2. Click **New client secret**
3. Set description: `User Sync Production`
4. Set expiry: `24 months` (recommended)
5. Click **Add** and **immediately copy the secret value**

> **Warning**: Secret is only shown once. Store it securely.

### Step 4: Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Select **Microsoft Graph** → **Application permissions**
3. Add these permissions:

| Permission | Description | Required |
|------------|-------------|----------|
| `User.Read.All` | Read all users' full profiles | Yes |
| `Directory.Read.All` | Read directory data (for manager relationships) | Optional |

4. Click **Grant admin consent for [Tenant]**

### Step 5: Verify Setup

Green checkmarks should appear next to all permissions indicating admin consent granted.

---

## Database Schema

### `users` Table (Better Auth)

```sql
CREATE TABLE users (
  id              TEXT PRIMARY KEY,      -- cuid()
  email           TEXT UNIQUE NOT NULL,
  name            TEXT,
  image           TEXT,
  email_verified  TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP,
  last_login_method TEXT,                -- 'email' | 'microsoft'
  last_login_at   TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Prisma Model:**
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String?
  image           String?
  emailVerified   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginMethod String?
  lastLoginAt     DateTime?

  // Relations
  accounts        Account[]
  sessions        Session[]
  roles           UserRole[]
  person          Person?   // Optional 1:1 link to Person

  @@index([email])
  @@map("users")
}
```

---

### `accounts` Table (OAuth/Credentials)

```sql
CREATE TABLE accounts (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT DEFAULT 'oauth',
  provider            TEXT NOT NULL,       -- 'credential' | 'microsoft'
  provider_account_id TEXT NOT NULL,
  refresh_token       TEXT,                -- AES-256-GCM encrypted
  access_token        TEXT,                -- AES-256-GCM encrypted
  expires_at          TIMESTAMP,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,                -- AES-256-GCM encrypted
  session_state       TEXT,
  password            TEXT,                -- For email/password auth (hashed)
  created_at          TIMESTAMP DEFAULT NOW(),
  updated_at          TIMESTAMP,

  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_expires_at ON accounts(expires_at);
```

**Prisma Model:**
```prisma
model Account {
  id                String    @id @default(cuid())
  userId            String
  type              String    @default("oauth")
  provider          String
  providerAccountId String
  refreshToken      String?   @db.Text
  accessToken       String?   @db.Text
  expiresAt         DateTime?
  tokenType         String?
  scope             String?
  idToken           String?   @db.Text
  sessionState      String?
  password          String?   @db.Text
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@index([expiresAt])
  @@map("accounts")
}
```

---

### `persons` Table (Organizational People)

```sql
CREATE TABLE persons (
  id               TEXT PRIMARY KEY,
  azure_ad_id      TEXT UNIQUE,           -- ⭐ Immutable MS Graph ID (source of truth)
  user_id          TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  middle_name      TEXT,
  email            TEXT NOT NULL,         -- Can change (not the lookup key)
  phone            TEXT,
  mobile           TEXT,
  employee_id      TEXT UNIQUE,
  org_unit_id      TEXT NOT NULL,         -- FK to organization_units
  primary_role_id  TEXT NOT NULL,         -- FK to roles
  manager_id       TEXT,                  -- FK to persons (self-ref)
  title            TEXT,
  office           TEXT,                  -- Office location from MS Graph
  location_id      TEXT,                  -- FK to locations (optional lookup)
  department       TEXT,
  hire_date        TIMESTAMP,
  termination_date TIMESTAMP,
  is_active        BOOLEAN DEFAULT TRUE,
  deleted_at       TIMESTAMP,             -- Soft delete
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP
);

CREATE UNIQUE INDEX idx_persons_azure_ad_id ON persons(azure_ad_id);
CREATE INDEX idx_persons_user_id ON persons(user_id);
CREATE INDEX idx_persons_email ON persons(email);
CREATE INDEX idx_persons_employee_id ON persons(employee_id);
CREATE INDEX idx_persons_org_unit_id ON persons(org_unit_id);
CREATE INDEX idx_persons_primary_role_id ON persons(primary_role_id);
CREATE INDEX idx_persons_manager_id ON persons(manager_id);
CREATE INDEX idx_persons_is_active ON persons(is_active);
```

> **Important**: `azureAdId` is the **source of truth** for identity. Email can change (marriage, rebranding), but Azure AD ID is immutable. Always upsert by `azureAdId`, never by email.

**Prisma Model:**
```prisma
model Person {
  id              String    @id @default(cuid())
  azureAdId       String?   @unique       // ⭐ Immutable MS Graph ID
  userId          String?   @unique
  firstName       String
  lastName        String
  middleName      String?
  email           String                  // Can change (not unique anymore)
  phone           String?
  mobile          String?
  employeeId      String?   @unique
  orgUnitId       String
  primaryRoleId   String
  managerId       String?
  title           String?
  office          String?                 // Office location from MS Graph
  locationId      String?
  department      String?
  hireDate        DateTime?
  terminationDate DateTime?
  isActive        Boolean   @default(true)
  deletedAt       DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  user        User?            @relation(fields: [userId], references: [id], onDelete: SetNull)
  orgUnit     OrganizationUnit @relation(fields: [orgUnitId], references: [id])
  primaryRole Role             @relation(fields: [primaryRoleId], references: [id])
  manager     Person?          @relation("PersonManager", fields: [managerId], references: [id])
  directReports Person[]       @relation("PersonManager")

  @@index([azureAdId])
  @@index([userId])
  @@index([email])
  @@index([employeeId])
  @@index([orgUnitId])
  @@index([primaryRoleId])
  @@index([managerId])
  @@index([isActive])
  @@map("persons")
}
```

---

## Microsoft Graph API Integration

### Authentication Method

Use **Client Credentials Flow** (app-only authentication) for background sync jobs:

```typescript
import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';

const credential = new ClientSecretCredential(
  process.env.MICROSOFT_TENANT_ID!,
  process.env.MICROSOFT_CLIENT_ID!,
  process.env.MICROSOFT_CLIENT_SECRET!
);

const graphClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const token = await credential.getToken('https://graph.microsoft.com/.default');
      return token.token;
    }
  }
});
```

### Required Permissions

| Permission | Type | Description |
|------------|------|-------------|
| `User.Read.All` | Application | Read all users' full profiles |
| `Directory.Read.All` | Application | Read directory data (optional, for manager) |

> **Note**: Application permissions require admin consent.

---

## Graph API Response Schema

### Primary User Query

```http
GET https://graph.microsoft.com/v1.0/users
  ?$select=id,givenName,surname,mail,userPrincipalName,businessPhones,mobilePhone,employeeId,jobTitle,department,officeLocation,accountEnabled,employeeHireDate
  &$filter=accountEnabled eq true
  &$top=999
```

### Response Schema (Tested)

Based on live testing with Barq tenant:

```typescript
interface GraphUser {
  // Always present (100% populated)
  id: string;                    // Azure AD Object ID (GUID)
  displayName: string;           // Full display name
  mail: string | null;           // Primary email
  userPrincipalName: string;     // Login UPN (always present)
  businessPhones: string[];      // Array, often empty []
  accountEnabled: boolean;       // Account status

  // Usually present for internal users (~60-100%)
  givenName: string | null;      // First name
  surname: string | null;        // Last name
  jobTitle: string | null;       // Job title
  department: string | null;     // Department name
  mobilePhone: string | null;    // Mobile number
  officeLocation: string | null; // Office location

  // Requires AD admin to populate (0% by default)
  employeeId: string | null;     // Employee ID
  employeeHireDate: string | null; // ISO 8601 date
  employeeType: string | null;   // Employee type
  companyName: string | null;    // Company name
}
```

### Sample Response

```json
{
  "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users",
  "@odata.nextLink": "https://graph.microsoft.com/v1.0/users?$skiptoken=...",
  "value": [
    {
      "id": "e9836314-ae4d-4283-9a34-75df34ea64ae",
      "givenName": "Ali",
      "surname": "ahmed alabbad",
      "mail": "Aaalabbad.c@barq.com",
      "userPrincipalName": "Aaalabbad.c@barq.com",
      "businessPhones": [],
      "mobilePhone": "+966546839297",
      "employeeId": null,
      "jobTitle": "Contact Center Agent",
      "department": "Contact Center",
      "officeLocation": null,
      "accountEnabled": true,
      "employeeHireDate": null
    }
  ]
}
```

### User Types in Tenant

| User Type | UPN Pattern | Data Quality |
|-----------|-------------|--------------|
| **Internal** | `user@barq.com` | Full data available |
| **Guest/External** | `user_domain.com#EXT#@tenant.onmicrosoft.com` | Limited data (mail, displayName only) |

> **Important**: Filter out external users in sync or handle separately.

```typescript
// Filter to exclude guest users
const isInternalUser = (user: GraphUser) =>
  !user.userPrincipalName.includes('#EXT#');
```

---

## Field Mapping

### Identity Strategy

> **⭐ Key Insight**: The Azure AD `id` (GUID) is **immutable** and never changes for the lifetime of a user. Email addresses CAN change (marriage, company rebranding, typo fixes). Always use `azureAdId` as the source of truth for matching records.

| Scenario | Email | Azure AD ID |
|----------|-------|-------------|
| Employee gets married, changes name | Changes | **Same** |
| Company rebrands domain | Changes | **Same** |
| Typo fix in email | Changes | **Same** |
| Account disabled/re-enabled | Same | **Same** |
| User deleted & recreated | New email possible | **New ID** (correct!) |

### Complete Mapping Table

| Person Field | MS Graph Field | Type | Transform | Notes |
|--------------|----------------|------|-----------|-------|
| `azureAdId` | `id` | `string` | Direct | ⭐ **Source of truth** - immutable GUID |
| `firstName` | `givenName` | `string \| null` | Direct | May be null for guests |
| `lastName` | `surname` | `string \| null` | Direct | May be null for guests |
| `middleName` | — | — | Set `null` | Not available in Graph |
| `email` | `mail ?? userPrincipalName` | `string` | Fallback | UPN as fallback (can change!) |
| `phone` | `businessPhones[0]` | `string \| null` | First item | Usually empty array |
| `mobile` | `mobilePhone` | `string \| null` | Direct | Good coverage (84%) |
| `employeeId` | `employeeId` | `string \| null` | Direct | Requires AD setup (14%) |
| `title` | `jobTitle` | `string \| null` | Direct | Good coverage (81%) |
| `department` | `department` | `string \| null` | Direct | Good coverage (75%) |
| `office` | `officeLocation` | `string \| null` | Direct | e.g. "India Office", "Riyadh HQ" |
| `locationId` | `officeLocation` | `string \| null` | Lookup | Optional: map to Location entity |
| `isActive` | `accountEnabled` | `boolean` | Direct | Always present |
| `hireDate` | `employeeHireDate` | `string \| null` | Parse ISO | Requires AD setup (14%) |
| `terminationDate` | — | — | Set `null` | Not available |
| `managerId` | `manager.id` | `string \| null` | 2-pass lookup | Lookup Person by `azureAdId` |

### Zod Validation Schema

```typescript
import { z } from 'zod';

export const GraphUserSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  givenName: z.string().nullable(),
  surname: z.string().nullable(),
  mail: z.string().email().nullable(),
  userPrincipalName: z.string(),
  businessPhones: z.array(z.string()).default([]),
  mobilePhone: z.string().nullable(),
  employeeId: z.string().nullable(),
  jobTitle: z.string().nullable(),
  department: z.string().nullable(),
  officeLocation: z.string().nullable(),
  accountEnabled: z.boolean(),
  employeeHireDate: z.string().datetime().nullable(),
});

export const GraphUsersResponseSchema = z.object({
  '@odata.context': z.string(),
  '@odata.nextLink': z.string().optional(),
  value: z.array(GraphUserSchema),
});

export type GraphUser = z.infer<typeof GraphUserSchema>;
```

### Transform Function

```typescript
interface PersonCreateInput {
  azureAdId: string;           // ⭐ Immutable source of truth
  firstName: string;
  lastName: string;
  email: string;               // Can change!
  phone: string | null;
  mobile: string | null;
  employeeId: string | null;
  title: string | null;
  department: string | null;
  office: string | null;       // Office location
  isActive: boolean;
  hireDate: Date | null;
  orgUnitId: string;
  primaryRoleId: string;
}

export function transformGraphUserToPerson(
  graphUser: GraphUser,
  defaults: { orgUnitId: string; primaryRoleId: string }
): PersonCreateInput {
  // Extract name parts
  const firstName = graphUser.givenName || graphUser.displayName.split(' ')[0] || 'Unknown';
  const lastName = graphUser.surname || graphUser.displayName.split(' ').slice(1).join(' ') || 'User';

  // Determine email (mail preferred, UPN fallback)
  const email = graphUser.mail || graphUser.userPrincipalName.split('#')[0].replace('_', '@');

  return {
    azureAdId: graphUser.id,   // ⭐ This is the stable identity key
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone: graphUser.businessPhones[0] || null,
    mobile: graphUser.mobilePhone,
    employeeId: graphUser.employeeId,
    title: graphUser.jobTitle,
    department: graphUser.department,
    office: graphUser.officeLocation,  // e.g. "India Office", "Riyadh HQ"
    isActive: graphUser.accountEnabled,
    hireDate: graphUser.employeeHireDate ? new Date(graphUser.employeeHireDate) : null,
    orgUnitId: defaults.orgUnitId,
    primaryRoleId: defaults.primaryRoleId,
  };
}
```

---

## TypeScript Implementation

### Graph Client Service

```typescript
// src/infrastructure/services/microsoft-graph.service.ts

import { ClientSecretCredential } from '@azure/identity';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { injectable } from 'inversify';

const SELECT_FIELDS = [
  'id',
  'givenName',
  'surname',
  'displayName',
  'mail',
  'userPrincipalName',
  'businessPhones',
  'mobilePhone',
  'employeeId',
  'jobTitle',
  'department',
  'officeLocation',
  'accountEnabled',
  'employeeHireDate',
].join(',');

@injectable()
export class MicrosoftGraphService {
  private client: Client;

  constructor() {
    const credential = new ClientSecretCredential(
      process.env.MICROSOFT_TENANT_ID!,
      process.env.MICROSOFT_CLIENT_ID!,
      process.env.MICROSOFT_CLIENT_SECRET!
    );

    this.client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken('https://graph.microsoft.com/.default');
          return token.token;
        },
      },
    });
  }

  /**
   * Fetch all users with pagination handling
   */
  async fetchAllUsers(options?: {
    includeDisabled?: boolean;
    includeGuests?: boolean;
  }): Promise<GraphUser[]> {
    const allUsers: GraphUser[] = [];
    let nextLink: string | undefined;

    // Build filter
    const filters: string[] = [];
    if (!options?.includeDisabled) {
      filters.push('accountEnabled eq true');
    }

    const filterQuery = filters.length > 0 ? filters.join(' and ') : undefined;

    // Initial request
    let request = this.client.api('/users').select(SELECT_FIELDS).top(999);
    if (filterQuery) {
      request = request.filter(filterQuery);
    }

    let response = await request.get();
    allUsers.push(...response.value);
    nextLink = response['@odata.nextLink'];

    // Handle pagination
    while (nextLink) {
      const pageResponse = await this.client.api(nextLink).get();
      allUsers.push(...pageResponse.value);
      nextLink = pageResponse['@odata.nextLink'];
    }

    // Filter out guests if needed
    if (!options?.includeGuests) {
      return allUsers.filter((user) => !user.userPrincipalName.includes('#EXT#'));
    }

    return allUsers;
  }

  /**
   * Fetch manager for a specific user
   */
  async fetchUserManager(userId: string): Promise<{ id: string } | null> {
    try {
      const manager = await this.client
        .api(`/users/${userId}/manager`)
        .select('id')
        .get();
      return manager;
    } catch (error: any) {
      // 404 = no manager assigned
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetch managers for all users (batch-optimized)
   */
  async fetchAllManagers(userIds: string[]): Promise<Map<string, string>> {
    const managerMap = new Map<string, string>();

    // Process in batches of 20 to avoid throttling
    const batchSize = 20;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (userId) => {
          const manager = await this.fetchUserManager(userId);
          if (manager) {
            managerMap.set(userId, manager.id);
          }
        })
      );

      // Rate limiting: pause between batches
      if (i + batchSize < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return managerMap;
  }
}
```

### Sync Use Case

```typescript
// src/use-cases/sync-users-from-graph.use-case.ts

import { inject, injectable } from 'inversify';
import { PrismaClient } from '@/generated/prisma';
import { MicrosoftGraphService } from '@/infrastructure/services/microsoft-graph.service';

interface SyncResult {
  created: number;
  updated: number;
  deactivated: number;
  errors: Array<{ azureAdId: string; error: string }>;
}

@injectable()
export class SyncUsersFromGraphUseCase {
  constructor(
    @inject('PrismaClient') private prisma: PrismaClient,
    @inject(MicrosoftGraphService) private graphService: MicrosoftGraphService
  ) {}

  async execute(): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, deactivated: 0, errors: [] };

    // Get default IDs for required fields
    const defaultOrgUnit = await this.prisma.organizationUnit.findFirstOrThrow({
      where: { name: 'Default' },
    });
    const viewerRole = await this.prisma.role.findFirstOrThrow({
      where: { name: 'viewer' },
    });

    // Pass 1: Fetch and sync all users
    console.log('Pass 1: Fetching users from Microsoft Graph...');
    const graphUsers = await this.graphService.fetchAllUsers();
    console.log(`Fetched ${graphUsers.length} users`);

    for (const graphUser of graphUsers) {
      try {
        const personData = transformGraphUserToPerson(graphUser, {
          orgUnitId: defaultOrgUnit.id,
          primaryRoleId: viewerRole.id,
        });

        // ⭐ UPSERT BY azureAdId - NOT email!
        // Email can change (marriage, rebranding), but Azure AD ID is immutable
        const existing = await this.prisma.person.findUnique({
          where: { azureAdId: personData.azureAdId },
        });

        if (existing) {
          // Update ALL fields including email (in case it changed)
          await this.prisma.person.update({
            where: { id: existing.id },
            data: {
              firstName: personData.firstName,
              lastName: personData.lastName,
              email: personData.email,        // ← Email CAN change!
              phone: personData.phone,
              mobile: personData.mobile,
              employeeId: personData.employeeId,
              title: personData.title,
              department: personData.department,
              office: personData.office,
              isActive: personData.isActive,
              hireDate: personData.hireDate,
            },
          });
          result.updated++;
        } else {
          await this.prisma.person.create({ data: personData });
          result.created++;
        }
      } catch (error: any) {
        result.errors.push({
          azureAdId: graphUser.id,
          error: error.message,
        });
      }
    }

    // Pass 2: Link managers (using azureAdId for lookups)
    console.log('Pass 2: Linking managers...');
    const graphUserIds = graphUsers.map((u) => u.id);
    const managerMap = await this.graphService.fetchAllManagers(graphUserIds);

    for (const [userAzureId, managerAzureId] of managerMap) {
      // Find both person and manager by their Azure AD IDs
      const person = await this.prisma.person.findUnique({
        where: { azureAdId: userAzureId },
      });

      const manager = await this.prisma.person.findUnique({
        where: { azureAdId: managerAzureId },
      });

      if (person && manager) {
        await this.prisma.person.update({
          where: { id: person.id },
          data: { managerId: manager.id },
        });
      }
    }

    // Pass 3: Deactivate users no longer in Graph (by azureAdId)
    console.log('Pass 3: Deactivating removed users...');
    const graphAzureIds = new Set(graphUsers.map((u) => u.id));

    const personsToDeactivate = await this.prisma.person.findMany({
      where: {
        isActive: true,
        azureAdId: { not: null },                              // Only Graph-synced users
        NOT: { azureAdId: { in: Array.from(graphAzureIds) } }, // Not in current Graph data
      },
    });

    for (const person of personsToDeactivate) {
      await this.prisma.person.update({
        where: { id: person.id },
        data: {
          isActive: false,
          terminationDate: new Date(),
        },
      });
      result.deactivated++;
    }

    return result;
  }
}
```

### Why azureAdId, Not Email?

```
┌────────────────────────────────────────────────────────────────────────┐
│  Scenario: Ahmed gets married and changes his email                    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Before:  ahmed.khan@barq.com                                         │
│  After:   ahmed.ali@barq.com                                          │
│                                                                        │
│  ❌ Sync by email:                                                     │
│     → Old record "ahmed.khan@barq.com" gets DEACTIVATED               │
│     → New record "ahmed.ali@barq.com" gets CREATED                    │
│     → Result: Duplicate person, lost history, broken references!       │
│                                                                        │
│  ✅ Sync by azureAdId:                                                 │
│     → Same record found by GUID "e9836314-ae4d-4283-9a34-..."        │
│     → Email field UPDATED to "ahmed.ali@barq.com"                     │
│     → Result: One person, email updated, history preserved!            │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## DI Registration

Register the Microsoft Graph service and sync use case in the InversifyJS container.

### Service Interface

```typescript
// src/core/services/microsoft-graph.service.interface.ts

import type { GraphUser } from '@/lib/schemas/graph-user.schema';

export interface IMicrosoftGraphService {
  fetchAllUsers(options?: {
    includeDisabled?: boolean;
    includeGuests?: boolean;
  }): Promise<GraphUser[]>;

  fetchUserManager(userId: string): Promise<{ id: string } | null>;

  fetchAllManagers(userIds: string[]): Promise<Map<string, string>>;
}

export const IMicrosoftGraphService = Symbol.for('IMicrosoftGraphService');
```

### DI Token Registration

```typescript
// src/infrastructure/di/tokens.ts

export const DI_TOKENS = {
  // ... existing tokens
  IMicrosoftGraphService: Symbol.for('IMicrosoftGraphService'),
  SyncUsersFromGraphUseCase: Symbol.for('SyncUsersFromGraphUseCase'),
};
```

### Container Bindings

```typescript
// src/infrastructure/di/container.ts

import { MicrosoftGraphService } from '@/infrastructure/services/microsoft-graph.service';
import { SyncUsersFromGraphUseCase } from '@/use-cases/person/sync-users-from-graph.use-case';
import { DI_TOKENS } from './tokens';

// Add to container configuration:
container
  .bind<IMicrosoftGraphService>(DI_TOKENS.IMicrosoftGraphService)
  .to(MicrosoftGraphService)
  .inSingletonScope();

container
  .bind<SyncUsersFromGraphUseCase>(DI_TOKENS.SyncUsersFromGraphUseCase)
  .to(SyncUsersFromGraphUseCase)
  .inRequestScope();
```

### RBAC Permission

Add new permission for sync operations:

```typescript
// src/lib/rbac/permissions.ts

export const PERMISSIONS = {
  // ... existing permissions
  PERSON_SYNC: 'person.sync',  // Trigger user sync from MS Graph
};
```

```typescript
// src/lib/rbac/permission-groups.ts

export const PERMISSION_GROUPS = {
  // ... existing groups
  PERSON: {
    // ... existing person permissions
    PERSON_SYNC: {
      name: 'person.sync',
      displayName: 'Sync Users from Microsoft Graph',
      description: 'Trigger synchronization of users from Microsoft Entra ID',
      resource: 'person',
      action: 'sync',
    },
  },
};
```

---

### BullMQ Job Definition

```typescript
// src/infrastructure/jobs/user-sync.job.ts

import { Queue, Worker, Job } from 'bullmq';
import { getContainer } from '@/infrastructure/di/container';
import { DI_TOKENS } from '@/infrastructure/di/tokens';
import type { SyncUsersFromGraphUseCase } from '@/use-cases/person/sync-users-from-graph.use-case';

const QUEUE_NAME = 'user-sync';

// Queue configuration
export const userSyncQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute initial delay
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

// Worker
export const userSyncWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    console.log(`Starting user sync job ${job.id}`);

    const container = getContainer();
    const useCase = container.get<SyncUsersFromGraphUseCase>(DI_TOKENS.SyncUsersFromGraphUseCase);
    const result = await useCase.execute();

    console.log('Sync completed:', result);
    return result;
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 1, // Only one sync at a time
  }
);

// Schedule daily sync
export async function scheduleUserSync() {
  await userSyncQueue.add(
    'daily-sync',
    {},
    {
      repeat: {
        pattern: '0 2 * * *', // 2 AM daily
        tz: 'Asia/Riyadh',
      },
    }
  );
}
```

---

## Sync Strategies

### Full Sync (Daily)

Best for overnight batch jobs:

```typescript
// Fetch all users, compare with database, update everything
const graphUsers = await graphService.fetchAllUsers();
```

### Delta Sync (Incremental)

For more frequent updates using Microsoft Graph delta queries:

```typescript
// First call - get initial state + delta link
const response = await client.api('/users/delta')
  .select(SELECT_FIELDS)
  .get();

// Store delta link for next sync
const deltaLink = response['@odata.deltaLink'];

// Subsequent calls - only get changes
const changes = await client.api(deltaLink).get();
```

### Webhook-Based (Real-time)

For real-time updates using Graph subscriptions:

```typescript
// Create subscription
await client.api('/subscriptions').post({
  changeType: 'created,updated,deleted',
  notificationUrl: 'https://your-app.com/api/webhooks/graph',
  resource: '/users',
  expirationDateTime: new Date(Date.now() + 4230 * 60000).toISOString(),
  clientState: 'secretKey123',
});
```

---

## Error Handling

### Graph API Error Codes

| Status | Code | Description | Action |
|--------|------|-------------|--------|
| 401 | `InvalidAuthenticationToken` | Token expired/invalid | Refresh token |
| 403 | `Authorization_RequestDenied` | Missing permission | Check app permissions |
| 404 | `Request_ResourceNotFound` | User/resource not found | Skip, log warning |
| 429 | `TooManyRequests` | Rate limited | Exponential backoff |
| 503 | `ServiceUnavailable` | Graph service issue | Retry with backoff |

### Retry Logic

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry 4xx errors (except 429)
      if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
```

### Sync Error Logging

```typescript
// Log errors to database for monitoring
model SyncLog {
  id        String   @id @default(cuid())
  jobId     String
  type      String   // 'user_sync'
  status    String   // 'success' | 'partial' | 'failed'
  created   Int
  updated   Int
  errors    Json[]
  startedAt DateTime
  finishedAt DateTime
  createdAt DateTime @default(now())
}
```

---

## Environment Variables

```env
# Microsoft Graph API
MICROSOFT_CLIENT_ID=5324f1e6-6ebf-4b6f-a0c9-d45d047ef17f
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_TENANT_ID=13826052-38a1-4044-856f-f6b6c1edf081

# Sync Configuration
GRAPH_SYNC_DEFAULT_ORG_UNIT_ID=cuid-of-default-org-unit
GRAPH_SYNC_VIEWER_ROLE_ID=cuid-of-viewer-role
GRAPH_SYNC_INCLUDE_GUESTS=false
GRAPH_SYNC_INCLUDE_DISABLED=false

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Testing

### Manual Sync Trigger

```typescript
// API route: POST /api/admin/sync-users
export async function POST(request: Request) {
  await requirePermission('admin.users.sync');

  const job = await userSyncQueue.add('manual-sync', {
    triggeredBy: 'admin',
  });

  return Response.json({ jobId: job.id });
}
```

### CLI Script

```bash
# Run sync manually
npx tsx scripts/sync-users.ts

# Check sync status
npx tsx scripts/check-sync-status.ts
```

---

## Monitoring

### Key Metrics

- **Sync Duration**: Time to complete full sync
- **Users Synced**: Count per sync run
- **Error Rate**: Percentage of failed user syncs
- **API Calls**: Graph API request count

### Alerts

- Sync job fails 3 times consecutively
- Error rate > 5%
- Sync takes > 30 minutes
- No sync completed in 48 hours

---

## Existing Data Backfill

If you have existing Person records without `azureAdId`, you need to backfill them before the sync can work properly.

### Strategy

1. **Match existing persons to Graph users by email**
2. **Set their `azureAdId` from the matched Graph user**
3. **Run normal sync for any remaining users**

### Backfill Script

```typescript
// scripts/backfill-azure-ad-ids.ts

import { prisma } from '@/infrastructure/database/prisma/client';
import { MicrosoftGraphService } from '@/infrastructure/services/microsoft-graph.service';

async function backfillAzureAdIds() {
  const graphService = new MicrosoftGraphService();

  console.log('Fetching all users from Microsoft Graph...');
  const graphUsers = await graphService.fetchAllUsers({ includeDisabled: true });
  console.log(`Fetched ${graphUsers.length} Graph users`);

  // Build email -> azureAdId lookup map
  const emailToAzureId = new Map<string, string>();
  for (const user of graphUsers) {
    const email = (user.mail || user.userPrincipalName).toLowerCase();
    emailToAzureId.set(email, user.id);
  }

  // Find all persons without azureAdId
  const personsWithoutAzureId = await prisma.person.findMany({
    where: { azureAdId: null },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  console.log(`Found ${personsWithoutAzureId.length} persons without azureAdId`);

  let matched = 0;
  let unmatched = 0;
  const unmatchedPersons: Array<{ id: string; email: string; name: string }> = [];

  for (const person of personsWithoutAzureId) {
    const normalizedEmail = person.email.toLowerCase();
    const azureAdId = emailToAzureId.get(normalizedEmail);

    if (azureAdId) {
      await prisma.person.update({
        where: { id: person.id },
        data: { azureAdId },
      });
      matched++;
      console.log(`✅ Matched: ${person.email} -> ${azureAdId}`);
    } else {
      unmatched++;
      unmatchedPersons.push({
        id: person.id,
        email: person.email,
        name: `${person.firstName} ${person.lastName}`,
      });
      console.log(`❌ No match: ${person.email}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Matched: ${matched}`);
  console.log(`Unmatched: ${unmatched}`);

  if (unmatchedPersons.length > 0) {
    console.log('\nUnmatched persons (may be local-only or terminated):');
    for (const p of unmatchedPersons) {
      console.log(`  - ${p.name} <${p.email}>`);
    }
  }

  await prisma.$disconnect();
}

backfillAzureAdIds().catch(console.error);
```

### Run Backfill

```bash
npx dotenv -e .env.local -- npx tsx scripts/backfill-azure-ad-ids.ts
```

### Handling Unmatched Records

Persons without a Graph match may be:

| Scenario | Action |
|----------|--------|
| **Terminated employees** | Leave as-is (no `azureAdId`), won't be affected by sync |
| **Local-only test users** | Leave as-is or delete if not needed |
| **Email mismatch** | Manually set `azureAdId` via Prisma Studio |
| **External contractors** | Leave as-is if not in AD, or add to AD |

> **Note**: Persons with `azureAdId = null` will NOT be touched by the sync job. The sync only updates/deactivates records that have an `azureAdId`.

---

## Summary: Files to Create

| File | Purpose |
|------|---------|
| `src/lib/schemas/graph-user.schema.ts` | Zod validation schemas |
| `src/core/services/microsoft-graph.service.interface.ts` | Service interface |
| `src/infrastructure/services/microsoft-graph.service.ts` | Graph API client |
| `src/use-cases/person/sync-users-from-graph.use-case.ts` | Sync business logic |
| `src/infrastructure/jobs/user-sync.job.ts` | BullMQ job definition |
| `src/app/api/admin/sync-users/route.ts` | Manual trigger API |
| `scripts/backfill-azure-ad-ids.ts` | One-time backfill script |
| `scripts/sync-users.ts` | CLI sync trigger |

---

## Quick Start Checklist

```bash
# 1. Install dependencies
npm install @azure/identity @microsoft/microsoft-graph-client

# 2. Update schema and migrate
# Edit schema.prisma to add azureAdId and office fields
npm run db:push
npm run db:generate

# 3. Set environment variables in .env.local
# MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID

# 4. Create the service and use case files (copy from this doc)

# 5. Backfill existing users
npx dotenv -e .env.local -- npx tsx scripts/backfill-azure-ad-ids.ts

# 6. Test sync manually
npx dotenv -e .env.local -- npx tsx scripts/sync-users.ts

# 7. Schedule daily job (in worker startup)
```

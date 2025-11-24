import { z } from "zod";
import { Prisma } from "@/generated/prisma";

type DbNull = typeof Prisma.NullTypes.DbNull;
type JsonNull = typeof Prisma.NullTypes.JsonNull;

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////

// JSON
//------------------------------------------------------

export type NullableJsonInput =
  | Prisma.JsonValue
  | null
  | "JsonNull"
  | "DbNull"
  | DbNull
  | JsonNull;

export const transformJsonNull = (v?: NullableJsonInput) => {
  if (!v || v === "DbNull") return Prisma.NullTypes.DbNull;
  if (v === "JsonNull") return Prisma.NullTypes.JsonNull;
  return v;
};

export const JsonValueSchema: z.ZodType<Prisma.JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.literal(null),
    z.record(
      z.string(),
      z.lazy(() => JsonValueSchema.optional()),
    ),
    z.array(z.lazy(() => JsonValueSchema)),
  ]),
);

export type JsonValueType = z.infer<typeof JsonValueSchema>;

export const NullableJsonValue = z
  .union([JsonValueSchema, z.literal("DbNull"), z.literal("JsonNull")])
  .nullable()
  .transform((v) => transformJsonNull(v));

export type NullableJsonValueType = z.infer<typeof NullableJsonValue>;

export const InputJsonValueSchema: z.ZodType<Prisma.InputJsonValue> = z.lazy(
  () =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.object({ toJSON: z.any() }),
      z.record(
        z.string(),
        z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)])),
      ),
      z.array(z.lazy(() => z.union([InputJsonValueSchema, z.literal(null)]))),
    ]),
);

export type InputJsonValueType = z.infer<typeof InputJsonValueSchema>;

/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum([
  "ReadUncommitted",
  "ReadCommitted",
  "RepeatableRead",
  "Serializable",
]);

export const UserScalarFieldEnumSchema = z.enum([
  "id",
  "email",
  "name",
  "image",
  "emailVerified",
  "createdAt",
  "updatedAt",
]);

export const AccountScalarFieldEnumSchema = z.enum([
  "id",
  "userId",
  "type",
  "provider",
  "providerAccountId",
  "refreshToken",
  "accessToken",
  "expiresAt",
  "tokenType",
  "scope",
  "idToken",
  "sessionState",
  "createdAt",
  "updatedAt",
]);

export const SessionScalarFieldEnumSchema = z.enum([
  "id",
  "sessionToken",
  "userId",
  "expires",
  "ipAddress",
  "userAgent",
  "createdAt",
  "updatedAt",
]);

export const VerificationScalarFieldEnumSchema = z.enum([
  "id",
  "identifier",
  "value",
  "expiresAt",
  "createdAt",
  "updatedAt",
]);

export const RoleScalarFieldEnumSchema = z.enum([
  "id",
  "name",
  "displayName",
  "description",
  "isSystem",
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
]);

export const PermissionScalarFieldEnumSchema = z.enum([
  "id",
  "name",
  "displayName",
  "description",
  "resource",
  "action",
  "isSystem",
  "isActive",
  "createdAt",
  "updatedAt",
]);

export const RolePermissionScalarFieldEnumSchema = z.enum([
  "id",
  "roleId",
  "permissionId",
  "createdAt",
]);

export const UserRoleScalarFieldEnumSchema = z.enum([
  "id",
  "userId",
  "roleId",
  "expiresAt",
  "createdAt",
  "createdBy",
]);

export const AuditLogScalarFieldEnumSchema = z.enum([
  "id",
  "userId",
  "action",
  "entityType",
  "entityId",
  "changes",
  "metadata",
  "ipAddress",
  "userAgent",
  "createdAt",
]);

export const TaskScalarFieldEnumSchema = z.enum([
  "id",
  "title",
  "description",
  "status",
  "createdBy",
  "createdAt",
  "updatedAt",
]);

export const PromptBlockScalarFieldEnumSchema = z.enum([
  "id",
  "name",
  "category",
  "content",
  "description",
  "metadata",
  "version",
  "isActive",
  "createdAt",
  "updatedAt",
  "parentBlockId",
]);

export const PromptCompositionScalarFieldEnumSchema = z.enum([
  "id",
  "name",
  "purpose",
  "description",
  "variables",
  "version",
  "isActive",
  "createdAt",
  "updatedAt",
]);

export const PromptCompositionBlockScalarFieldEnumSchema = z.enum([
  "id",
  "compositionId",
  "blockId",
  "order",
  "overrides",
]);

export const SortOrderSchema = z.enum(["asc", "desc"]);

export const NullableJsonNullValueInputSchema = z
  .enum(["DbNull", "JsonNull"])
  .transform((value) =>
    value === "JsonNull"
      ? Prisma.JsonNull
      : value === "DbNull"
        ? Prisma.DbNull
        : value,
  );

export const QueryModeSchema = z.enum(["default", "insensitive"]);

export const NullsOrderSchema = z.enum(["first", "last"]);

export const JsonNullValueFilterSchema = z
  .enum(["DbNull", "JsonNull", "AnyNull"])
  .transform((value) =>
    value === "JsonNull"
      ? Prisma.JsonNull
      : value === "DbNull"
        ? Prisma.DbNull
        : value === "AnyNull"
          ? Prisma.AnyNull
          : value,
  );

export const TaskStatusSchema = z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]);

export type TaskStatusType = `${z.infer<typeof TaskStatusSchema>}`;

export const PromptBlockCategorySchema = z.enum([
  "CORE_SYNTAX",
  "CONTENT_GUIDELINES",
  "VALIDATION",
  "ADVANCED_FEATURES",
]);

export type PromptBlockCategoryType =
  `${z.infer<typeof PromptBlockCategorySchema>}`;

export const PromptPurposeSchema = z.enum([
  "OUTLINE",
  "CONTENT",
  "THEME",
  "REVIEW",
  "REFINEMENT",
]);

export type PromptPurposeType = `${z.infer<typeof PromptPurposeSchema>}`;

/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  emailVerified: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// USER OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserOptionalDefaultsSchema = UserSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type UserOptionalDefaults = z.infer<typeof UserOptionalDefaultsSchema>;

// USER RELATION SCHEMA
//------------------------------------------------------

export type UserRelations = {
  accounts: AccountWithRelations[];
  sessions: SessionWithRelations[];
  roles: UserRoleWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations;

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> =
  UserSchema.merge(
    z.object({
      accounts: z.lazy(() => AccountWithRelationsSchema).array(),
      sessions: z.lazy(() => SessionWithRelationsSchema).array(),
      roles: z.lazy(() => UserRoleWithRelationsSchema).array(),
    }),
  );

// USER OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type UserOptionalDefaultsRelations = {
  accounts: AccountOptionalDefaultsWithRelations[];
  sessions: SessionOptionalDefaultsWithRelations[];
  roles: UserRoleOptionalDefaultsWithRelations[];
};

export type UserOptionalDefaultsWithRelations = z.infer<
  typeof UserOptionalDefaultsSchema
> &
  UserOptionalDefaultsRelations;

export const UserOptionalDefaultsWithRelationsSchema: z.ZodType<UserOptionalDefaultsWithRelations> =
  UserOptionalDefaultsSchema.merge(
    z.object({
      accounts: z
        .lazy(() => AccountOptionalDefaultsWithRelationsSchema)
        .array(),
      sessions: z
        .lazy(() => SessionOptionalDefaultsWithRelationsSchema)
        .array(),
      roles: z.lazy(() => UserRoleOptionalDefaultsWithRelationsSchema).array(),
    }),
  );

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  refreshToken: z.string().nullable(),
  accessToken: z.string().nullable(),
  expiresAt: z.coerce.date().nullable(),
  tokenType: z.string().nullable(),
  scope: z.string().nullable(),
  idToken: z.string().nullable(),
  sessionState: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Account = z.infer<typeof AccountSchema>;

// ACCOUNT OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AccountOptionalDefaultsSchema = AccountSchema.merge(
  z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type AccountOptionalDefaults = z.infer<
  typeof AccountOptionalDefaultsSchema
>;

// ACCOUNT RELATION SCHEMA
//------------------------------------------------------

export type AccountRelations = {
  user: UserWithRelations;
};

export type AccountWithRelations = z.infer<typeof AccountSchema> &
  AccountRelations;

export const AccountWithRelationsSchema: z.ZodType<AccountWithRelations> =
  AccountSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

// ACCOUNT OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type AccountOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type AccountOptionalDefaultsWithRelations = z.infer<
  typeof AccountOptionalDefaultsSchema
> &
  AccountOptionalDefaultsRelations;

export const AccountOptionalDefaultsWithRelationsSchema: z.ZodType<AccountOptionalDefaultsWithRelations> =
  AccountOptionalDefaultsSchema.merge(
    z.object({
      user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  sessionToken: z.string(),
  userId: z.string(),
  expires: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Session = z.infer<typeof SessionSchema>;

// SESSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const SessionOptionalDefaultsSchema = SessionSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type SessionOptionalDefaults = z.infer<
  typeof SessionOptionalDefaultsSchema
>;

// SESSION RELATION SCHEMA
//------------------------------------------------------

export type SessionRelations = {
  user: UserWithRelations;
};

export type SessionWithRelations = z.infer<typeof SessionSchema> &
  SessionRelations;

export const SessionWithRelationsSchema: z.ZodType<SessionWithRelations> =
  SessionSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema),
    }),
  );

// SESSION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type SessionOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
};

export type SessionOptionalDefaultsWithRelations = z.infer<
  typeof SessionOptionalDefaultsSchema
> &
  SessionOptionalDefaultsRelations;

export const SessionOptionalDefaultsWithRelationsSchema: z.ZodType<SessionOptionalDefaultsWithRelations> =
  SessionOptionalDefaultsSchema.merge(
    z.object({
      user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Verification = z.infer<typeof VerificationSchema>;

// VERIFICATION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const VerificationOptionalDefaultsSchema = VerificationSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type VerificationOptionalDefaults = z.infer<
  typeof VerificationOptionalDefaultsSchema
>;

/////////////////////////////////////////
// ROLE SCHEMA
/////////////////////////////////////////

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string().nullable(),
});

export type Role = z.infer<typeof RoleSchema>;

// ROLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const RoleOptionalDefaultsSchema = RoleSchema.merge(
  z.object({
    id: z.string().optional(),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type RoleOptionalDefaults = z.infer<typeof RoleOptionalDefaultsSchema>;

// ROLE RELATION SCHEMA
//------------------------------------------------------

export type RoleRelations = {
  permissions: RolePermissionWithRelations[];
  users: UserRoleWithRelations[];
};

export type RoleWithRelations = z.infer<typeof RoleSchema> & RoleRelations;

export const RoleWithRelationsSchema: z.ZodType<RoleWithRelations> =
  RoleSchema.merge(
    z.object({
      permissions: z.lazy(() => RolePermissionWithRelationsSchema).array(),
      users: z.lazy(() => UserRoleWithRelationsSchema).array(),
    }),
  );

// ROLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type RoleOptionalDefaultsRelations = {
  permissions: RolePermissionOptionalDefaultsWithRelations[];
  users: UserRoleOptionalDefaultsWithRelations[];
};

export type RoleOptionalDefaultsWithRelations = z.infer<
  typeof RoleOptionalDefaultsSchema
> &
  RoleOptionalDefaultsRelations;

export const RoleOptionalDefaultsWithRelationsSchema: z.ZodType<RoleOptionalDefaultsWithRelations> =
  RoleOptionalDefaultsSchema.merge(
    z.object({
      permissions: z
        .lazy(() => RolePermissionOptionalDefaultsWithRelationsSchema)
        .array(),
      users: z.lazy(() => UserRoleOptionalDefaultsWithRelationsSchema).array(),
    }),
  );

/////////////////////////////////////////
// PERMISSION SCHEMA
/////////////////////////////////////////

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  resource: z.string(),
  action: z.string(),
  isSystem: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Permission = z.infer<typeof PermissionSchema>;

// PERMISSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PermissionOptionalDefaultsSchema = PermissionSchema.merge(
  z.object({
    id: z.string().optional(),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type PermissionOptionalDefaults = z.infer<
  typeof PermissionOptionalDefaultsSchema
>;

// PERMISSION RELATION SCHEMA
//------------------------------------------------------

export type PermissionRelations = {
  roles: RolePermissionWithRelations[];
};

export type PermissionWithRelations = z.infer<typeof PermissionSchema> &
  PermissionRelations;

export const PermissionWithRelationsSchema: z.ZodType<PermissionWithRelations> =
  PermissionSchema.merge(
    z.object({
      roles: z.lazy(() => RolePermissionWithRelationsSchema).array(),
    }),
  );

// PERMISSION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PermissionOptionalDefaultsRelations = {
  roles: RolePermissionOptionalDefaultsWithRelations[];
};

export type PermissionOptionalDefaultsWithRelations = z.infer<
  typeof PermissionOptionalDefaultsSchema
> &
  PermissionOptionalDefaultsRelations;

export const PermissionOptionalDefaultsWithRelationsSchema: z.ZodType<PermissionOptionalDefaultsWithRelations> =
  PermissionOptionalDefaultsSchema.merge(
    z.object({
      roles: z
        .lazy(() => RolePermissionOptionalDefaultsWithRelationsSchema)
        .array(),
    }),
  );

/////////////////////////////////////////
// ROLE PERMISSION SCHEMA
/////////////////////////////////////////

export const RolePermissionSchema = z.object({
  id: z.string(),
  roleId: z.string(),
  permissionId: z.string(),
  createdAt: z.coerce.date(),
});

export type RolePermission = z.infer<typeof RolePermissionSchema>;

// ROLE PERMISSION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const RolePermissionOptionalDefaultsSchema = RolePermissionSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
  }),
);

export type RolePermissionOptionalDefaults = z.infer<
  typeof RolePermissionOptionalDefaultsSchema
>;

// ROLE PERMISSION RELATION SCHEMA
//------------------------------------------------------

export type RolePermissionRelations = {
  role: RoleWithRelations;
  permission: PermissionWithRelations;
};

export type RolePermissionWithRelations = z.infer<typeof RolePermissionSchema> &
  RolePermissionRelations;

export const RolePermissionWithRelationsSchema: z.ZodType<RolePermissionWithRelations> =
  RolePermissionSchema.merge(
    z.object({
      role: z.lazy(() => RoleWithRelationsSchema),
      permission: z.lazy(() => PermissionWithRelationsSchema),
    }),
  );

// ROLE PERMISSION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type RolePermissionOptionalDefaultsRelations = {
  role: RoleOptionalDefaultsWithRelations;
  permission: PermissionOptionalDefaultsWithRelations;
};

export type RolePermissionOptionalDefaultsWithRelations = z.infer<
  typeof RolePermissionOptionalDefaultsSchema
> &
  RolePermissionOptionalDefaultsRelations;

export const RolePermissionOptionalDefaultsWithRelationsSchema: z.ZodType<RolePermissionOptionalDefaultsWithRelations> =
  RolePermissionOptionalDefaultsSchema.merge(
    z.object({
      role: z.lazy(() => RoleOptionalDefaultsWithRelationsSchema),
      permission: z.lazy(() => PermissionOptionalDefaultsWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// USER ROLE SCHEMA
/////////////////////////////////////////

export const UserRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  createdBy: z.string().nullable(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;

// USER ROLE OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const UserRoleOptionalDefaultsSchema = UserRoleSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
  }),
);

export type UserRoleOptionalDefaults = z.infer<
  typeof UserRoleOptionalDefaultsSchema
>;

// USER ROLE RELATION SCHEMA
//------------------------------------------------------

export type UserRoleRelations = {
  user: UserWithRelations;
  role: RoleWithRelations;
};

export type UserRoleWithRelations = z.infer<typeof UserRoleSchema> &
  UserRoleRelations;

export const UserRoleWithRelationsSchema: z.ZodType<UserRoleWithRelations> =
  UserRoleSchema.merge(
    z.object({
      user: z.lazy(() => UserWithRelationsSchema),
      role: z.lazy(() => RoleWithRelationsSchema),
    }),
  );

// USER ROLE OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type UserRoleOptionalDefaultsRelations = {
  user: UserOptionalDefaultsWithRelations;
  role: RoleOptionalDefaultsWithRelations;
};

export type UserRoleOptionalDefaultsWithRelations = z.infer<
  typeof UserRoleOptionalDefaultsSchema
> &
  UserRoleOptionalDefaultsRelations;

export const UserRoleOptionalDefaultsWithRelationsSchema: z.ZodType<UserRoleOptionalDefaultsWithRelations> =
  UserRoleOptionalDefaultsSchema.merge(
    z.object({
      user: z.lazy(() => UserOptionalDefaultsWithRelationsSchema),
      role: z.lazy(() => RoleOptionalDefaultsWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// AUDIT LOG SCHEMA
/////////////////////////////////////////

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  changes: JsonValueSchema.nullable(),
  metadata: JsonValueSchema.nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// AUDIT LOG OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const AuditLogOptionalDefaultsSchema = AuditLogSchema.merge(
  z.object({
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
  }),
);

export type AuditLogOptionalDefaults = z.infer<
  typeof AuditLogOptionalDefaultsSchema
>;

/////////////////////////////////////////
// TASK SCHEMA
/////////////////////////////////////////

export const TaskSchema = z.object({
  status: TaskStatusSchema,
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Task = z.infer<typeof TaskSchema>;

// TASK OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const TaskOptionalDefaultsSchema = TaskSchema.merge(
  z.object({
    status: TaskStatusSchema.optional(),
    id: z.string().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type TaskOptionalDefaults = z.infer<typeof TaskOptionalDefaultsSchema>;

/////////////////////////////////////////
// PROMPT BLOCK SCHEMA
/////////////////////////////////////////

export const PromptBlockSchema = z.object({
  category: PromptBlockCategorySchema,
  id: z.string(),
  name: z.string(),
  content: z.string(),
  description: z.string().nullable(),
  metadata: JsonValueSchema.nullable(),
  version: z.number(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  parentBlockId: z.string().nullable(),
});

export type PromptBlock = z.infer<typeof PromptBlockSchema>;

// PROMPT BLOCK OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PromptBlockOptionalDefaultsSchema = PromptBlockSchema.merge(
  z.object({
    id: z.string().optional(),
    version: z.number().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  }),
);

export type PromptBlockOptionalDefaults = z.infer<
  typeof PromptBlockOptionalDefaultsSchema
>;

// PROMPT BLOCK RELATION SCHEMA
//------------------------------------------------------

export type PromptBlockRelations = {
  parentBlock?: PromptBlockWithRelations | null;
  childBlocks: PromptBlockWithRelations[];
  usedInCompositions: PromptCompositionBlockWithRelations[];
};

export type PromptBlockWithRelations = Omit<
  z.infer<typeof PromptBlockSchema>,
  "metadata"
> & {
  metadata?: JsonValueType | null;
} & PromptBlockRelations;

export const PromptBlockWithRelationsSchema: z.ZodType<PromptBlockWithRelations> =
  PromptBlockSchema.merge(
    z.object({
      parentBlock: z.lazy(() => PromptBlockWithRelationsSchema).nullable(),
      childBlocks: z.lazy(() => PromptBlockWithRelationsSchema).array(),
      usedInCompositions: z
        .lazy(() => PromptCompositionBlockWithRelationsSchema)
        .array(),
    }),
  );

// PROMPT BLOCK OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PromptBlockOptionalDefaultsRelations = {
  parentBlock?: PromptBlockOptionalDefaultsWithRelations | null;
  childBlocks: PromptBlockOptionalDefaultsWithRelations[];
  usedInCompositions: PromptCompositionBlockOptionalDefaultsWithRelations[];
};

export type PromptBlockOptionalDefaultsWithRelations = Omit<
  z.infer<typeof PromptBlockOptionalDefaultsSchema>,
  "metadata"
> & {
  metadata?: JsonValueType | null;
} & PromptBlockOptionalDefaultsRelations;

export const PromptBlockOptionalDefaultsWithRelationsSchema: z.ZodType<PromptBlockOptionalDefaultsWithRelations> =
  PromptBlockOptionalDefaultsSchema.merge(
    z.object({
      parentBlock: z
        .lazy(() => PromptBlockOptionalDefaultsWithRelationsSchema)
        .nullable(),
      childBlocks: z
        .lazy(() => PromptBlockOptionalDefaultsWithRelationsSchema)
        .array(),
      usedInCompositions: z
        .lazy(() => PromptCompositionBlockOptionalDefaultsWithRelationsSchema)
        .array(),
    }),
  );

/////////////////////////////////////////
// PROMPT COMPOSITION SCHEMA
/////////////////////////////////////////

export const PromptCompositionSchema = z.object({
  purpose: PromptPurposeSchema,
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  variables: JsonValueSchema.nullable(),
  version: z.number(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PromptComposition = z.infer<typeof PromptCompositionSchema>;

// PROMPT COMPOSITION OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PromptCompositionOptionalDefaultsSchema =
  PromptCompositionSchema.merge(
    z.object({
      id: z.string().optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    }),
  );

export type PromptCompositionOptionalDefaults = z.infer<
  typeof PromptCompositionOptionalDefaultsSchema
>;

// PROMPT COMPOSITION RELATION SCHEMA
//------------------------------------------------------

export type PromptCompositionRelations = {
  blocks: PromptCompositionBlockWithRelations[];
};

export type PromptCompositionWithRelations = Omit<
  z.infer<typeof PromptCompositionSchema>,
  "variables"
> & {
  variables?: JsonValueType | null;
} & PromptCompositionRelations;

export const PromptCompositionWithRelationsSchema: z.ZodType<PromptCompositionWithRelations> =
  PromptCompositionSchema.merge(
    z.object({
      blocks: z.lazy(() => PromptCompositionBlockWithRelationsSchema).array(),
    }),
  );

// PROMPT COMPOSITION OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PromptCompositionOptionalDefaultsRelations = {
  blocks: PromptCompositionBlockOptionalDefaultsWithRelations[];
};

export type PromptCompositionOptionalDefaultsWithRelations = Omit<
  z.infer<typeof PromptCompositionOptionalDefaultsSchema>,
  "variables"
> & {
  variables?: JsonValueType | null;
} & PromptCompositionOptionalDefaultsRelations;

export const PromptCompositionOptionalDefaultsWithRelationsSchema: z.ZodType<PromptCompositionOptionalDefaultsWithRelations> =
  PromptCompositionOptionalDefaultsSchema.merge(
    z.object({
      blocks: z
        .lazy(() => PromptCompositionBlockOptionalDefaultsWithRelationsSchema)
        .array(),
    }),
  );

/////////////////////////////////////////
// PROMPT COMPOSITION BLOCK SCHEMA
/////////////////////////////////////////

export const PromptCompositionBlockSchema = z.object({
  id: z.string(),
  compositionId: z.string(),
  blockId: z.string(),
  order: z.number(),
  overrides: JsonValueSchema.nullable(),
});

export type PromptCompositionBlock = z.infer<
  typeof PromptCompositionBlockSchema
>;

// PROMPT COMPOSITION BLOCK OPTIONAL DEFAULTS SCHEMA
//------------------------------------------------------

export const PromptCompositionBlockOptionalDefaultsSchema =
  PromptCompositionBlockSchema.merge(
    z.object({
      id: z.string().optional(),
    }),
  );

export type PromptCompositionBlockOptionalDefaults = z.infer<
  typeof PromptCompositionBlockOptionalDefaultsSchema
>;

// PROMPT COMPOSITION BLOCK RELATION SCHEMA
//------------------------------------------------------

export type PromptCompositionBlockRelations = {
  composition: PromptCompositionWithRelations;
  block: PromptBlockWithRelations;
};

export type PromptCompositionBlockWithRelations = Omit<
  z.infer<typeof PromptCompositionBlockSchema>,
  "overrides"
> & {
  overrides?: JsonValueType | null;
} & PromptCompositionBlockRelations;

export const PromptCompositionBlockWithRelationsSchema: z.ZodType<PromptCompositionBlockWithRelations> =
  PromptCompositionBlockSchema.merge(
    z.object({
      composition: z.lazy(() => PromptCompositionWithRelationsSchema),
      block: z.lazy(() => PromptBlockWithRelationsSchema),
    }),
  );

// PROMPT COMPOSITION BLOCK OPTIONAL DEFAULTS RELATION SCHEMA
//------------------------------------------------------

export type PromptCompositionBlockOptionalDefaultsRelations = {
  composition: PromptCompositionOptionalDefaultsWithRelations;
  block: PromptBlockOptionalDefaultsWithRelations;
};

export type PromptCompositionBlockOptionalDefaultsWithRelations = Omit<
  z.infer<typeof PromptCompositionBlockOptionalDefaultsSchema>,
  "overrides"
> & {
  overrides?: JsonValueType | null;
} & PromptCompositionBlockOptionalDefaultsRelations;

export const PromptCompositionBlockOptionalDefaultsWithRelationsSchema: z.ZodType<PromptCompositionBlockOptionalDefaultsWithRelations> =
  PromptCompositionBlockOptionalDefaultsSchema.merge(
    z.object({
      composition: z.lazy(
        () => PromptCompositionOptionalDefaultsWithRelationsSchema,
      ),
      block: z.lazy(() => PromptBlockOptionalDefaultsWithRelationsSchema),
    }),
  );

/////////////////////////////////////////
// SELECT & INCLUDE
/////////////////////////////////////////

// USER
//------------------------------------------------------

export const UserIncludeSchema: z.ZodType<Prisma.UserInclude> = z
  .object({
    accounts: z
      .union([z.boolean(), z.lazy(() => AccountFindManyArgsSchema)])
      .optional(),
    sessions: z
      .union([z.boolean(), z.lazy(() => SessionFindManyArgsSchema)])
      .optional(),
    roles: z
      .union([z.boolean(), z.lazy(() => UserRoleFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const UserArgsSchema: z.ZodType<Prisma.UserDefaultArgs> = z
  .object({
    select: z.lazy(() => UserSelectSchema).optional(),
    include: z.lazy(() => UserIncludeSchema).optional(),
  })
  .strict();

export const UserCountOutputTypeArgsSchema: z.ZodType<Prisma.UserCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => UserCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const UserCountOutputTypeSelectSchema: z.ZodType<Prisma.UserCountOutputTypeSelect> =
  z
    .object({
      accounts: z.boolean().optional(),
      sessions: z.boolean().optional(),
      roles: z.boolean().optional(),
    })
    .strict();

export const UserSelectSchema: z.ZodType<Prisma.UserSelect> = z
  .object({
    id: z.boolean().optional(),
    email: z.boolean().optional(),
    name: z.boolean().optional(),
    image: z.boolean().optional(),
    emailVerified: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    accounts: z
      .union([z.boolean(), z.lazy(() => AccountFindManyArgsSchema)])
      .optional(),
    sessions: z
      .union([z.boolean(), z.lazy(() => SessionFindManyArgsSchema)])
      .optional(),
    roles: z
      .union([z.boolean(), z.lazy(() => UserRoleFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => UserCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// ACCOUNT
//------------------------------------------------------

export const AccountIncludeSchema: z.ZodType<Prisma.AccountInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const AccountArgsSchema: z.ZodType<Prisma.AccountDefaultArgs> = z
  .object({
    select: z.lazy(() => AccountSelectSchema).optional(),
    include: z.lazy(() => AccountIncludeSchema).optional(),
  })
  .strict();

export const AccountSelectSchema: z.ZodType<Prisma.AccountSelect> = z
  .object({
    id: z.boolean().optional(),
    userId: z.boolean().optional(),
    type: z.boolean().optional(),
    provider: z.boolean().optional(),
    providerAccountId: z.boolean().optional(),
    refreshToken: z.boolean().optional(),
    accessToken: z.boolean().optional(),
    expiresAt: z.boolean().optional(),
    tokenType: z.boolean().optional(),
    scope: z.boolean().optional(),
    idToken: z.boolean().optional(),
    sessionState: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// SESSION
//------------------------------------------------------

export const SessionIncludeSchema: z.ZodType<Prisma.SessionInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

export const SessionArgsSchema: z.ZodType<Prisma.SessionDefaultArgs> = z
  .object({
    select: z.lazy(() => SessionSelectSchema).optional(),
    include: z.lazy(() => SessionIncludeSchema).optional(),
  })
  .strict();

export const SessionSelectSchema: z.ZodType<Prisma.SessionSelect> = z
  .object({
    id: z.boolean().optional(),
    sessionToken: z.boolean().optional(),
    userId: z.boolean().optional(),
    expires: z.boolean().optional(),
    ipAddress: z.boolean().optional(),
    userAgent: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
  })
  .strict();

// VERIFICATION
//------------------------------------------------------

export const VerificationSelectSchema: z.ZodType<Prisma.VerificationSelect> = z
  .object({
    id: z.boolean().optional(),
    identifier: z.boolean().optional(),
    value: z.boolean().optional(),
    expiresAt: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
  })
  .strict();

// ROLE
//------------------------------------------------------

export const RoleIncludeSchema: z.ZodType<Prisma.RoleInclude> = z
  .object({
    permissions: z
      .union([z.boolean(), z.lazy(() => RolePermissionFindManyArgsSchema)])
      .optional(),
    users: z
      .union([z.boolean(), z.lazy(() => UserRoleFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => RoleCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const RoleArgsSchema: z.ZodType<Prisma.RoleDefaultArgs> = z
  .object({
    select: z.lazy(() => RoleSelectSchema).optional(),
    include: z.lazy(() => RoleIncludeSchema).optional(),
  })
  .strict();

export const RoleCountOutputTypeArgsSchema: z.ZodType<Prisma.RoleCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => RoleCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const RoleCountOutputTypeSelectSchema: z.ZodType<Prisma.RoleCountOutputTypeSelect> =
  z
    .object({
      permissions: z.boolean().optional(),
      users: z.boolean().optional(),
    })
    .strict();

export const RoleSelectSchema: z.ZodType<Prisma.RoleSelect> = z
  .object({
    id: z.boolean().optional(),
    name: z.boolean().optional(),
    displayName: z.boolean().optional(),
    description: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    createdBy: z.boolean().optional(),
    permissions: z
      .union([z.boolean(), z.lazy(() => RolePermissionFindManyArgsSchema)])
      .optional(),
    users: z
      .union([z.boolean(), z.lazy(() => UserRoleFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => RoleCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// PERMISSION
//------------------------------------------------------

export const PermissionIncludeSchema: z.ZodType<Prisma.PermissionInclude> = z
  .object({
    roles: z
      .union([z.boolean(), z.lazy(() => RolePermissionFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => PermissionCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const PermissionArgsSchema: z.ZodType<Prisma.PermissionDefaultArgs> = z
  .object({
    select: z.lazy(() => PermissionSelectSchema).optional(),
    include: z.lazy(() => PermissionIncludeSchema).optional(),
  })
  .strict();

export const PermissionCountOutputTypeArgsSchema: z.ZodType<Prisma.PermissionCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PermissionCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const PermissionCountOutputTypeSelectSchema: z.ZodType<Prisma.PermissionCountOutputTypeSelect> =
  z
    .object({
      roles: z.boolean().optional(),
    })
    .strict();

export const PermissionSelectSchema: z.ZodType<Prisma.PermissionSelect> = z
  .object({
    id: z.boolean().optional(),
    name: z.boolean().optional(),
    displayName: z.boolean().optional(),
    description: z.boolean().optional(),
    resource: z.boolean().optional(),
    action: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    roles: z
      .union([z.boolean(), z.lazy(() => RolePermissionFindManyArgsSchema)])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => PermissionCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// ROLE PERMISSION
//------------------------------------------------------

export const RolePermissionIncludeSchema: z.ZodType<Prisma.RolePermissionInclude> =
  z
    .object({
      role: z.union([z.boolean(), z.lazy(() => RoleArgsSchema)]).optional(),
      permission: z
        .union([z.boolean(), z.lazy(() => PermissionArgsSchema)])
        .optional(),
    })
    .strict();

export const RolePermissionArgsSchema: z.ZodType<Prisma.RolePermissionDefaultArgs> =
  z
    .object({
      select: z.lazy(() => RolePermissionSelectSchema).optional(),
      include: z.lazy(() => RolePermissionIncludeSchema).optional(),
    })
    .strict();

export const RolePermissionSelectSchema: z.ZodType<Prisma.RolePermissionSelect> =
  z
    .object({
      id: z.boolean().optional(),
      roleId: z.boolean().optional(),
      permissionId: z.boolean().optional(),
      createdAt: z.boolean().optional(),
      role: z.union([z.boolean(), z.lazy(() => RoleArgsSchema)]).optional(),
      permission: z
        .union([z.boolean(), z.lazy(() => PermissionArgsSchema)])
        .optional(),
    })
    .strict();

// USER ROLE
//------------------------------------------------------

export const UserRoleIncludeSchema: z.ZodType<Prisma.UserRoleInclude> = z
  .object({
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
    role: z.union([z.boolean(), z.lazy(() => RoleArgsSchema)]).optional(),
  })
  .strict();

export const UserRoleArgsSchema: z.ZodType<Prisma.UserRoleDefaultArgs> = z
  .object({
    select: z.lazy(() => UserRoleSelectSchema).optional(),
    include: z.lazy(() => UserRoleIncludeSchema).optional(),
  })
  .strict();

export const UserRoleSelectSchema: z.ZodType<Prisma.UserRoleSelect> = z
  .object({
    id: z.boolean().optional(),
    userId: z.boolean().optional(),
    roleId: z.boolean().optional(),
    expiresAt: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    createdBy: z.boolean().optional(),
    user: z.union([z.boolean(), z.lazy(() => UserArgsSchema)]).optional(),
    role: z.union([z.boolean(), z.lazy(() => RoleArgsSchema)]).optional(),
  })
  .strict();

// AUDIT LOG
//------------------------------------------------------

export const AuditLogSelectSchema: z.ZodType<Prisma.AuditLogSelect> = z
  .object({
    id: z.boolean().optional(),
    userId: z.boolean().optional(),
    action: z.boolean().optional(),
    entityType: z.boolean().optional(),
    entityId: z.boolean().optional(),
    changes: z.boolean().optional(),
    metadata: z.boolean().optional(),
    ipAddress: z.boolean().optional(),
    userAgent: z.boolean().optional(),
    createdAt: z.boolean().optional(),
  })
  .strict();

// TASK
//------------------------------------------------------

export const TaskSelectSchema: z.ZodType<Prisma.TaskSelect> = z
  .object({
    id: z.boolean().optional(),
    title: z.boolean().optional(),
    description: z.boolean().optional(),
    status: z.boolean().optional(),
    createdBy: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
  })
  .strict();

// PROMPT BLOCK
//------------------------------------------------------

export const PromptBlockIncludeSchema: z.ZodType<Prisma.PromptBlockInclude> = z
  .object({
    parentBlock: z
      .union([z.boolean(), z.lazy(() => PromptBlockArgsSchema)])
      .optional(),
    childBlocks: z
      .union([z.boolean(), z.lazy(() => PromptBlockFindManyArgsSchema)])
      .optional(),
    usedInCompositions: z
      .union([
        z.boolean(),
        z.lazy(() => PromptCompositionBlockFindManyArgsSchema),
      ])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => PromptBlockCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

export const PromptBlockArgsSchema: z.ZodType<Prisma.PromptBlockDefaultArgs> = z
  .object({
    select: z.lazy(() => PromptBlockSelectSchema).optional(),
    include: z.lazy(() => PromptBlockIncludeSchema).optional(),
  })
  .strict();

export const PromptBlockCountOutputTypeArgsSchema: z.ZodType<Prisma.PromptBlockCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PromptBlockCountOutputTypeSelectSchema).nullish(),
    })
    .strict();

export const PromptBlockCountOutputTypeSelectSchema: z.ZodType<Prisma.PromptBlockCountOutputTypeSelect> =
  z
    .object({
      childBlocks: z.boolean().optional(),
      usedInCompositions: z.boolean().optional(),
    })
    .strict();

export const PromptBlockSelectSchema: z.ZodType<Prisma.PromptBlockSelect> = z
  .object({
    id: z.boolean().optional(),
    name: z.boolean().optional(),
    category: z.boolean().optional(),
    content: z.boolean().optional(),
    description: z.boolean().optional(),
    metadata: z.boolean().optional(),
    version: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.boolean().optional(),
    updatedAt: z.boolean().optional(),
    parentBlockId: z.boolean().optional(),
    parentBlock: z
      .union([z.boolean(), z.lazy(() => PromptBlockArgsSchema)])
      .optional(),
    childBlocks: z
      .union([z.boolean(), z.lazy(() => PromptBlockFindManyArgsSchema)])
      .optional(),
    usedInCompositions: z
      .union([
        z.boolean(),
        z.lazy(() => PromptCompositionBlockFindManyArgsSchema),
      ])
      .optional(),
    _count: z
      .union([z.boolean(), z.lazy(() => PromptBlockCountOutputTypeArgsSchema)])
      .optional(),
  })
  .strict();

// PROMPT COMPOSITION
//------------------------------------------------------

export const PromptCompositionIncludeSchema: z.ZodType<Prisma.PromptCompositionInclude> =
  z
    .object({
      blocks: z
        .union([
          z.boolean(),
          z.lazy(() => PromptCompositionBlockFindManyArgsSchema),
        ])
        .optional(),
      _count: z
        .union([
          z.boolean(),
          z.lazy(() => PromptCompositionCountOutputTypeArgsSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionArgsSchema: z.ZodType<Prisma.PromptCompositionDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PromptCompositionSelectSchema).optional(),
      include: z.lazy(() => PromptCompositionIncludeSchema).optional(),
    })
    .strict();

export const PromptCompositionCountOutputTypeArgsSchema: z.ZodType<Prisma.PromptCompositionCountOutputTypeDefaultArgs> =
  z
    .object({
      select: z
        .lazy(() => PromptCompositionCountOutputTypeSelectSchema)
        .nullish(),
    })
    .strict();

export const PromptCompositionCountOutputTypeSelectSchema: z.ZodType<Prisma.PromptCompositionCountOutputTypeSelect> =
  z
    .object({
      blocks: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionSelectSchema: z.ZodType<Prisma.PromptCompositionSelect> =
  z
    .object({
      id: z.boolean().optional(),
      name: z.boolean().optional(),
      purpose: z.boolean().optional(),
      description: z.boolean().optional(),
      variables: z.boolean().optional(),
      version: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.boolean().optional(),
      updatedAt: z.boolean().optional(),
      blocks: z
        .union([
          z.boolean(),
          z.lazy(() => PromptCompositionBlockFindManyArgsSchema),
        ])
        .optional(),
      _count: z
        .union([
          z.boolean(),
          z.lazy(() => PromptCompositionCountOutputTypeArgsSchema),
        ])
        .optional(),
    })
    .strict();

// PROMPT COMPOSITION BLOCK
//------------------------------------------------------

export const PromptCompositionBlockIncludeSchema: z.ZodType<Prisma.PromptCompositionBlockInclude> =
  z
    .object({
      composition: z
        .union([z.boolean(), z.lazy(() => PromptCompositionArgsSchema)])
        .optional(),
      block: z
        .union([z.boolean(), z.lazy(() => PromptBlockArgsSchema)])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockArgsSchema: z.ZodType<Prisma.PromptCompositionBlockDefaultArgs> =
  z
    .object({
      select: z.lazy(() => PromptCompositionBlockSelectSchema).optional(),
      include: z.lazy(() => PromptCompositionBlockIncludeSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockSelectSchema: z.ZodType<Prisma.PromptCompositionBlockSelect> =
  z
    .object({
      id: z.boolean().optional(),
      compositionId: z.boolean().optional(),
      blockId: z.boolean().optional(),
      order: z.boolean().optional(),
      overrides: z.boolean().optional(),
      composition: z
        .union([z.boolean(), z.lazy(() => PromptCompositionArgsSchema)])
        .optional(),
      block: z
        .union([z.boolean(), z.lazy(() => PromptBlockArgsSchema)])
        .optional(),
    })
    .strict();

/////////////////////////////////////////
// INPUT TYPES
/////////////////////////////////////////

export const UserWhereInputSchema: z.ZodType<Prisma.UserWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => UserWhereInputSchema),
        z.lazy(() => UserWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => UserWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => UserWhereInputSchema),
        z.lazy(() => UserWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    email: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    name: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    image: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    emailVerified: z
      .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
    sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
    roles: z.lazy(() => UserRoleListRelationFilterSchema).optional(),
  })
  .strict();

export const UserOrderByWithRelationInputSchema: z.ZodType<Prisma.UserOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      email: z.lazy(() => SortOrderSchema).optional(),
      name: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      image: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      emailVerified: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      accounts: z
        .lazy(() => AccountOrderByRelationAggregateInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionOrderByRelationAggregateInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleOrderByRelationAggregateInputSchema)
        .optional(),
    })
    .strict();

export const UserWhereUniqueInputSchema: z.ZodType<Prisma.UserWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        email: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        email: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          email: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => UserWhereInputSchema),
              z.lazy(() => UserWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => UserWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => UserWhereInputSchema),
              z.lazy(() => UserWhereInputSchema).array(),
            ])
            .optional(),
          name: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          image: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          emailVerified: z
            .union([
              z.lazy(() => DateTimeNullableFilterSchema),
              z.coerce.date(),
            ])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          accounts: z.lazy(() => AccountListRelationFilterSchema).optional(),
          sessions: z.lazy(() => SessionListRelationFilterSchema).optional(),
          roles: z.lazy(() => UserRoleListRelationFilterSchema).optional(),
        })
        .strict(),
    );

export const UserOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      email: z.lazy(() => SortOrderSchema).optional(),
      name: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      image: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      emailVerified: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z.lazy(() => UserCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => UserMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => UserMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const UserScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => UserScalarWhereWithAggregatesInputSchema),
          z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => UserScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => UserScalarWhereWithAggregatesInputSchema),
          z.lazy(() => UserScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      email: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      name: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const AccountWhereInputSchema: z.ZodType<Prisma.AccountWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => AccountWhereInputSchema),
        z.lazy(() => AccountWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => AccountWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => AccountWhereInputSchema),
        z.lazy(() => AccountWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    type: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    provider: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    providerAccountId: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    refreshToken: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    accessToken: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    expiresAt: z
      .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
      .optional()
      .nullable(),
    tokenType: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    scope: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    idToken: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    sessionState: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  })
  .strict();

export const AccountOrderByWithRelationInputSchema: z.ZodType<Prisma.AccountOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      provider: z.lazy(() => SortOrderSchema).optional(),
      providerAccountId: z.lazy(() => SortOrderSchema).optional(),
      refreshToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      accessToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      tokenType: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      scope: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      idToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      sessionState: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
    })
    .strict();

export const AccountWhereUniqueInputSchema: z.ZodType<Prisma.AccountWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        provider_providerAccountId: z.lazy(
          () => AccountProviderProviderAccountIdCompoundUniqueInputSchema,
        ),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        provider_providerAccountId: z.lazy(
          () => AccountProviderProviderAccountIdCompoundUniqueInputSchema,
        ),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          provider_providerAccountId: z
            .lazy(
              () => AccountProviderProviderAccountIdCompoundUniqueInputSchema,
            )
            .optional(),
          AND: z
            .union([
              z.lazy(() => AccountWhereInputSchema),
              z.lazy(() => AccountWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => AccountWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => AccountWhereInputSchema),
              z.lazy(() => AccountWhereInputSchema).array(),
            ])
            .optional(),
          userId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          type: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          provider: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          providerAccountId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          refreshToken: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          accessToken: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          expiresAt: z
            .union([
              z.lazy(() => DateTimeNullableFilterSchema),
              z.coerce.date(),
            ])
            .optional()
            .nullable(),
          tokenType: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          scope: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          idToken: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          sessionState: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          user: z
            .union([
              z.lazy(() => UserScalarRelationFilterSchema),
              z.lazy(() => UserWhereInputSchema),
            ])
            .optional(),
        })
        .strict(),
    );

export const AccountOrderByWithAggregationInputSchema: z.ZodType<Prisma.AccountOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      provider: z.lazy(() => SortOrderSchema).optional(),
      providerAccountId: z.lazy(() => SortOrderSchema).optional(),
      refreshToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      accessToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      tokenType: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      scope: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      idToken: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      sessionState: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z.lazy(() => AccountCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => AccountMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => AccountMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const AccountScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AccountScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => AccountScalarWhereWithAggregatesInputSchema),
          z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => AccountScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => AccountScalarWhereWithAggregatesInputSchema),
          z.lazy(() => AccountScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      userId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      type: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      provider: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      providerAccountId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      refreshToken: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const SessionWhereInputSchema: z.ZodType<Prisma.SessionWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => SessionWhereInputSchema),
        z.lazy(() => SessionWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => SessionWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => SessionWhereInputSchema),
        z.lazy(() => SessionWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    sessionToken: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    userId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    expires: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    ipAddress: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    userAgent: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
  })
  .strict();

export const SessionOrderByWithRelationInputSchema: z.ZodType<Prisma.SessionOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      sessionToken: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      expires: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      userAgent: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
    })
    .strict();

export const SessionWhereUniqueInputSchema: z.ZodType<Prisma.SessionWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        sessionToken: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        sessionToken: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          sessionToken: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => SessionWhereInputSchema),
              z.lazy(() => SessionWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => SessionWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => SessionWhereInputSchema),
              z.lazy(() => SessionWhereInputSchema).array(),
            ])
            .optional(),
          userId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          expires: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          ipAddress: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          userAgent: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          user: z
            .union([
              z.lazy(() => UserScalarRelationFilterSchema),
              z.lazy(() => UserWhereInputSchema),
            ])
            .optional(),
        })
        .strict(),
    );

export const SessionOrderByWithAggregationInputSchema: z.ZodType<Prisma.SessionOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      sessionToken: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      expires: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      userAgent: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z.lazy(() => SessionCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => SessionMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => SessionMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const SessionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.SessionScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => SessionScalarWhereWithAggregatesInputSchema),
          z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => SessionScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => SessionScalarWhereWithAggregatesInputSchema),
          z.lazy(() => SessionScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      sessionToken: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      userId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      expires: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const VerificationWhereInputSchema: z.ZodType<Prisma.VerificationWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => VerificationWhereInputSchema),
          z.lazy(() => VerificationWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => VerificationWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => VerificationWhereInputSchema),
          z.lazy(() => VerificationWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      identifier: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      value: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      expiresAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    })
    .strict();

export const VerificationOrderByWithRelationInputSchema: z.ZodType<Prisma.VerificationOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      identifier: z.lazy(() => SortOrderSchema).optional(),
      value: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const VerificationWhereUniqueInputSchema: z.ZodType<Prisma.VerificationWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        identifier: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        identifier: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          identifier: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => VerificationWhereInputSchema),
              z.lazy(() => VerificationWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => VerificationWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => VerificationWhereInputSchema),
              z.lazy(() => VerificationWhereInputSchema).array(),
            ])
            .optional(),
          value: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          expiresAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
        })
        .strict(),
    );

export const VerificationOrderByWithAggregationInputSchema: z.ZodType<Prisma.VerificationOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      identifier: z.lazy(() => SortOrderSchema).optional(),
      value: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => VerificationCountOrderByAggregateInputSchema)
        .optional(),
      _max: z.lazy(() => VerificationMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => VerificationMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const VerificationScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.VerificationScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => VerificationScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => VerificationScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => VerificationScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => VerificationScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      identifier: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      value: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      expiresAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const RoleWhereInputSchema: z.ZodType<Prisma.RoleWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => RoleWhereInputSchema),
        z.lazy(() => RoleWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => RoleWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => RoleWhereInputSchema),
        z.lazy(() => RoleWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    displayName: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    isSystem: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    isActive: z.union([z.lazy(() => BoolFilterSchema), z.boolean()]).optional(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    createdBy: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    permissions: z
      .lazy(() => RolePermissionListRelationFilterSchema)
      .optional(),
    users: z.lazy(() => UserRoleListRelationFilterSchema).optional(),
  })
  .strict();

export const RoleOrderByWithRelationInputSchema: z.ZodType<Prisma.RoleOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      permissions: z
        .lazy(() => RolePermissionOrderByRelationAggregateInputSchema)
        .optional(),
      users: z
        .lazy(() => UserRoleOrderByRelationAggregateInputSchema)
        .optional(),
    })
    .strict();

export const RoleWhereUniqueInputSchema: z.ZodType<Prisma.RoleWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        name: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        name: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          name: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => RoleWhereInputSchema),
              z.lazy(() => RoleWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => RoleWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => RoleWhereInputSchema),
              z.lazy(() => RoleWhereInputSchema).array(),
            ])
            .optional(),
          displayName: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          description: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          isSystem: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          isActive: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          createdBy: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          permissions: z
            .lazy(() => RolePermissionListRelationFilterSchema)
            .optional(),
          users: z.lazy(() => UserRoleListRelationFilterSchema).optional(),
        })
        .strict(),
    );

export const RoleOrderByWithAggregationInputSchema: z.ZodType<Prisma.RoleOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      _count: z.lazy(() => RoleCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => RoleMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => RoleMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const RoleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RoleScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => RoleScalarWhereWithAggregatesInputSchema),
          z.lazy(() => RoleScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => RoleScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => RoleScalarWhereWithAggregatesInputSchema),
          z.lazy(() => RoleScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      name: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      displayName: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      description: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      isActive: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      createdBy: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const PermissionWhereInputSchema: z.ZodType<Prisma.PermissionWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PermissionWhereInputSchema),
          z.lazy(() => PermissionWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PermissionWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PermissionWhereInputSchema),
          z.lazy(() => PermissionWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      displayName: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      description: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      resource: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      action: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      isSystem: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
      isActive: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      roles: z.lazy(() => RolePermissionListRelationFilterSchema).optional(),
    })
    .strict();

export const PermissionOrderByWithRelationInputSchema: z.ZodType<Prisma.PermissionOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      resource: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      roles: z
        .lazy(() => RolePermissionOrderByRelationAggregateInputSchema)
        .optional(),
    })
    .strict();

export const PermissionWhereUniqueInputSchema: z.ZodType<Prisma.PermissionWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        name: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        name: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          name: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => PermissionWhereInputSchema),
              z.lazy(() => PermissionWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => PermissionWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => PermissionWhereInputSchema),
              z.lazy(() => PermissionWhereInputSchema).array(),
            ])
            .optional(),
          displayName: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          description: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          resource: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          action: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          isSystem: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          isActive: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          roles: z
            .lazy(() => RolePermissionListRelationFilterSchema)
            .optional(),
        })
        .strict(),
    );

export const PermissionOrderByWithAggregationInputSchema: z.ZodType<Prisma.PermissionOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      resource: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => PermissionCountOrderByAggregateInputSchema)
        .optional(),
      _max: z.lazy(() => PermissionMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => PermissionMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const PermissionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PermissionScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema),
          z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PermissionScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema),
          z.lazy(() => PermissionScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      name: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      displayName: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      description: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      action: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      isSystem: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      isActive: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionWhereInputSchema: z.ZodType<Prisma.RolePermissionWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => RolePermissionWhereInputSchema),
          z.lazy(() => RolePermissionWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => RolePermissionWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => RolePermissionWhereInputSchema),
          z.lazy(() => RolePermissionWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      roleId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      permissionId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      role: z
        .union([
          z.lazy(() => RoleScalarRelationFilterSchema),
          z.lazy(() => RoleWhereInputSchema),
        ])
        .optional(),
      permission: z
        .union([
          z.lazy(() => PermissionScalarRelationFilterSchema),
          z.lazy(() => PermissionWhereInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionOrderByWithRelationInputSchema: z.ZodType<Prisma.RolePermissionOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      permissionId: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      role: z.lazy(() => RoleOrderByWithRelationInputSchema).optional(),
      permission: z
        .lazy(() => PermissionOrderByWithRelationInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionWhereUniqueInputSchema: z.ZodType<Prisma.RolePermissionWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        roleId_permissionId: z.lazy(
          () => RolePermissionRoleIdPermissionIdCompoundUniqueInputSchema,
        ),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        roleId_permissionId: z.lazy(
          () => RolePermissionRoleIdPermissionIdCompoundUniqueInputSchema,
        ),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          roleId_permissionId: z
            .lazy(
              () => RolePermissionRoleIdPermissionIdCompoundUniqueInputSchema,
            )
            .optional(),
          AND: z
            .union([
              z.lazy(() => RolePermissionWhereInputSchema),
              z.lazy(() => RolePermissionWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => RolePermissionWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => RolePermissionWhereInputSchema),
              z.lazy(() => RolePermissionWhereInputSchema).array(),
            ])
            .optional(),
          roleId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          permissionId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          role: z
            .union([
              z.lazy(() => RoleScalarRelationFilterSchema),
              z.lazy(() => RoleWhereInputSchema),
            ])
            .optional(),
          permission: z
            .union([
              z.lazy(() => PermissionScalarRelationFilterSchema),
              z.lazy(() => PermissionWhereInputSchema),
            ])
            .optional(),
        })
        .strict(),
    );

export const RolePermissionOrderByWithAggregationInputSchema: z.ZodType<Prisma.RolePermissionOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      permissionId: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => RolePermissionCountOrderByAggregateInputSchema)
        .optional(),
      _max: z
        .lazy(() => RolePermissionMaxOrderByAggregateInputSchema)
        .optional(),
      _min: z
        .lazy(() => RolePermissionMinOrderByAggregateInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.RolePermissionScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => RolePermissionScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => RolePermissionScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => RolePermissionScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => RolePermissionScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => RolePermissionScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      roleId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      permissionId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleWhereInputSchema: z.ZodType<Prisma.UserRoleWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => UserRoleWhereInputSchema),
        z.lazy(() => UserRoleWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => UserRoleWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => UserRoleWhereInputSchema),
        z.lazy(() => UserRoleWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    roleId: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    expiresAt: z
      .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    createdBy: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    user: z
      .union([
        z.lazy(() => UserScalarRelationFilterSchema),
        z.lazy(() => UserWhereInputSchema),
      ])
      .optional(),
    role: z
      .union([
        z.lazy(() => RoleScalarRelationFilterSchema),
        z.lazy(() => RoleWhereInputSchema),
      ])
      .optional(),
  })
  .strict();

export const UserRoleOrderByWithRelationInputSchema: z.ZodType<Prisma.UserRoleOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      user: z.lazy(() => UserOrderByWithRelationInputSchema).optional(),
      role: z.lazy(() => RoleOrderByWithRelationInputSchema).optional(),
    })
    .strict();

export const UserRoleWhereUniqueInputSchema: z.ZodType<Prisma.UserRoleWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        userId_roleId: z.lazy(
          () => UserRoleUserIdRoleIdCompoundUniqueInputSchema,
        ),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        userId_roleId: z.lazy(
          () => UserRoleUserIdRoleIdCompoundUniqueInputSchema,
        ),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          userId_roleId: z
            .lazy(() => UserRoleUserIdRoleIdCompoundUniqueInputSchema)
            .optional(),
          AND: z
            .union([
              z.lazy(() => UserRoleWhereInputSchema),
              z.lazy(() => UserRoleWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => UserRoleWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => UserRoleWhereInputSchema),
              z.lazy(() => UserRoleWhereInputSchema).array(),
            ])
            .optional(),
          userId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          roleId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          expiresAt: z
            .union([
              z.lazy(() => DateTimeNullableFilterSchema),
              z.coerce.date(),
            ])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          createdBy: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          user: z
            .union([
              z.lazy(() => UserScalarRelationFilterSchema),
              z.lazy(() => UserWhereInputSchema),
            ])
            .optional(),
          role: z
            .union([
              z.lazy(() => RoleScalarRelationFilterSchema),
              z.lazy(() => RoleWhereInputSchema),
            ])
            .optional(),
        })
        .strict(),
    );

export const UserRoleOrderByWithAggregationInputSchema: z.ZodType<Prisma.UserRoleOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      _count: z.lazy(() => UserRoleCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => UserRoleMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => UserRoleMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const UserRoleScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.UserRoleScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => UserRoleScalarWhereWithAggregatesInputSchema),
          z.lazy(() => UserRoleScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => UserRoleScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => UserRoleScalarWhereWithAggregatesInputSchema),
          z.lazy(() => UserRoleScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      userId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      roleId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      expiresAt: z
        .union([
          z.lazy(() => DateTimeNullableWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      createdBy: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const AuditLogWhereInputSchema: z.ZodType<Prisma.AuditLogWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => AuditLogWhereInputSchema),
        z.lazy(() => AuditLogWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => AuditLogWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => AuditLogWhereInputSchema),
        z.lazy(() => AuditLogWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    userId: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    action: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    entityType: z
      .union([z.lazy(() => StringFilterSchema), z.string()])
      .optional(),
    entityId: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    changes: z.lazy(() => JsonNullableFilterSchema).optional(),
    metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
    ipAddress: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    userAgent: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const AuditLogOrderByWithRelationInputSchema: z.ZodType<Prisma.AuditLogOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      entityType: z.lazy(() => SortOrderSchema).optional(),
      entityId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      changes: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      userAgent: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AuditLogWhereUniqueInputSchema: z.ZodType<Prisma.AuditLogWhereUniqueInput> =
  z
    .object({
      id: z.string(),
    })
    .and(
      z
        .object({
          id: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => AuditLogWhereInputSchema),
              z.lazy(() => AuditLogWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => AuditLogWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => AuditLogWhereInputSchema),
              z.lazy(() => AuditLogWhereInputSchema).array(),
            ])
            .optional(),
          userId: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          action: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          entityType: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          entityId: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          changes: z.lazy(() => JsonNullableFilterSchema).optional(),
          metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
          ipAddress: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          userAgent: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
        })
        .strict(),
    );

export const AuditLogOrderByWithAggregationInputSchema: z.ZodType<Prisma.AuditLogOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      entityType: z.lazy(() => SortOrderSchema).optional(),
      entityId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      changes: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      userAgent: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z.lazy(() => AuditLogCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => AuditLogMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => AuditLogMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const AuditLogScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.AuditLogScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => AuditLogScalarWhereWithAggregatesInputSchema),
          z.lazy(() => AuditLogScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => AuditLogScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => AuditLogScalarWhereWithAggregatesInputSchema),
          z.lazy(() => AuditLogScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      userId: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      action: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      entityType: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      entityId: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      changes: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
      metadata: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
      ipAddress: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const TaskWhereInputSchema: z.ZodType<Prisma.TaskWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => TaskWhereInputSchema),
        z.lazy(() => TaskWhereInputSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => TaskWhereInputSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => TaskWhereInputSchema),
        z.lazy(() => TaskWhereInputSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    title: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
    description: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    status: z
      .union([
        z.lazy(() => EnumTaskStatusFilterSchema),
        z.lazy(() => TaskStatusSchema),
      ])
      .optional(),
    createdBy: z
      .union([z.lazy(() => StringNullableFilterSchema), z.string()])
      .optional()
      .nullable(),
    createdAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
    updatedAt: z
      .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
      .optional(),
  })
  .strict();

export const TaskOrderByWithRelationInputSchema: z.ZodType<Prisma.TaskOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      title: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const TaskWhereUniqueInputSchema: z.ZodType<Prisma.TaskWhereUniqueInput> =
  z
    .object({
      id: z.string(),
    })
    .and(
      z
        .object({
          id: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => TaskWhereInputSchema),
              z.lazy(() => TaskWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => TaskWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => TaskWhereInputSchema),
              z.lazy(() => TaskWhereInputSchema).array(),
            ])
            .optional(),
          title: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          description: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          status: z
            .union([
              z.lazy(() => EnumTaskStatusFilterSchema),
              z.lazy(() => TaskStatusSchema),
            ])
            .optional(),
          createdBy: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
        })
        .strict(),
    );

export const TaskOrderByWithAggregationInputSchema: z.ZodType<Prisma.TaskOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      title: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z.lazy(() => TaskCountOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => TaskMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => TaskMinOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const TaskScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.TaskScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => TaskScalarWhereWithAggregatesInputSchema),
          z.lazy(() => TaskScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => TaskScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => TaskScalarWhereWithAggregatesInputSchema),
          z.lazy(() => TaskScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      title: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      description: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      status: z
        .union([
          z.lazy(() => EnumTaskStatusWithAggregatesFilterSchema),
          z.lazy(() => TaskStatusSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockWhereInputSchema: z.ZodType<Prisma.PromptBlockWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptBlockWhereInputSchema),
          z.lazy(() => PromptBlockWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptBlockWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptBlockWhereInputSchema),
          z.lazy(() => PromptBlockWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      category: z
        .union([
          z.lazy(() => EnumPromptBlockCategoryFilterSchema),
          z.lazy(() => PromptBlockCategorySchema),
        ])
        .optional(),
      content: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      description: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
      version: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
      isActive: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      parentBlockId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      parentBlock: z
        .union([
          z.lazy(() => PromptBlockNullableScalarRelationFilterSchema),
          z.lazy(() => PromptBlockWhereInputSchema),
        ])
        .optional()
        .nullable(),
      childBlocks: z.lazy(() => PromptBlockListRelationFilterSchema).optional(),
      usedInCompositions: z
        .lazy(() => PromptCompositionBlockListRelationFilterSchema)
        .optional(),
    })
    .strict();

export const PromptBlockOrderByWithRelationInputSchema: z.ZodType<Prisma.PromptBlockOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      category: z.lazy(() => SortOrderSchema).optional(),
      content: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      parentBlockId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      parentBlock: z
        .lazy(() => PromptBlockOrderByWithRelationInputSchema)
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockOrderByRelationAggregateInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(() => PromptCompositionBlockOrderByRelationAggregateInputSchema)
        .optional(),
    })
    .strict();

export const PromptBlockWhereUniqueInputSchema: z.ZodType<Prisma.PromptBlockWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        name: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        name: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          name: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => PromptBlockWhereInputSchema),
              z.lazy(() => PromptBlockWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => PromptBlockWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => PromptBlockWhereInputSchema),
              z.lazy(() => PromptBlockWhereInputSchema).array(),
            ])
            .optional(),
          category: z
            .union([
              z.lazy(() => EnumPromptBlockCategoryFilterSchema),
              z.lazy(() => PromptBlockCategorySchema),
            ])
            .optional(),
          content: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          description: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
          version: z
            .union([z.lazy(() => IntFilterSchema), z.number()])
            .optional(),
          isActive: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          parentBlockId: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          parentBlock: z
            .union([
              z.lazy(() => PromptBlockNullableScalarRelationFilterSchema),
              z.lazy(() => PromptBlockWhereInputSchema),
            ])
            .optional()
            .nullable(),
          childBlocks: z
            .lazy(() => PromptBlockListRelationFilterSchema)
            .optional(),
          usedInCompositions: z
            .lazy(() => PromptCompositionBlockListRelationFilterSchema)
            .optional(),
        })
        .strict(),
    );

export const PromptBlockOrderByWithAggregationInputSchema: z.ZodType<Prisma.PromptBlockOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      category: z.lazy(() => SortOrderSchema).optional(),
      content: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      parentBlockId: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      _count: z
        .lazy(() => PromptBlockCountOrderByAggregateInputSchema)
        .optional(),
      _avg: z.lazy(() => PromptBlockAvgOrderByAggregateInputSchema).optional(),
      _max: z.lazy(() => PromptBlockMaxOrderByAggregateInputSchema).optional(),
      _min: z.lazy(() => PromptBlockMinOrderByAggregateInputSchema).optional(),
      _sum: z.lazy(() => PromptBlockSumOrderByAggregateInputSchema).optional(),
    })
    .strict();

export const PromptBlockScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PromptBlockScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptBlockScalarWhereWithAggregatesInputSchema),
          z.lazy(() => PromptBlockScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptBlockScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptBlockScalarWhereWithAggregatesInputSchema),
          z.lazy(() => PromptBlockScalarWhereWithAggregatesInputSchema).array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      name: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      category: z
        .union([
          z.lazy(() => EnumPromptBlockCategoryWithAggregatesFilterSchema),
          z.lazy(() => PromptBlockCategorySchema),
        ])
        .optional(),
      content: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      description: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      metadata: z.lazy(() => JsonNullableWithAggregatesFilterSchema).optional(),
      version: z
        .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
        .optional(),
      isActive: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      parentBlockId: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const PromptCompositionWhereInputSchema: z.ZodType<Prisma.PromptCompositionWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptCompositionWhereInputSchema),
          z.lazy(() => PromptCompositionWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptCompositionWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptCompositionWhereInputSchema),
          z.lazy(() => PromptCompositionWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      purpose: z
        .union([
          z.lazy(() => EnumPromptPurposeFilterSchema),
          z.lazy(() => PromptPurposeSchema),
        ])
        .optional(),
      description: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      variables: z.lazy(() => JsonNullableFilterSchema).optional(),
      version: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
      isActive: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      blocks: z
        .lazy(() => PromptCompositionBlockListRelationFilterSchema)
        .optional(),
    })
    .strict();

export const PromptCompositionOrderByWithRelationInputSchema: z.ZodType<Prisma.PromptCompositionOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      purpose: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      variables: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      blocks: z
        .lazy(() => PromptCompositionBlockOrderByRelationAggregateInputSchema)
        .optional(),
    })
    .strict();

export const PromptCompositionWhereUniqueInputSchema: z.ZodType<Prisma.PromptCompositionWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        name: z.string(),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        name: z.string(),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          name: z.string().optional(),
          AND: z
            .union([
              z.lazy(() => PromptCompositionWhereInputSchema),
              z.lazy(() => PromptCompositionWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => PromptCompositionWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => PromptCompositionWhereInputSchema),
              z.lazy(() => PromptCompositionWhereInputSchema).array(),
            ])
            .optional(),
          purpose: z
            .union([
              z.lazy(() => EnumPromptPurposeFilterSchema),
              z.lazy(() => PromptPurposeSchema),
            ])
            .optional(),
          description: z
            .union([z.lazy(() => StringNullableFilterSchema), z.string()])
            .optional()
            .nullable(),
          variables: z.lazy(() => JsonNullableFilterSchema).optional(),
          version: z
            .union([z.lazy(() => IntFilterSchema), z.number()])
            .optional(),
          isActive: z
            .union([z.lazy(() => BoolFilterSchema), z.boolean()])
            .optional(),
          createdAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          updatedAt: z
            .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
            .optional(),
          blocks: z
            .lazy(() => PromptCompositionBlockListRelationFilterSchema)
            .optional(),
        })
        .strict(),
    );

export const PromptCompositionOrderByWithAggregationInputSchema: z.ZodType<Prisma.PromptCompositionOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      purpose: z.lazy(() => SortOrderSchema).optional(),
      description: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      variables: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      _count: z
        .lazy(() => PromptCompositionCountOrderByAggregateInputSchema)
        .optional(),
      _avg: z
        .lazy(() => PromptCompositionAvgOrderByAggregateInputSchema)
        .optional(),
      _max: z
        .lazy(() => PromptCompositionMaxOrderByAggregateInputSchema)
        .optional(),
      _min: z
        .lazy(() => PromptCompositionMinOrderByAggregateInputSchema)
        .optional(),
      _sum: z
        .lazy(() => PromptCompositionSumOrderByAggregateInputSchema)
        .optional(),
    })
    .strict();

export const PromptCompositionScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PromptCompositionScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptCompositionScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => PromptCompositionScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptCompositionScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptCompositionScalarWhereWithAggregatesInputSchema),
          z
            .lazy(() => PromptCompositionScalarWhereWithAggregatesInputSchema)
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      name: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => EnumPromptPurposeWithAggregatesFilterSchema),
          z.lazy(() => PromptPurposeSchema),
        ])
        .optional(),
      description: z
        .union([
          z.lazy(() => StringNullableWithAggregatesFilterSchema),
          z.string(),
        ])
        .optional()
        .nullable(),
      variables: z
        .lazy(() => JsonNullableWithAggregatesFilterSchema)
        .optional(),
      version: z
        .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
        .optional(),
      isActive: z
        .union([z.lazy(() => BoolWithAggregatesFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.lazy(() => DateTimeWithAggregatesFilterSchema),
          z.coerce.date(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockWhereInputSchema: z.ZodType<Prisma.PromptCompositionBlockWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereInputSchema),
          z.lazy(() => PromptCompositionBlockWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptCompositionBlockWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereInputSchema),
          z.lazy(() => PromptCompositionBlockWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      compositionId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      blockId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
      overrides: z.lazy(() => JsonNullableFilterSchema).optional(),
      composition: z
        .union([
          z.lazy(() => PromptCompositionScalarRelationFilterSchema),
          z.lazy(() => PromptCompositionWhereInputSchema),
        ])
        .optional(),
      block: z
        .union([
          z.lazy(() => PromptBlockScalarRelationFilterSchema),
          z.lazy(() => PromptBlockWhereInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockOrderByWithRelationInputSchema: z.ZodType<Prisma.PromptCompositionBlockOrderByWithRelationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      compositionId: z.lazy(() => SortOrderSchema).optional(),
      blockId: z.lazy(() => SortOrderSchema).optional(),
      order: z.lazy(() => SortOrderSchema).optional(),
      overrides: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      composition: z
        .lazy(() => PromptCompositionOrderByWithRelationInputSchema)
        .optional(),
      block: z.lazy(() => PromptBlockOrderByWithRelationInputSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockWhereUniqueInputSchema: z.ZodType<Prisma.PromptCompositionBlockWhereUniqueInput> =
  z
    .union([
      z.object({
        id: z.string(),
        compositionId_blockId: z.lazy(
          () =>
            PromptCompositionBlockCompositionIdBlockIdCompoundUniqueInputSchema,
        ),
      }),
      z.object({
        id: z.string(),
      }),
      z.object({
        compositionId_blockId: z.lazy(
          () =>
            PromptCompositionBlockCompositionIdBlockIdCompoundUniqueInputSchema,
        ),
      }),
    ])
    .and(
      z
        .object({
          id: z.string().optional(),
          compositionId_blockId: z
            .lazy(
              () =>
                PromptCompositionBlockCompositionIdBlockIdCompoundUniqueInputSchema,
            )
            .optional(),
          AND: z
            .union([
              z.lazy(() => PromptCompositionBlockWhereInputSchema),
              z.lazy(() => PromptCompositionBlockWhereInputSchema).array(),
            ])
            .optional(),
          OR: z
            .lazy(() => PromptCompositionBlockWhereInputSchema)
            .array()
            .optional(),
          NOT: z
            .union([
              z.lazy(() => PromptCompositionBlockWhereInputSchema),
              z.lazy(() => PromptCompositionBlockWhereInputSchema).array(),
            ])
            .optional(),
          compositionId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          blockId: z
            .union([z.lazy(() => StringFilterSchema), z.string()])
            .optional(),
          order: z
            .union([z.lazy(() => IntFilterSchema), z.number()])
            .optional(),
          overrides: z.lazy(() => JsonNullableFilterSchema).optional(),
          composition: z
            .union([
              z.lazy(() => PromptCompositionScalarRelationFilterSchema),
              z.lazy(() => PromptCompositionWhereInputSchema),
            ])
            .optional(),
          block: z
            .union([
              z.lazy(() => PromptBlockScalarRelationFilterSchema),
              z.lazy(() => PromptBlockWhereInputSchema),
            ])
            .optional(),
        })
        .strict(),
    );

export const PromptCompositionBlockOrderByWithAggregationInputSchema: z.ZodType<Prisma.PromptCompositionBlockOrderByWithAggregationInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      compositionId: z.lazy(() => SortOrderSchema).optional(),
      blockId: z.lazy(() => SortOrderSchema).optional(),
      order: z.lazy(() => SortOrderSchema).optional(),
      overrides: z
        .union([
          z.lazy(() => SortOrderSchema),
          z.lazy(() => SortOrderInputSchema),
        ])
        .optional(),
      _count: z
        .lazy(() => PromptCompositionBlockCountOrderByAggregateInputSchema)
        .optional(),
      _avg: z
        .lazy(() => PromptCompositionBlockAvgOrderByAggregateInputSchema)
        .optional(),
      _max: z
        .lazy(() => PromptCompositionBlockMaxOrderByAggregateInputSchema)
        .optional(),
      _min: z
        .lazy(() => PromptCompositionBlockMinOrderByAggregateInputSchema)
        .optional(),
      _sum: z
        .lazy(() => PromptCompositionBlockSumOrderByAggregateInputSchema)
        .optional(),
    })
    .strict();

export const PromptCompositionBlockScalarWhereWithAggregatesInputSchema: z.ZodType<Prisma.PromptCompositionBlockScalarWhereWithAggregatesInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(
            () => PromptCompositionBlockScalarWhereWithAggregatesInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockScalarWhereWithAggregatesInputSchema,
            )
            .array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptCompositionBlockScalarWhereWithAggregatesInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(
            () => PromptCompositionBlockScalarWhereWithAggregatesInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockScalarWhereWithAggregatesInputSchema,
            )
            .array(),
        ])
        .optional(),
      id: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      compositionId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      blockId: z
        .union([z.lazy(() => StringWithAggregatesFilterSchema), z.string()])
        .optional(),
      order: z
        .union([z.lazy(() => IntWithAggregatesFilterSchema), z.number()])
        .optional(),
      overrides: z
        .lazy(() => JsonNullableWithAggregatesFilterSchema)
        .optional(),
    })
    .strict();

export const UserCreateInputSchema: z.ZodType<Prisma.UserCreateInput> = z
  .object({
    id: z.string().optional(),
    email: z.string(),
    name: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    emailVerified: z.coerce.date().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    accounts: z
      .lazy(() => AccountCreateNestedManyWithoutUserInputSchema)
      .optional(),
    sessions: z
      .lazy(() => SessionCreateNestedManyWithoutUserInputSchema)
      .optional(),
    roles: z
      .lazy(() => UserRoleCreateNestedManyWithoutUserInputSchema)
      .optional(),
  })
  .strict();

export const UserUncheckedCreateInputSchema: z.ZodType<Prisma.UserUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      accounts: z
        .lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserUpdateInputSchema: z.ZodType<Prisma.UserUpdateInput> = z
  .object({
    id: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    email: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    image: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    emailVerified: z
      .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    accounts: z
      .lazy(() => AccountUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    sessions: z
      .lazy(() => SessionUpdateManyWithoutUserNestedInputSchema)
      .optional(),
    roles: z
      .lazy(() => UserRoleUpdateManyWithoutUserNestedInputSchema)
      .optional(),
  })
  .strict();

export const UserUncheckedUpdateInputSchema: z.ZodType<Prisma.UserUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      accounts: z
        .lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserCreateManyInputSchema: z.ZodType<Prisma.UserCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const UserUpdateManyMutationInputSchema: z.ZodType<Prisma.UserUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AccountCreateInputSchema: z.ZodType<Prisma.AccountCreateInput> = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    provider: z.string(),
    providerAccountId: z.string(),
    refreshToken: z.string().optional().nullable(),
    accessToken: z.string().optional().nullable(),
    expiresAt: z.coerce.date().optional().nullable(),
    tokenType: z.string().optional().nullable(),
    scope: z.string().optional().nullable(),
    idToken: z.string().optional().nullable(),
    sessionState: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutAccountsInputSchema),
  })
  .strict();

export const AccountUncheckedCreateInputSchema: z.ZodType<Prisma.AccountUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      type: z.string().optional(),
      provider: z.string(),
      providerAccountId: z.string(),
      refreshToken: z.string().optional().nullable(),
      accessToken: z.string().optional().nullable(),
      expiresAt: z.coerce.date().optional().nullable(),
      tokenType: z.string().optional().nullable(),
      scope: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
      sessionState: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const AccountUpdateInputSchema: z.ZodType<Prisma.AccountUpdateInput> = z
  .object({
    id: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    type: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    provider: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    providerAccountId: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    refreshToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    accessToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    expiresAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    tokenType: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    scope: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    idToken: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    sessionState: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutAccountsNestedInputSchema)
      .optional(),
  })
  .strict();

export const AccountUncheckedUpdateInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AccountCreateManyInputSchema: z.ZodType<Prisma.AccountCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      type: z.string().optional(),
      provider: z.string(),
      providerAccountId: z.string(),
      refreshToken: z.string().optional().nullable(),
      accessToken: z.string().optional().nullable(),
      expiresAt: z.coerce.date().optional().nullable(),
      tokenType: z.string().optional().nullable(),
      scope: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
      sessionState: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const AccountUpdateManyMutationInputSchema: z.ZodType<Prisma.AccountUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AccountUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionCreateInputSchema: z.ZodType<Prisma.SessionCreateInput> = z
  .object({
    id: z.string().optional(),
    sessionToken: z.string(),
    expires: z.coerce.date(),
    ipAddress: z.string().optional().nullable(),
    userAgent: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    user: z.lazy(() => UserCreateNestedOneWithoutSessionsInputSchema),
  })
  .strict();

export const SessionUncheckedCreateInputSchema: z.ZodType<Prisma.SessionUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      sessionToken: z.string(),
      userId: z.string(),
      expires: z.coerce.date(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const SessionUpdateInputSchema: z.ZodType<Prisma.SessionUpdateInput> = z
  .object({
    id: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    sessionToken: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    expires: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    ipAddress: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    userAgent: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    user: z
      .lazy(() => UserUpdateOneRequiredWithoutSessionsNestedInputSchema)
      .optional(),
  })
  .strict();

export const SessionUncheckedUpdateInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionCreateManyInputSchema: z.ZodType<Prisma.SessionCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      sessionToken: z.string(),
      userId: z.string(),
      expires: z.coerce.date(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const SessionUpdateManyMutationInputSchema: z.ZodType<Prisma.SessionUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const VerificationCreateInputSchema: z.ZodType<Prisma.VerificationCreateInput> =
  z
    .object({
      id: z.string().optional(),
      identifier: z.string(),
      value: z.string(),
      expiresAt: z.coerce.date(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const VerificationUncheckedCreateInputSchema: z.ZodType<Prisma.VerificationUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      identifier: z.string(),
      value: z.string(),
      expiresAt: z.coerce.date(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const VerificationUpdateInputSchema: z.ZodType<Prisma.VerificationUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      identifier: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      value: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const VerificationUncheckedUpdateInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      identifier: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      value: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const VerificationCreateManyInputSchema: z.ZodType<Prisma.VerificationCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      identifier: z.string(),
      value: z.string(),
      expiresAt: z.coerce.date(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const VerificationUpdateManyMutationInputSchema: z.ZodType<Prisma.VerificationUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      identifier: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      value: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const VerificationUncheckedUpdateManyInputSchema: z.ZodType<Prisma.VerificationUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      identifier: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      value: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RoleCreateInputSchema: z.ZodType<Prisma.RoleCreateInput> = z
  .object({
    id: z.string().optional(),
    name: z.string(),
    displayName: z.string(),
    description: z.string().optional().nullable(),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    createdBy: z.string().optional().nullable(),
    permissions: z
      .lazy(() => RolePermissionCreateNestedManyWithoutRoleInputSchema)
      .optional(),
    users: z
      .lazy(() => UserRoleCreateNestedManyWithoutRoleInputSchema)
      .optional(),
  })
  .strict();

export const RoleUncheckedCreateInputSchema: z.ZodType<Prisma.RoleUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      permissions: z
        .lazy(
          () => RolePermissionUncheckedCreateNestedManyWithoutRoleInputSchema,
        )
        .optional(),
      users: z
        .lazy(() => UserRoleUncheckedCreateNestedManyWithoutRoleInputSchema)
        .optional(),
    })
    .strict();

export const RoleUpdateInputSchema: z.ZodType<Prisma.RoleUpdateInput> = z
  .object({
    id: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    name: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    displayName: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    isSystem: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    isActive: z
      .union([z.boolean(), z.lazy(() => BoolFieldUpdateOperationsInputSchema)])
      .optional(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdBy: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    permissions: z
      .lazy(() => RolePermissionUpdateManyWithoutRoleNestedInputSchema)
      .optional(),
    users: z
      .lazy(() => UserRoleUpdateManyWithoutRoleNestedInputSchema)
      .optional(),
  })
  .strict();

export const RoleUncheckedUpdateInputSchema: z.ZodType<Prisma.RoleUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      permissions: z
        .lazy(
          () => RolePermissionUncheckedUpdateManyWithoutRoleNestedInputSchema,
        )
        .optional(),
      users: z
        .lazy(() => UserRoleUncheckedUpdateManyWithoutRoleNestedInputSchema)
        .optional(),
    })
    .strict();

export const RoleCreateManyInputSchema: z.ZodType<Prisma.RoleCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const RoleUpdateManyMutationInputSchema: z.ZodType<Prisma.RoleUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const RoleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RoleUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const PermissionCreateInputSchema: z.ZodType<Prisma.PermissionCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      resource: z.string(),
      action: z.string(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      roles: z
        .lazy(() => RolePermissionCreateNestedManyWithoutPermissionInputSchema)
        .optional(),
    })
    .strict();

export const PermissionUncheckedCreateInputSchema: z.ZodType<Prisma.PermissionUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      resource: z.string(),
      action: z.string(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      roles: z
        .lazy(
          () =>
            RolePermissionUncheckedCreateNestedManyWithoutPermissionInputSchema,
        )
        .optional(),
    })
    .strict();

export const PermissionUpdateInputSchema: z.ZodType<Prisma.PermissionUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roles: z
        .lazy(() => RolePermissionUpdateManyWithoutPermissionNestedInputSchema)
        .optional(),
    })
    .strict();

export const PermissionUncheckedUpdateInputSchema: z.ZodType<Prisma.PermissionUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roles: z
        .lazy(
          () =>
            RolePermissionUncheckedUpdateManyWithoutPermissionNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PermissionCreateManyInputSchema: z.ZodType<Prisma.PermissionCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      resource: z.string(),
      action: z.string(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PermissionUpdateManyMutationInputSchema: z.ZodType<Prisma.PermissionUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PermissionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PermissionUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionCreateInputSchema: z.ZodType<Prisma.RolePermissionCreateInput> =
  z
    .object({
      id: z.string().optional(),
      createdAt: z.coerce.date().optional(),
      role: z.lazy(() => RoleCreateNestedOneWithoutPermissionsInputSchema),
      permission: z.lazy(
        () => PermissionCreateNestedOneWithoutRolesInputSchema,
      ),
    })
    .strict();

export const RolePermissionUncheckedCreateInputSchema: z.ZodType<Prisma.RolePermissionUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      permissionId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const RolePermissionUpdateInputSchema: z.ZodType<Prisma.RolePermissionUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      role: z
        .lazy(() => RoleUpdateOneRequiredWithoutPermissionsNestedInputSchema)
        .optional(),
      permission: z
        .lazy(() => PermissionUpdateOneRequiredWithoutRolesNestedInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      permissionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionCreateManyInputSchema: z.ZodType<Prisma.RolePermissionCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      permissionId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const RolePermissionUpdateManyMutationInputSchema: z.ZodType<Prisma.RolePermissionUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      permissionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserRoleCreateInputSchema: z.ZodType<Prisma.UserRoleCreateInput> =
  z
    .object({
      id: z.string().optional(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      user: z.lazy(() => UserCreateNestedOneWithoutRolesInputSchema),
      role: z.lazy(() => RoleCreateNestedOneWithoutUsersInputSchema),
    })
    .strict();

export const UserRoleUncheckedCreateInputSchema: z.ZodType<Prisma.UserRoleUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      roleId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const UserRoleUpdateInputSchema: z.ZodType<Prisma.UserRoleUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      user: z
        .lazy(() => UserUpdateOneRequiredWithoutRolesNestedInputSchema)
        .optional(),
      role: z
        .lazy(() => RoleUpdateOneRequiredWithoutUsersNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserRoleUncheckedUpdateInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const UserRoleCreateManyInputSchema: z.ZodType<Prisma.UserRoleCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      roleId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const UserRoleUpdateManyMutationInputSchema: z.ZodType<Prisma.UserRoleUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const UserRoleUncheckedUpdateManyInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const AuditLogCreateInputSchema: z.ZodType<Prisma.AuditLogCreateInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string().optional().nullable(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional().nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const AuditLogUncheckedCreateInputSchema: z.ZodType<Prisma.AuditLogUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string().optional().nullable(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional().nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const AuditLogUpdateInputSchema: z.ZodType<Prisma.AuditLogUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityType: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AuditLogUncheckedUpdateInputSchema: z.ZodType<Prisma.AuditLogUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityType: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AuditLogCreateManyInputSchema: z.ZodType<Prisma.AuditLogCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string().optional().nullable(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().optional().nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const AuditLogUpdateManyMutationInputSchema: z.ZodType<Prisma.AuditLogUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityType: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AuditLogUncheckedUpdateManyInputSchema: z.ZodType<Prisma.AuditLogUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityType: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      entityId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      changes: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const TaskCreateInputSchema: z.ZodType<Prisma.TaskCreateInput> = z
  .object({
    id: z.string().optional(),
    title: z.string(),
    description: z.string().optional().nullable(),
    status: z.lazy(() => TaskStatusSchema).optional(),
    createdBy: z.string().optional().nullable(),
    createdAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
  })
  .strict();

export const TaskUncheckedCreateInputSchema: z.ZodType<Prisma.TaskUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      title: z.string(),
      description: z.string().optional().nullable(),
      status: z.lazy(() => TaskStatusSchema).optional(),
      createdBy: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const TaskUpdateInputSchema: z.ZodType<Prisma.TaskUpdateInput> = z
  .object({
    id: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    title: z
      .union([z.string(), z.lazy(() => StringFieldUpdateOperationsInputSchema)])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    status: z
      .union([
        z.lazy(() => TaskStatusSchema),
        z.lazy(() => EnumTaskStatusFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    createdBy: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
      ])
      .optional()
      .nullable(),
    createdAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
    updatedAt: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
      ])
      .optional(),
  })
  .strict();

export const TaskUncheckedUpdateInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      title: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      status: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => EnumTaskStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const TaskCreateManyInputSchema: z.ZodType<Prisma.TaskCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      title: z.string(),
      description: z.string().optional().nullable(),
      status: z.lazy(() => TaskStatusSchema).optional(),
      createdBy: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const TaskUpdateManyMutationInputSchema: z.ZodType<Prisma.TaskUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      title: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      status: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => EnumTaskStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const TaskUncheckedUpdateManyInputSchema: z.ZodType<Prisma.TaskUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      title: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      status: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => EnumTaskStatusFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockCreateInputSchema: z.ZodType<Prisma.PromptBlockCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlock: z
        .lazy(() => PromptBlockCreateNestedOneWithoutChildBlocksInputSchema)
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockCreateNestedManyWithoutParentBlockInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedCreateInputSchema: z.ZodType<Prisma.PromptBlockUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlockId: z.string().optional().nullable(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedCreateNestedManyWithoutParentBlockInputSchema,
        )
        .optional(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUpdateInputSchema: z.ZodType<Prisma.PromptBlockUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlock: z
        .lazy(() => PromptBlockUpdateOneWithoutChildBlocksNestedInputSchema)
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockUpdateManyWithoutParentBlockNestedInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlockId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedUpdateManyWithoutParentBlockNestedInputSchema,
        )
        .optional(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockCreateManyInputSchema: z.ZodType<Prisma.PromptBlockCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlockId: z.string().optional().nullable(),
    })
    .strict();

export const PromptBlockUpdateManyMutationInputSchema: z.ZodType<Prisma.PromptBlockUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlockId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const PromptCompositionCreateInputSchema: z.ZodType<Prisma.PromptCompositionCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      purpose: z.lazy(() => PromptPurposeSchema),
      description: z.string().optional().nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      blocks: z
        .lazy(
          () =>
            PromptCompositionBlockCreateNestedManyWithoutCompositionInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionUncheckedCreateInputSchema: z.ZodType<Prisma.PromptCompositionUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      purpose: z.lazy(() => PromptPurposeSchema),
      description: z.string().optional().nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      blocks: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedCreateNestedManyWithoutCompositionInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionUpdateInputSchema: z.ZodType<Prisma.PromptCompositionUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blocks: z
        .lazy(
          () =>
            PromptCompositionBlockUpdateManyWithoutCompositionNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionUncheckedUpdateInputSchema: z.ZodType<Prisma.PromptCompositionUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blocks: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutCompositionNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionCreateManyInputSchema: z.ZodType<Prisma.PromptCompositionCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      purpose: z.lazy(() => PromptPurposeSchema),
      description: z.string().optional().nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PromptCompositionUpdateManyMutationInputSchema: z.ZodType<Prisma.PromptCompositionUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PromptCompositionUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateInput> =
  z
    .object({
      id: z.string().optional(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      composition: z.lazy(
        () => PromptCompositionCreateNestedOneWithoutBlocksInputSchema,
      ),
      block: z.lazy(
        () => PromptBlockCreateNestedOneWithoutUsedInCompositionsInputSchema,
      ),
    })
    .strict();

export const PromptCompositionBlockUncheckedCreateInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedCreateInput> =
  z
    .object({
      id: z.string().optional(),
      compositionId: z.string(),
      blockId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      composition: z
        .lazy(
          () =>
            PromptCompositionUpdateOneRequiredWithoutBlocksNestedInputSchema,
        )
        .optional(),
      block: z
        .lazy(
          () =>
            PromptBlockUpdateOneRequiredWithoutUsedInCompositionsNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      compositionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blockId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateManyInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyInput> =
  z
    .object({
      id: z.string().optional(),
      compositionId: z.string(),
      blockId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateManyMutationInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyMutationInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateManyInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateManyInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      compositionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blockId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const StringFilterSchema: z.ZodType<Prisma.StringFilter> = z
  .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
      .optional(),
  })
  .strict();

export const StringNullableFilterSchema: z.ZodType<Prisma.StringNullableFilter> =
  z
    .object({
      equals: z.string().optional().nullable(),
      in: z.string().array().optional().nullable(),
      notIn: z.string().array().optional().nullable(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      mode: z.lazy(() => QueryModeSchema).optional(),
      not: z
        .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
        .optional()
        .nullable(),
    })
    .strict();

export const DateTimeNullableFilterSchema: z.ZodType<Prisma.DateTimeNullableFilter> =
  z
    .object({
      equals: z.coerce.date().optional().nullable(),
      in: z.coerce.date().array().optional().nullable(),
      notIn: z.coerce.date().array().optional().nullable(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeNullableFilterSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const DateTimeFilterSchema: z.ZodType<Prisma.DateTimeFilter> = z
  .object({
    equals: z.coerce.date().optional(),
    in: z.coerce.date().array().optional(),
    notIn: z.coerce.date().array().optional(),
    lt: z.coerce.date().optional(),
    lte: z.coerce.date().optional(),
    gt: z.coerce.date().optional(),
    gte: z.coerce.date().optional(),
    not: z
      .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
      .optional(),
  })
  .strict();

export const AccountListRelationFilterSchema: z.ZodType<Prisma.AccountListRelationFilter> =
  z
    .object({
      every: z.lazy(() => AccountWhereInputSchema).optional(),
      some: z.lazy(() => AccountWhereInputSchema).optional(),
      none: z.lazy(() => AccountWhereInputSchema).optional(),
    })
    .strict();

export const SessionListRelationFilterSchema: z.ZodType<Prisma.SessionListRelationFilter> =
  z
    .object({
      every: z.lazy(() => SessionWhereInputSchema).optional(),
      some: z.lazy(() => SessionWhereInputSchema).optional(),
      none: z.lazy(() => SessionWhereInputSchema).optional(),
    })
    .strict();

export const UserRoleListRelationFilterSchema: z.ZodType<Prisma.UserRoleListRelationFilter> =
  z
    .object({
      every: z.lazy(() => UserRoleWhereInputSchema).optional(),
      some: z.lazy(() => UserRoleWhereInputSchema).optional(),
      none: z.lazy(() => UserRoleWhereInputSchema).optional(),
    })
    .strict();

export const SortOrderInputSchema: z.ZodType<Prisma.SortOrderInput> = z
  .object({
    sort: z.lazy(() => SortOrderSchema),
    nulls: z.lazy(() => NullsOrderSchema).optional(),
  })
  .strict();

export const AccountOrderByRelationAggregateInputSchema: z.ZodType<Prisma.AccountOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const SessionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.SessionOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserRoleOrderByRelationAggregateInputSchema: z.ZodType<Prisma.UserRoleOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      email: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      image: z.lazy(() => SortOrderSchema).optional(),
      emailVerified: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      email: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      image: z.lazy(() => SortOrderSchema).optional(),
      emailVerified: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      email: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      image: z.lazy(() => SortOrderSchema).optional(),
      emailVerified: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const StringWithAggregatesFilterSchema: z.ZodType<Prisma.StringWithAggregatesFilter> =
  z
    .object({
      equals: z.string().optional(),
      in: z.string().array().optional(),
      notIn: z.string().array().optional(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      mode: z.lazy(() => QueryModeSchema).optional(),
      not: z
        .union([
          z.string(),
          z.lazy(() => NestedStringWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedStringFilterSchema).optional(),
      _max: z.lazy(() => NestedStringFilterSchema).optional(),
    })
    .strict();

export const StringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.StringNullableWithAggregatesFilter> =
  z
    .object({
      equals: z.string().optional().nullable(),
      in: z.string().array().optional().nullable(),
      notIn: z.string().array().optional().nullable(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      mode: z.lazy(() => QueryModeSchema).optional(),
      not: z
        .union([
          z.string(),
          z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
        ])
        .optional()
        .nullable(),
      _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
      _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
      _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    })
    .strict();

export const DateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeNullableWithAggregatesFilter> =
  z
    .object({
      equals: z.coerce.date().optional().nullable(),
      in: z.coerce.date().array().optional().nullable(),
      notIn: z.coerce.date().array().optional().nullable(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema),
        ])
        .optional()
        .nullable(),
      _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
      _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
      _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
    })
    .strict();

export const DateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.DateTimeWithAggregatesFilter> =
  z
    .object({
      equals: z.coerce.date().optional(),
      in: z.coerce.date().array().optional(),
      notIn: z.coerce.date().array().optional(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
      _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    })
    .strict();

export const UserScalarRelationFilterSchema: z.ZodType<Prisma.UserScalarRelationFilter> =
  z
    .object({
      is: z.lazy(() => UserWhereInputSchema).optional(),
      isNot: z.lazy(() => UserWhereInputSchema).optional(),
    })
    .strict();

export const AccountProviderProviderAccountIdCompoundUniqueInputSchema: z.ZodType<Prisma.AccountProviderProviderAccountIdCompoundUniqueInput> =
  z
    .object({
      provider: z.string(),
      providerAccountId: z.string(),
    })
    .strict();

export const AccountCountOrderByAggregateInputSchema: z.ZodType<Prisma.AccountCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      provider: z.lazy(() => SortOrderSchema).optional(),
      providerAccountId: z.lazy(() => SortOrderSchema).optional(),
      refreshToken: z.lazy(() => SortOrderSchema).optional(),
      accessToken: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      tokenType: z.lazy(() => SortOrderSchema).optional(),
      scope: z.lazy(() => SortOrderSchema).optional(),
      idToken: z.lazy(() => SortOrderSchema).optional(),
      sessionState: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AccountMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      provider: z.lazy(() => SortOrderSchema).optional(),
      providerAccountId: z.lazy(() => SortOrderSchema).optional(),
      refreshToken: z.lazy(() => SortOrderSchema).optional(),
      accessToken: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      tokenType: z.lazy(() => SortOrderSchema).optional(),
      scope: z.lazy(() => SortOrderSchema).optional(),
      idToken: z.lazy(() => SortOrderSchema).optional(),
      sessionState: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AccountMinOrderByAggregateInputSchema: z.ZodType<Prisma.AccountMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      type: z.lazy(() => SortOrderSchema).optional(),
      provider: z.lazy(() => SortOrderSchema).optional(),
      providerAccountId: z.lazy(() => SortOrderSchema).optional(),
      refreshToken: z.lazy(() => SortOrderSchema).optional(),
      accessToken: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      tokenType: z.lazy(() => SortOrderSchema).optional(),
      scope: z.lazy(() => SortOrderSchema).optional(),
      idToken: z.lazy(() => SortOrderSchema).optional(),
      sessionState: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const SessionCountOrderByAggregateInputSchema: z.ZodType<Prisma.SessionCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      sessionToken: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      expires: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const SessionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      sessionToken: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      expires: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const SessionMinOrderByAggregateInputSchema: z.ZodType<Prisma.SessionMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      sessionToken: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      expires: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const VerificationCountOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      identifier: z.lazy(() => SortOrderSchema).optional(),
      value: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const VerificationMaxOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      identifier: z.lazy(() => SortOrderSchema).optional(),
      value: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const VerificationMinOrderByAggregateInputSchema: z.ZodType<Prisma.VerificationMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      identifier: z.lazy(() => SortOrderSchema).optional(),
      value: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const BoolFilterSchema: z.ZodType<Prisma.BoolFilter> = z
  .object({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  })
  .strict();

export const RolePermissionListRelationFilterSchema: z.ZodType<Prisma.RolePermissionListRelationFilter> =
  z
    .object({
      every: z.lazy(() => RolePermissionWhereInputSchema).optional(),
      some: z.lazy(() => RolePermissionWhereInputSchema).optional(),
      none: z.lazy(() => RolePermissionWhereInputSchema).optional(),
    })
    .strict();

export const RolePermissionOrderByRelationAggregateInputSchema: z.ZodType<Prisma.RolePermissionOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RoleCountOrderByAggregateInputSchema: z.ZodType<Prisma.RoleCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RoleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RoleMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RoleMinOrderByAggregateInputSchema: z.ZodType<Prisma.RoleMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const BoolWithAggregatesFilterSchema: z.ZodType<Prisma.BoolWithAggregatesFilter> =
  z
    .object({
      equals: z.boolean().optional(),
      not: z
        .union([
          z.boolean(),
          z.lazy(() => NestedBoolWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedBoolFilterSchema).optional(),
      _max: z.lazy(() => NestedBoolFilterSchema).optional(),
    })
    .strict();

export const PermissionCountOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      resource: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PermissionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      resource: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PermissionMinOrderByAggregateInputSchema: z.ZodType<Prisma.PermissionMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      displayName: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      resource: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      isSystem: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RoleScalarRelationFilterSchema: z.ZodType<Prisma.RoleScalarRelationFilter> =
  z
    .object({
      is: z.lazy(() => RoleWhereInputSchema).optional(),
      isNot: z.lazy(() => RoleWhereInputSchema).optional(),
    })
    .strict();

export const PermissionScalarRelationFilterSchema: z.ZodType<Prisma.PermissionScalarRelationFilter> =
  z
    .object({
      is: z.lazy(() => PermissionWhereInputSchema).optional(),
      isNot: z.lazy(() => PermissionWhereInputSchema).optional(),
    })
    .strict();

export const RolePermissionRoleIdPermissionIdCompoundUniqueInputSchema: z.ZodType<Prisma.RolePermissionRoleIdPermissionIdCompoundUniqueInput> =
  z
    .object({
      roleId: z.string(),
      permissionId: z.string(),
    })
    .strict();

export const RolePermissionCountOrderByAggregateInputSchema: z.ZodType<Prisma.RolePermissionCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      permissionId: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RolePermissionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.RolePermissionMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      permissionId: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const RolePermissionMinOrderByAggregateInputSchema: z.ZodType<Prisma.RolePermissionMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      permissionId: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserRoleUserIdRoleIdCompoundUniqueInputSchema: z.ZodType<Prisma.UserRoleUserIdRoleIdCompoundUniqueInput> =
  z
    .object({
      userId: z.string(),
      roleId: z.string(),
    })
    .strict();

export const UserRoleCountOrderByAggregateInputSchema: z.ZodType<Prisma.UserRoleCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserRoleMaxOrderByAggregateInputSchema: z.ZodType<Prisma.UserRoleMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const UserRoleMinOrderByAggregateInputSchema: z.ZodType<Prisma.UserRoleMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      roleId: z.lazy(() => SortOrderSchema).optional(),
      expiresAt: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const JsonNullableFilterSchema: z.ZodType<Prisma.JsonNullableFilter> = z
  .object({
    equals: InputJsonValueSchema.optional(),
    path: z.string().array().optional(),
    mode: z.lazy(() => QueryModeSchema).optional(),
    string_contains: z.string().optional(),
    string_starts_with: z.string().optional(),
    string_ends_with: z.string().optional(),
    array_starts_with: InputJsonValueSchema.optional().nullable(),
    array_ends_with: InputJsonValueSchema.optional().nullable(),
    array_contains: InputJsonValueSchema.optional().nullable(),
    lt: InputJsonValueSchema.optional(),
    lte: InputJsonValueSchema.optional(),
    gt: InputJsonValueSchema.optional(),
    gte: InputJsonValueSchema.optional(),
    not: InputJsonValueSchema.optional(),
  })
  .strict();

export const AuditLogCountOrderByAggregateInputSchema: z.ZodType<Prisma.AuditLogCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      entityType: z.lazy(() => SortOrderSchema).optional(),
      entityId: z.lazy(() => SortOrderSchema).optional(),
      changes: z.lazy(() => SortOrderSchema).optional(),
      metadata: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AuditLogMaxOrderByAggregateInputSchema: z.ZodType<Prisma.AuditLogMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      entityType: z.lazy(() => SortOrderSchema).optional(),
      entityId: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AuditLogMinOrderByAggregateInputSchema: z.ZodType<Prisma.AuditLogMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      userId: z.lazy(() => SortOrderSchema).optional(),
      action: z.lazy(() => SortOrderSchema).optional(),
      entityType: z.lazy(() => SortOrderSchema).optional(),
      entityId: z.lazy(() => SortOrderSchema).optional(),
      ipAddress: z.lazy(() => SortOrderSchema).optional(),
      userAgent: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const JsonNullableWithAggregatesFilterSchema: z.ZodType<Prisma.JsonNullableWithAggregatesFilter> =
  z
    .object({
      equals: InputJsonValueSchema.optional(),
      path: z.string().array().optional(),
      mode: z.lazy(() => QueryModeSchema).optional(),
      string_contains: z.string().optional(),
      string_starts_with: z.string().optional(),
      string_ends_with: z.string().optional(),
      array_starts_with: InputJsonValueSchema.optional().nullable(),
      array_ends_with: InputJsonValueSchema.optional().nullable(),
      array_contains: InputJsonValueSchema.optional().nullable(),
      lt: InputJsonValueSchema.optional(),
      lte: InputJsonValueSchema.optional(),
      gt: InputJsonValueSchema.optional(),
      gte: InputJsonValueSchema.optional(),
      not: InputJsonValueSchema.optional(),
      _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
      _min: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
      _max: z.lazy(() => NestedJsonNullableFilterSchema).optional(),
    })
    .strict();

export const EnumTaskStatusFilterSchema: z.ZodType<Prisma.EnumTaskStatusFilter> =
  z
    .object({
      equals: z.lazy(() => TaskStatusSchema).optional(),
      in: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => NestedEnumTaskStatusFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const TaskCountOrderByAggregateInputSchema: z.ZodType<Prisma.TaskCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      title: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const TaskMaxOrderByAggregateInputSchema: z.ZodType<Prisma.TaskMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      title: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const TaskMinOrderByAggregateInputSchema: z.ZodType<Prisma.TaskMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      title: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      status: z.lazy(() => SortOrderSchema).optional(),
      createdBy: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const EnumTaskStatusWithAggregatesFilterSchema: z.ZodType<Prisma.EnumTaskStatusWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => TaskStatusSchema).optional(),
      in: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => NestedEnumTaskStatusWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumTaskStatusFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumTaskStatusFilterSchema).optional(),
    })
    .strict();

export const EnumPromptBlockCategoryFilterSchema: z.ZodType<Prisma.EnumPromptBlockCategoryFilter> =
  z
    .object({
      equals: z.lazy(() => PromptBlockCategorySchema).optional(),
      in: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const IntFilterSchema: z.ZodType<Prisma.IntFilter> = z
  .object({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z.union([z.number(), z.lazy(() => NestedIntFilterSchema)]).optional(),
  })
  .strict();

export const PromptBlockNullableScalarRelationFilterSchema: z.ZodType<Prisma.PromptBlockNullableScalarRelationFilter> =
  z
    .object({
      is: z
        .lazy(() => PromptBlockWhereInputSchema)
        .optional()
        .nullable(),
      isNot: z
        .lazy(() => PromptBlockWhereInputSchema)
        .optional()
        .nullable(),
    })
    .strict();

export const PromptBlockListRelationFilterSchema: z.ZodType<Prisma.PromptBlockListRelationFilter> =
  z
    .object({
      every: z.lazy(() => PromptBlockWhereInputSchema).optional(),
      some: z.lazy(() => PromptBlockWhereInputSchema).optional(),
      none: z.lazy(() => PromptBlockWhereInputSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockListRelationFilterSchema: z.ZodType<Prisma.PromptCompositionBlockListRelationFilter> =
  z
    .object({
      every: z.lazy(() => PromptCompositionBlockWhereInputSchema).optional(),
      some: z.lazy(() => PromptCompositionBlockWhereInputSchema).optional(),
      none: z.lazy(() => PromptCompositionBlockWhereInputSchema).optional(),
    })
    .strict();

export const PromptBlockOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PromptBlockOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockOrderByRelationAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockOrderByRelationAggregateInput> =
  z
    .object({
      _count: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptBlockCountOrderByAggregateInputSchema: z.ZodType<Prisma.PromptBlockCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      category: z.lazy(() => SortOrderSchema).optional(),
      content: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      metadata: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      parentBlockId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptBlockAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PromptBlockAvgOrderByAggregateInput> =
  z
    .object({
      version: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptBlockMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PromptBlockMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      category: z.lazy(() => SortOrderSchema).optional(),
      content: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      parentBlockId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptBlockMinOrderByAggregateInputSchema: z.ZodType<Prisma.PromptBlockMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      category: z.lazy(() => SortOrderSchema).optional(),
      content: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
      parentBlockId: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptBlockSumOrderByAggregateInputSchema: z.ZodType<Prisma.PromptBlockSumOrderByAggregateInput> =
  z
    .object({
      version: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const EnumPromptBlockCategoryWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPromptBlockCategoryWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => PromptBlockCategorySchema).optional(),
      in: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => NestedEnumPromptBlockCategoryWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema).optional(),
    })
    .strict();

export const IntWithAggregatesFilterSchema: z.ZodType<Prisma.IntWithAggregatesFilter> =
  z
    .object({
      equals: z.number().optional(),
      in: z.number().array().optional(),
      notIn: z.number().array().optional(),
      lt: z.number().optional(),
      lte: z.number().optional(),
      gt: z.number().optional(),
      gte: z.number().optional(),
      not: z
        .union([z.number(), z.lazy(() => NestedIntWithAggregatesFilterSchema)])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
      _sum: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedIntFilterSchema).optional(),
      _max: z.lazy(() => NestedIntFilterSchema).optional(),
    })
    .strict();

export const EnumPromptPurposeFilterSchema: z.ZodType<Prisma.EnumPromptPurposeFilter> =
  z
    .object({
      equals: z.lazy(() => PromptPurposeSchema).optional(),
      in: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => NestedEnumPromptPurposeFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionCountOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      purpose: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      variables: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionAvgOrderByAggregateInput> =
  z
    .object({
      version: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      purpose: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionMinOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      name: z.lazy(() => SortOrderSchema).optional(),
      purpose: z.lazy(() => SortOrderSchema).optional(),
      description: z.lazy(() => SortOrderSchema).optional(),
      version: z.lazy(() => SortOrderSchema).optional(),
      isActive: z.lazy(() => SortOrderSchema).optional(),
      createdAt: z.lazy(() => SortOrderSchema).optional(),
      updatedAt: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionSumOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionSumOrderByAggregateInput> =
  z
    .object({
      version: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const EnumPromptPurposeWithAggregatesFilterSchema: z.ZodType<Prisma.EnumPromptPurposeWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => PromptPurposeSchema).optional(),
      in: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => NestedEnumPromptPurposeWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumPromptPurposeFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumPromptPurposeFilterSchema).optional(),
    })
    .strict();

export const PromptCompositionScalarRelationFilterSchema: z.ZodType<Prisma.PromptCompositionScalarRelationFilter> =
  z
    .object({
      is: z.lazy(() => PromptCompositionWhereInputSchema).optional(),
      isNot: z.lazy(() => PromptCompositionWhereInputSchema).optional(),
    })
    .strict();

export const PromptBlockScalarRelationFilterSchema: z.ZodType<Prisma.PromptBlockScalarRelationFilter> =
  z
    .object({
      is: z.lazy(() => PromptBlockWhereInputSchema).optional(),
      isNot: z.lazy(() => PromptBlockWhereInputSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockCompositionIdBlockIdCompoundUniqueInputSchema: z.ZodType<Prisma.PromptCompositionBlockCompositionIdBlockIdCompoundUniqueInput> =
  z
    .object({
      compositionId: z.string(),
      blockId: z.string(),
    })
    .strict();

export const PromptCompositionBlockCountOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockCountOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      compositionId: z.lazy(() => SortOrderSchema).optional(),
      blockId: z.lazy(() => SortOrderSchema).optional(),
      order: z.lazy(() => SortOrderSchema).optional(),
      overrides: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockAvgOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockAvgOrderByAggregateInput> =
  z
    .object({
      order: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockMaxOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockMaxOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      compositionId: z.lazy(() => SortOrderSchema).optional(),
      blockId: z.lazy(() => SortOrderSchema).optional(),
      order: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockMinOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockMinOrderByAggregateInput> =
  z
    .object({
      id: z.lazy(() => SortOrderSchema).optional(),
      compositionId: z.lazy(() => SortOrderSchema).optional(),
      blockId: z.lazy(() => SortOrderSchema).optional(),
      order: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockSumOrderByAggregateInputSchema: z.ZodType<Prisma.PromptCompositionBlockSumOrderByAggregateInput> =
  z
    .object({
      order: z.lazy(() => SortOrderSchema).optional(),
    })
    .strict();

export const AccountCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AccountCreateWithoutUserInputSchema),
          z.lazy(() => AccountCreateWithoutUserInputSchema).array(),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => AccountCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const SessionCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => SessionCreateWithoutUserInputSchema),
          z.lazy(() => SessionCreateWithoutUserInputSchema).array(),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => SessionCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserRoleCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateWithoutUserInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const AccountUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AccountCreateWithoutUserInputSchema),
          z.lazy(() => AccountCreateWithoutUserInputSchema).array(),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => AccountCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const SessionUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => SessionCreateWithoutUserInputSchema),
          z.lazy(() => SessionCreateWithoutUserInputSchema).array(),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => SessionCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUncheckedCreateNestedManyWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUncheckedCreateNestedManyWithoutUserInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateWithoutUserInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyUserInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const StringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.StringFieldUpdateOperationsInput> =
  z
    .object({
      set: z.string().optional(),
    })
    .strict();

export const NullableStringFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableStringFieldUpdateOperationsInput> =
  z
    .object({
      set: z.string().optional().nullable(),
    })
    .strict();

export const NullableDateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.NullableDateTimeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.coerce.date().optional().nullable(),
    })
    .strict();

export const DateTimeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.DateTimeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.coerce.date().optional(),
    })
    .strict();

export const AccountUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AccountCreateWithoutUserInputSchema),
          z.lazy(() => AccountCreateWithoutUserInputSchema).array(),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => AccountCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => AccountScalarWhereInputSchema),
          z.lazy(() => AccountScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const SessionUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => SessionCreateWithoutUserInputSchema),
          z.lazy(() => SessionCreateWithoutUserInputSchema).array(),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => SessionCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => SessionScalarWhereInputSchema),
          z.lazy(() => SessionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserRoleUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateWithoutUserInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => UserRoleUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => UserRoleUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => UserRoleUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const AccountUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => AccountCreateWithoutUserInputSchema),
          z.lazy(() => AccountCreateWithoutUserInputSchema).array(),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => AccountCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => AccountUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => AccountCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => AccountWhereUniqueInputSchema),
          z.lazy(() => AccountWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => AccountUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => AccountUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => AccountScalarWhereInputSchema),
          z.lazy(() => AccountScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const SessionUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => SessionCreateWithoutUserInputSchema),
          z.lazy(() => SessionCreateWithoutUserInputSchema).array(),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => SessionCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => SessionUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => SessionCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => SessionWhereUniqueInputSchema),
          z.lazy(() => SessionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => SessionUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => SessionUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => SessionScalarWhereInputSchema),
          z.lazy(() => SessionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUncheckedUpdateManyWithoutUserNestedInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateManyWithoutUserNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateWithoutUserInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutUserInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => UserRoleUpsertWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpsertWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyUserInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => UserRoleUpdateWithWhereUniqueWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpdateWithWhereUniqueWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => UserRoleUpdateManyWithWhereWithoutUserInputSchema),
          z
            .lazy(() => UserRoleUpdateManyWithWhereWithoutUserInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserCreateNestedOneWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutAccountsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutAccountsInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutAccountsInputSchema)
        .optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    })
    .strict();

export const UserUpdateOneRequiredWithoutAccountsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutAccountsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutAccountsInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutAccountsInputSchema)
        .optional(),
      upsert: z.lazy(() => UserUpsertWithoutAccountsInputSchema).optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => UserUpdateToOneWithWhereWithoutAccountsInputSchema),
          z.lazy(() => UserUpdateWithoutAccountsInputSchema),
          z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserCreateNestedOneWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutSessionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutSessionsInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutSessionsInputSchema)
        .optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    })
    .strict();

export const UserUpdateOneRequiredWithoutSessionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutSessionsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutSessionsInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutSessionsInputSchema)
        .optional(),
      upsert: z.lazy(() => UserUpsertWithoutSessionsInputSchema).optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => UserUpdateToOneWithWhereWithoutSessionsInputSchema),
          z.lazy(() => UserUpdateWithoutSessionsInputSchema),
          z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionCreateNestedManyWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionCreateNestedManyWithoutRoleInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema).array(),
          z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyRoleInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleCreateNestedManyWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleCreateNestedManyWithoutRoleInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyRoleInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedCreateNestedManyWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUncheckedCreateNestedManyWithoutRoleInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema).array(),
          z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyRoleInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUncheckedCreateNestedManyWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUncheckedCreateNestedManyWithoutRoleInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema).array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyRoleInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const BoolFieldUpdateOperationsInputSchema: z.ZodType<Prisma.BoolFieldUpdateOperationsInput> =
  z
    .object({
      set: z.boolean().optional(),
    })
    .strict();

export const RolePermissionUpdateManyWithoutRoleNestedInputSchema: z.ZodType<Prisma.RolePermissionUpdateManyWithoutRoleNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema).array(),
          z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => RolePermissionUpsertWithWhereUniqueWithoutRoleInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUpsertWithWhereUniqueWithoutRoleInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyRoleInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => RolePermissionUpdateWithWhereUniqueWithoutRoleInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUpdateWithWhereUniqueWithoutRoleInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => RolePermissionUpdateManyWithWhereWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUpdateManyWithWhereWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUpdateManyWithoutRoleNestedInputSchema: z.ZodType<Prisma.UserRoleUpdateManyWithoutRoleNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => UserRoleUpsertWithWhereUniqueWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpsertWithWhereUniqueWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyRoleInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => UserRoleUpdateWithWhereUniqueWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpdateWithWhereUniqueWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => UserRoleUpdateManyWithWhereWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpdateManyWithWhereWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateManyWithoutRoleNestedInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateManyWithoutRoleNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
          z.lazy(() => RolePermissionCreateWithoutRoleInputSchema).array(),
          z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionCreateOrConnectWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => RolePermissionUpsertWithWhereUniqueWithoutRoleInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUpsertWithWhereUniqueWithoutRoleInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyRoleInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => RolePermissionUpdateWithWhereUniqueWithoutRoleInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUpdateWithWhereUniqueWithoutRoleInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => RolePermissionUpdateManyWithWhereWithoutRoleInputSchema),
          z
            .lazy(() => RolePermissionUpdateManyWithWhereWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUncheckedUpdateManyWithoutRoleNestedInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateManyWithoutRoleNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateWithoutRoleInputSchema).array(),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
          z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema).array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema),
          z.lazy(() => UserRoleCreateOrConnectWithoutRoleInputSchema).array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(() => UserRoleUpsertWithWhereUniqueWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpsertWithWhereUniqueWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => UserRoleCreateManyRoleInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => UserRoleWhereUniqueInputSchema),
          z.lazy(() => UserRoleWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(() => UserRoleUpdateWithWhereUniqueWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpdateWithWhereUniqueWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => UserRoleUpdateManyWithWhereWithoutRoleInputSchema),
          z
            .lazy(() => UserRoleUpdateManyWithWhereWithoutRoleInputSchema)
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionCreateNestedManyWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionCreateNestedManyWithoutPermissionInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
          z
            .lazy(() => RolePermissionCreateWithoutPermissionInputSchema)
            .array(),
          z.lazy(
            () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyPermissionInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedCreateNestedManyWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUncheckedCreateNestedManyWithoutPermissionInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
          z
            .lazy(() => RolePermissionCreateWithoutPermissionInputSchema)
            .array(),
          z.lazy(
            () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyPermissionInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUpdateManyWithoutPermissionNestedInputSchema: z.ZodType<Prisma.RolePermissionUpdateManyWithoutPermissionNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
          z
            .lazy(() => RolePermissionCreateWithoutPermissionInputSchema)
            .array(),
          z.lazy(
            () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              RolePermissionUpsertWithWhereUniqueWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpsertWithWhereUniqueWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyPermissionInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              RolePermissionUpdateWithWhereUniqueWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpdateWithWhereUniqueWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => RolePermissionUpdateManyWithWhereWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpdateManyWithWhereWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateManyWithoutPermissionNestedInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateManyWithoutPermissionNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
          z
            .lazy(() => RolePermissionCreateWithoutPermissionInputSchema)
            .array(),
          z.lazy(
            () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionUncheckedCreateWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () => RolePermissionCreateOrConnectWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              RolePermissionUpsertWithWhereUniqueWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpsertWithWhereUniqueWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => RolePermissionCreateManyPermissionInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => RolePermissionWhereUniqueInputSchema),
          z.lazy(() => RolePermissionWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              RolePermissionUpdateWithWhereUniqueWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpdateWithWhereUniqueWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => RolePermissionUpdateManyWithWhereWithoutPermissionInputSchema,
          ),
          z
            .lazy(
              () =>
                RolePermissionUpdateManyWithWhereWithoutPermissionInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const RoleCreateNestedOneWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleCreateNestedOneWithoutPermissionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RoleCreateWithoutPermissionsInputSchema),
          z.lazy(() => RoleUncheckedCreateWithoutPermissionsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => RoleCreateOrConnectWithoutPermissionsInputSchema)
        .optional(),
      connect: z.lazy(() => RoleWhereUniqueInputSchema).optional(),
    })
    .strict();

export const PermissionCreateNestedOneWithoutRolesInputSchema: z.ZodType<Prisma.PermissionCreateNestedOneWithoutRolesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PermissionCreateWithoutRolesInputSchema),
          z.lazy(() => PermissionUncheckedCreateWithoutRolesInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PermissionCreateOrConnectWithoutRolesInputSchema)
        .optional(),
      connect: z.lazy(() => PermissionWhereUniqueInputSchema).optional(),
    })
    .strict();

export const RoleUpdateOneRequiredWithoutPermissionsNestedInputSchema: z.ZodType<Prisma.RoleUpdateOneRequiredWithoutPermissionsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RoleCreateWithoutPermissionsInputSchema),
          z.lazy(() => RoleUncheckedCreateWithoutPermissionsInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => RoleCreateOrConnectWithoutPermissionsInputSchema)
        .optional(),
      upsert: z.lazy(() => RoleUpsertWithoutPermissionsInputSchema).optional(),
      connect: z.lazy(() => RoleWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => RoleUpdateToOneWithWhereWithoutPermissionsInputSchema),
          z.lazy(() => RoleUpdateWithoutPermissionsInputSchema),
          z.lazy(() => RoleUncheckedUpdateWithoutPermissionsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PermissionUpdateOneRequiredWithoutRolesNestedInputSchema: z.ZodType<Prisma.PermissionUpdateOneRequiredWithoutRolesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PermissionCreateWithoutRolesInputSchema),
          z.lazy(() => PermissionUncheckedCreateWithoutRolesInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PermissionCreateOrConnectWithoutRolesInputSchema)
        .optional(),
      upsert: z.lazy(() => PermissionUpsertWithoutRolesInputSchema).optional(),
      connect: z.lazy(() => PermissionWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => PermissionUpdateToOneWithWhereWithoutRolesInputSchema),
          z.lazy(() => PermissionUpdateWithoutRolesInputSchema),
          z.lazy(() => PermissionUncheckedUpdateWithoutRolesInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserCreateNestedOneWithoutRolesInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutRolesInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutRolesInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutRolesInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutRolesInputSchema)
        .optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
    })
    .strict();

export const RoleCreateNestedOneWithoutUsersInputSchema: z.ZodType<Prisma.RoleCreateNestedOneWithoutUsersInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RoleCreateWithoutUsersInputSchema),
          z.lazy(() => RoleUncheckedCreateWithoutUsersInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => RoleCreateOrConnectWithoutUsersInputSchema)
        .optional(),
      connect: z.lazy(() => RoleWhereUniqueInputSchema).optional(),
    })
    .strict();

export const UserUpdateOneRequiredWithoutRolesNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutRolesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => UserCreateWithoutRolesInputSchema),
          z.lazy(() => UserUncheckedCreateWithoutRolesInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => UserCreateOrConnectWithoutRolesInputSchema)
        .optional(),
      upsert: z.lazy(() => UserUpsertWithoutRolesInputSchema).optional(),
      connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => UserUpdateToOneWithWhereWithoutRolesInputSchema),
          z.lazy(() => UserUpdateWithoutRolesInputSchema),
          z.lazy(() => UserUncheckedUpdateWithoutRolesInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RoleUpdateOneRequiredWithoutUsersNestedInputSchema: z.ZodType<Prisma.RoleUpdateOneRequiredWithoutUsersNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => RoleCreateWithoutUsersInputSchema),
          z.lazy(() => RoleUncheckedCreateWithoutUsersInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => RoleCreateOrConnectWithoutUsersInputSchema)
        .optional(),
      upsert: z.lazy(() => RoleUpsertWithoutUsersInputSchema).optional(),
      connect: z.lazy(() => RoleWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(() => RoleUpdateToOneWithWhereWithoutUsersInputSchema),
          z.lazy(() => RoleUpdateWithoutUsersInputSchema),
          z.lazy(() => RoleUncheckedUpdateWithoutUsersInputSchema),
        ])
        .optional(),
    })
    .strict();

export const EnumTaskStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumTaskStatusFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => TaskStatusSchema).optional(),
    })
    .strict();

export const PromptBlockCreateNestedOneWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockCreateNestedOneWithoutChildBlocksInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutChildBlocksInputSchema),
          z.lazy(() => PromptBlockUncheckedCreateWithoutChildBlocksInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PromptBlockCreateOrConnectWithoutChildBlocksInputSchema)
        .optional(),
      connect: z.lazy(() => PromptBlockWhereUniqueInputSchema).optional(),
    })
    .strict();

export const PromptBlockCreateNestedManyWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockCreateNestedManyWithoutParentBlockInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema).array(),
          z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptBlockCreateManyParentBlockInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateNestedManyWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateNestedManyWithoutBlockInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
          z
            .lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema)
            .array(),
          z.lazy(
            () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptCompositionBlockCreateManyBlockInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedCreateNestedManyWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUncheckedCreateNestedManyWithoutParentBlockInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema).array(),
          z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptBlockCreateManyParentBlockInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedCreateNestedManyWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedCreateNestedManyWithoutBlockInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
          z
            .lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema)
            .array(),
          z.lazy(
            () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptCompositionBlockCreateManyBlockInputEnvelopeSchema)
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const EnumPromptBlockCategoryFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPromptBlockCategoryFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => PromptBlockCategorySchema).optional(),
    })
    .strict();

export const IntFieldUpdateOperationsInputSchema: z.ZodType<Prisma.IntFieldUpdateOperationsInput> =
  z
    .object({
      set: z.number().optional(),
      increment: z.number().optional(),
      decrement: z.number().optional(),
      multiply: z.number().optional(),
      divide: z.number().optional(),
    })
    .strict();

export const PromptBlockUpdateOneWithoutChildBlocksNestedInputSchema: z.ZodType<Prisma.PromptBlockUpdateOneWithoutChildBlocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutChildBlocksInputSchema),
          z.lazy(() => PromptBlockUncheckedCreateWithoutChildBlocksInputSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PromptBlockCreateOrConnectWithoutChildBlocksInputSchema)
        .optional(),
      upsert: z
        .lazy(() => PromptBlockUpsertWithoutChildBlocksInputSchema)
        .optional(),
      disconnect: z
        .union([z.boolean(), z.lazy(() => PromptBlockWhereInputSchema)])
        .optional(),
      delete: z
        .union([z.boolean(), z.lazy(() => PromptBlockWhereInputSchema)])
        .optional(),
      connect: z.lazy(() => PromptBlockWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(
            () => PromptBlockUpdateToOneWithWhereWithoutChildBlocksInputSchema,
          ),
          z.lazy(() => PromptBlockUpdateWithoutChildBlocksInputSchema),
          z.lazy(() => PromptBlockUncheckedUpdateWithoutChildBlocksInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUpdateManyWithoutParentBlockNestedInputSchema: z.ZodType<Prisma.PromptBlockUpdateManyWithoutParentBlockNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema).array(),
          z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => PromptBlockUpsertWithWhereUniqueWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptBlockUpsertWithWhereUniqueWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptBlockCreateManyParentBlockInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => PromptBlockUpdateWithWhereUniqueWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptBlockUpdateWithWhereUniqueWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => PromptBlockUpdateManyWithWhereWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () => PromptBlockUpdateManyWithWhereWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptBlockScalarWhereInputSchema),
          z.lazy(() => PromptBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateManyWithoutBlockNestedInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyWithoutBlockNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
          z
            .lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema)
            .array(),
          z.lazy(
            () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptCompositionBlockCreateManyBlockInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateManyWithWhereWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateManyWithWhereWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateManyWithoutParentBlockNestedInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateManyWithoutParentBlockNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
          z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema).array(),
          z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema),
          z
            .lazy(() => PromptBlockCreateOrConnectWithoutParentBlockInputSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => PromptBlockUpsertWithWhereUniqueWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptBlockUpsertWithWhereUniqueWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptBlockCreateManyParentBlockInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptBlockWhereUniqueInputSchema),
          z.lazy(() => PromptBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => PromptBlockUpdateWithWhereUniqueWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptBlockUpdateWithWhereUniqueWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => PromptBlockUpdateManyWithWhereWithoutParentBlockInputSchema,
          ),
          z
            .lazy(
              () => PromptBlockUpdateManyWithWhereWithoutParentBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptBlockScalarWhereInputSchema),
          z.lazy(() => PromptBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateManyWithoutBlockNestedInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateManyWithoutBlockNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
          z
            .lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema)
            .array(),
          z.lazy(
            () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(() => PromptCompositionBlockCreateManyBlockInputEnvelopeSchema)
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateManyWithWhereWithoutBlockInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateManyWithWhereWithoutBlockInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateNestedManyWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateNestedManyWithoutCompositionInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
            )
            .array(),
          z.lazy(
            () =>
              PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => PromptCompositionBlockCreateManyCompositionInputEnvelopeSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedCreateNestedManyWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedCreateNestedManyWithoutCompositionInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
            )
            .array(),
          z.lazy(
            () =>
              PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => PromptCompositionBlockCreateManyCompositionInputEnvelopeSchema,
        )
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const EnumPromptPurposeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumPromptPurposeFieldUpdateOperationsInput> =
  z
    .object({
      set: z.lazy(() => PromptPurposeSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateManyWithoutCompositionNestedInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyWithoutCompositionNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
            )
            .array(),
          z.lazy(
            () =>
              PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => PromptCompositionBlockCreateManyCompositionInputEnvelopeSchema,
        )
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateManyWithoutCompositionNestedInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateManyWithoutCompositionNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(
            () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () => PromptCompositionBlockCreateWithoutCompositionInputSchema,
            )
            .array(),
          z.lazy(
            () =>
              PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      createMany: z
        .lazy(
          () => PromptCompositionBlockCreateManyCompositionInputEnvelopeSchema,
        )
        .optional(),
      set: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
          z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInputSchema,
          ),
          z
            .lazy(
              () =>
                PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInputSchema,
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionCreateNestedOneWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionCreateNestedOneWithoutBlocksInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionCreateWithoutBlocksInputSchema),
          z.lazy(
            () => PromptCompositionUncheckedCreateWithoutBlocksInputSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PromptCompositionCreateOrConnectWithoutBlocksInputSchema)
        .optional(),
      connect: z.lazy(() => PromptCompositionWhereUniqueInputSchema).optional(),
    })
    .strict();

export const PromptBlockCreateNestedOneWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockCreateNestedOneWithoutUsedInCompositionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutUsedInCompositionsInputSchema),
          z.lazy(
            () =>
              PromptBlockUncheckedCreateWithoutUsedInCompositionsInputSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PromptBlockCreateOrConnectWithoutUsedInCompositionsInputSchema,
        )
        .optional(),
      connect: z.lazy(() => PromptBlockWhereUniqueInputSchema).optional(),
    })
    .strict();

export const PromptCompositionUpdateOneRequiredWithoutBlocksNestedInputSchema: z.ZodType<Prisma.PromptCompositionUpdateOneRequiredWithoutBlocksNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptCompositionCreateWithoutBlocksInputSchema),
          z.lazy(
            () => PromptCompositionUncheckedCreateWithoutBlocksInputSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => PromptCompositionCreateOrConnectWithoutBlocksInputSchema)
        .optional(),
      upsert: z
        .lazy(() => PromptCompositionUpsertWithoutBlocksInputSchema)
        .optional(),
      connect: z.lazy(() => PromptCompositionWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(
            () => PromptCompositionUpdateToOneWithWhereWithoutBlocksInputSchema,
          ),
          z.lazy(() => PromptCompositionUpdateWithoutBlocksInputSchema),
          z.lazy(
            () => PromptCompositionUncheckedUpdateWithoutBlocksInputSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUpdateOneRequiredWithoutUsedInCompositionsNestedInputSchema: z.ZodType<Prisma.PromptBlockUpdateOneRequiredWithoutUsedInCompositionsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => PromptBlockCreateWithoutUsedInCompositionsInputSchema),
          z.lazy(
            () =>
              PromptBlockUncheckedCreateWithoutUsedInCompositionsInputSchema,
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => PromptBlockCreateOrConnectWithoutUsedInCompositionsInputSchema,
        )
        .optional(),
      upsert: z
        .lazy(() => PromptBlockUpsertWithoutUsedInCompositionsInputSchema)
        .optional(),
      connect: z.lazy(() => PromptBlockWhereUniqueInputSchema).optional(),
      update: z
        .union([
          z.lazy(
            () =>
              PromptBlockUpdateToOneWithWhereWithoutUsedInCompositionsInputSchema,
          ),
          z.lazy(() => PromptBlockUpdateWithoutUsedInCompositionsInputSchema),
          z.lazy(
            () =>
              PromptBlockUncheckedUpdateWithoutUsedInCompositionsInputSchema,
          ),
        ])
        .optional(),
    })
    .strict();

export const NestedStringFilterSchema: z.ZodType<Prisma.NestedStringFilter> = z
  .object({
    equals: z.string().optional(),
    in: z.string().array().optional(),
    notIn: z.string().array().optional(),
    lt: z.string().optional(),
    lte: z.string().optional(),
    gt: z.string().optional(),
    gte: z.string().optional(),
    contains: z.string().optional(),
    startsWith: z.string().optional(),
    endsWith: z.string().optional(),
    not: z
      .union([z.string(), z.lazy(() => NestedStringFilterSchema)])
      .optional(),
  })
  .strict();

export const NestedStringNullableFilterSchema: z.ZodType<Prisma.NestedStringNullableFilter> =
  z
    .object({
      equals: z.string().optional().nullable(),
      in: z.string().array().optional().nullable(),
      notIn: z.string().array().optional().nullable(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      not: z
        .union([z.string(), z.lazy(() => NestedStringNullableFilterSchema)])
        .optional()
        .nullable(),
    })
    .strict();

export const NestedDateTimeNullableFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableFilter> =
  z
    .object({
      equals: z.coerce.date().optional().nullable(),
      in: z.coerce.date().array().optional().nullable(),
      notIn: z.coerce.date().array().optional().nullable(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeNullableFilterSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const NestedDateTimeFilterSchema: z.ZodType<Prisma.NestedDateTimeFilter> =
  z
    .object({
      equals: z.coerce.date().optional(),
      in: z.coerce.date().array().optional(),
      notIn: z.coerce.date().array().optional(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([z.coerce.date(), z.lazy(() => NestedDateTimeFilterSchema)])
        .optional(),
    })
    .strict();

export const NestedStringWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringWithAggregatesFilter> =
  z
    .object({
      equals: z.string().optional(),
      in: z.string().array().optional(),
      notIn: z.string().array().optional(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      not: z
        .union([
          z.string(),
          z.lazy(() => NestedStringWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedStringFilterSchema).optional(),
      _max: z.lazy(() => NestedStringFilterSchema).optional(),
    })
    .strict();

export const NestedIntFilterSchema: z.ZodType<Prisma.NestedIntFilter> = z
  .object({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z.union([z.number(), z.lazy(() => NestedIntFilterSchema)]).optional(),
  })
  .strict();

export const NestedStringNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedStringNullableWithAggregatesFilter> =
  z
    .object({
      equals: z.string().optional().nullable(),
      in: z.string().array().optional().nullable(),
      notIn: z.string().array().optional().nullable(),
      lt: z.string().optional(),
      lte: z.string().optional(),
      gt: z.string().optional(),
      gte: z.string().optional(),
      contains: z.string().optional(),
      startsWith: z.string().optional(),
      endsWith: z.string().optional(),
      not: z
        .union([
          z.string(),
          z.lazy(() => NestedStringNullableWithAggregatesFilterSchema),
        ])
        .optional()
        .nullable(),
      _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
      _min: z.lazy(() => NestedStringNullableFilterSchema).optional(),
      _max: z.lazy(() => NestedStringNullableFilterSchema).optional(),
    })
    .strict();

export const NestedIntNullableFilterSchema: z.ZodType<Prisma.NestedIntNullableFilter> =
  z
    .object({
      equals: z.number().optional().nullable(),
      in: z.number().array().optional().nullable(),
      notIn: z.number().array().optional().nullable(),
      lt: z.number().optional(),
      lte: z.number().optional(),
      gt: z.number().optional(),
      gte: z.number().optional(),
      not: z
        .union([z.number(), z.lazy(() => NestedIntNullableFilterSchema)])
        .optional()
        .nullable(),
    })
    .strict();

export const NestedDateTimeNullableWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeNullableWithAggregatesFilter> =
  z
    .object({
      equals: z.coerce.date().optional().nullable(),
      in: z.coerce.date().array().optional().nullable(),
      notIn: z.coerce.date().array().optional().nullable(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeNullableWithAggregatesFilterSchema),
        ])
        .optional()
        .nullable(),
      _count: z.lazy(() => NestedIntNullableFilterSchema).optional(),
      _min: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
      _max: z.lazy(() => NestedDateTimeNullableFilterSchema).optional(),
    })
    .strict();

export const NestedDateTimeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedDateTimeWithAggregatesFilter> =
  z
    .object({
      equals: z.coerce.date().optional(),
      in: z.coerce.date().array().optional(),
      notIn: z.coerce.date().array().optional(),
      lt: z.coerce.date().optional(),
      lte: z.coerce.date().optional(),
      gt: z.coerce.date().optional(),
      gte: z.coerce.date().optional(),
      not: z
        .union([
          z.coerce.date(),
          z.lazy(() => NestedDateTimeWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedDateTimeFilterSchema).optional(),
      _max: z.lazy(() => NestedDateTimeFilterSchema).optional(),
    })
    .strict();

export const NestedBoolFilterSchema: z.ZodType<Prisma.NestedBoolFilter> = z
  .object({
    equals: z.boolean().optional(),
    not: z
      .union([z.boolean(), z.lazy(() => NestedBoolFilterSchema)])
      .optional(),
  })
  .strict();

export const NestedBoolWithAggregatesFilterSchema: z.ZodType<Prisma.NestedBoolWithAggregatesFilter> =
  z
    .object({
      equals: z.boolean().optional(),
      not: z
        .union([
          z.boolean(),
          z.lazy(() => NestedBoolWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedBoolFilterSchema).optional(),
      _max: z.lazy(() => NestedBoolFilterSchema).optional(),
    })
    .strict();

export const NestedJsonNullableFilterSchema: z.ZodType<Prisma.NestedJsonNullableFilter> =
  z
    .object({
      equals: InputJsonValueSchema.optional(),
      path: z.string().array().optional(),
      mode: z.lazy(() => QueryModeSchema).optional(),
      string_contains: z.string().optional(),
      string_starts_with: z.string().optional(),
      string_ends_with: z.string().optional(),
      array_starts_with: InputJsonValueSchema.optional().nullable(),
      array_ends_with: InputJsonValueSchema.optional().nullable(),
      array_contains: InputJsonValueSchema.optional().nullable(),
      lt: InputJsonValueSchema.optional(),
      lte: InputJsonValueSchema.optional(),
      gt: InputJsonValueSchema.optional(),
      gte: InputJsonValueSchema.optional(),
      not: InputJsonValueSchema.optional(),
    })
    .strict();

export const NestedEnumTaskStatusFilterSchema: z.ZodType<Prisma.NestedEnumTaskStatusFilter> =
  z
    .object({
      equals: z.lazy(() => TaskStatusSchema).optional(),
      in: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => NestedEnumTaskStatusFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const NestedEnumTaskStatusWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumTaskStatusWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => TaskStatusSchema).optional(),
      in: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => TaskStatusSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => TaskStatusSchema),
          z.lazy(() => NestedEnumTaskStatusWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumTaskStatusFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumTaskStatusFilterSchema).optional(),
    })
    .strict();

export const NestedEnumPromptBlockCategoryFilterSchema: z.ZodType<Prisma.NestedEnumPromptBlockCategoryFilter> =
  z
    .object({
      equals: z.lazy(() => PromptBlockCategorySchema).optional(),
      in: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const NestedEnumPromptBlockCategoryWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPromptBlockCategoryWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => PromptBlockCategorySchema).optional(),
      in: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptBlockCategorySchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => NestedEnumPromptBlockCategoryWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumPromptBlockCategoryFilterSchema).optional(),
    })
    .strict();

export const NestedIntWithAggregatesFilterSchema: z.ZodType<Prisma.NestedIntWithAggregatesFilter> =
  z
    .object({
      equals: z.number().optional(),
      in: z.number().array().optional(),
      notIn: z.number().array().optional(),
      lt: z.number().optional(),
      lte: z.number().optional(),
      gt: z.number().optional(),
      gte: z.number().optional(),
      not: z
        .union([z.number(), z.lazy(() => NestedIntWithAggregatesFilterSchema)])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _avg: z.lazy(() => NestedFloatFilterSchema).optional(),
      _sum: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedIntFilterSchema).optional(),
      _max: z.lazy(() => NestedIntFilterSchema).optional(),
    })
    .strict();

export const NestedFloatFilterSchema: z.ZodType<Prisma.NestedFloatFilter> = z
  .object({
    equals: z.number().optional(),
    in: z.number().array().optional(),
    notIn: z.number().array().optional(),
    lt: z.number().optional(),
    lte: z.number().optional(),
    gt: z.number().optional(),
    gte: z.number().optional(),
    not: z
      .union([z.number(), z.lazy(() => NestedFloatFilterSchema)])
      .optional(),
  })
  .strict();

export const NestedEnumPromptPurposeFilterSchema: z.ZodType<Prisma.NestedEnumPromptPurposeFilter> =
  z
    .object({
      equals: z.lazy(() => PromptPurposeSchema).optional(),
      in: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => NestedEnumPromptPurposeFilterSchema),
        ])
        .optional(),
    })
    .strict();

export const NestedEnumPromptPurposeWithAggregatesFilterSchema: z.ZodType<Prisma.NestedEnumPromptPurposeWithAggregatesFilter> =
  z
    .object({
      equals: z.lazy(() => PromptPurposeSchema).optional(),
      in: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      notIn: z
        .lazy(() => PromptPurposeSchema)
        .array()
        .optional(),
      not: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => NestedEnumPromptPurposeWithAggregatesFilterSchema),
        ])
        .optional(),
      _count: z.lazy(() => NestedIntFilterSchema).optional(),
      _min: z.lazy(() => NestedEnumPromptPurposeFilterSchema).optional(),
      _max: z.lazy(() => NestedEnumPromptPurposeFilterSchema).optional(),
    })
    .strict();

export const AccountCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      type: z.string().optional(),
      provider: z.string(),
      providerAccountId: z.string(),
      refreshToken: z.string().optional().nullable(),
      accessToken: z.string().optional().nullable(),
      expiresAt: z.coerce.date().optional().nullable(),
      tokenType: z.string().optional().nullable(),
      scope: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
      sessionState: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const AccountUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      type: z.string().optional(),
      provider: z.string(),
      providerAccountId: z.string(),
      refreshToken: z.string().optional().nullable(),
      accessToken: z.string().optional().nullable(),
      expiresAt: z.coerce.date().optional().nullable(),
      tokenType: z.string().optional().nullable(),
      scope: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
      sessionState: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const AccountCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.AccountCreateOrConnectWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => AccountWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => AccountCreateWithoutUserInputSchema),
        z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const AccountCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.AccountCreateManyUserInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => AccountCreateManyUserInputSchema),
        z.lazy(() => AccountCreateManyUserInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const SessionCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      sessionToken: z.string(),
      expires: z.coerce.date(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const SessionUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      sessionToken: z.string(),
      expires: z.coerce.date(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const SessionCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.SessionCreateOrConnectWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => SessionWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => SessionCreateWithoutUserInputSchema),
        z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const SessionCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.SessionCreateManyUserInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => SessionCreateManyUserInputSchema),
        z.lazy(() => SessionCreateManyUserInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserRoleCreateWithoutUserInputSchema: z.ZodType<Prisma.UserRoleCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      role: z.lazy(() => RoleCreateNestedOneWithoutUsersInputSchema),
    })
    .strict();

export const UserRoleUncheckedCreateWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUncheckedCreateWithoutUserInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const UserRoleCreateOrConnectWithoutUserInputSchema: z.ZodType<Prisma.UserRoleCreateOrConnectWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => UserRoleCreateWithoutUserInputSchema),
        z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const UserRoleCreateManyUserInputEnvelopeSchema: z.ZodType<Prisma.UserRoleCreateManyUserInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => UserRoleCreateManyUserInputSchema),
        z.lazy(() => UserRoleCreateManyUserInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AccountUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpsertWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => AccountWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => AccountUpdateWithoutUserInputSchema),
        z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema),
      ]),
      create: z.union([
        z.lazy(() => AccountCreateWithoutUserInputSchema),
        z.lazy(() => AccountUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const AccountUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => AccountWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => AccountUpdateWithoutUserInputSchema),
        z.lazy(() => AccountUncheckedUpdateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const AccountUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateManyWithWhereWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => AccountScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => AccountUpdateManyMutationInputSchema),
        z.lazy(() => AccountUncheckedUpdateManyWithoutUserInputSchema),
      ]),
    })
    .strict();

export const AccountScalarWhereInputSchema: z.ZodType<Prisma.AccountScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => AccountScalarWhereInputSchema),
          z.lazy(() => AccountScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => AccountScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => AccountScalarWhereInputSchema),
          z.lazy(() => AccountScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      userId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      type: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      provider: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      providerAccountId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      refreshToken: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      accessToken: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      expiresAt: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
      tokenType: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      scope: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      idToken: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      sessionState: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    })
    .strict();

export const SessionUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpsertWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => SessionWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => SessionUpdateWithoutUserInputSchema),
        z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema),
      ]),
      create: z.union([
        z.lazy(() => SessionCreateWithoutUserInputSchema),
        z.lazy(() => SessionUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const SessionUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => SessionWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => SessionUpdateWithoutUserInputSchema),
        z.lazy(() => SessionUncheckedUpdateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const SessionUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateManyWithWhereWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => SessionScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => SessionUpdateManyMutationInputSchema),
        z.lazy(() => SessionUncheckedUpdateManyWithoutUserInputSchema),
      ]),
    })
    .strict();

export const SessionScalarWhereInputSchema: z.ZodType<Prisma.SessionScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => SessionScalarWhereInputSchema),
          z.lazy(() => SessionScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => SessionScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => SessionScalarWhereInputSchema),
          z.lazy(() => SessionScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      sessionToken: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      userId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      expires: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      ipAddress: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      userAgent: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    })
    .strict();

export const UserRoleUpsertWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUpsertWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => UserRoleUpdateWithoutUserInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateWithoutUserInputSchema),
      ]),
      create: z.union([
        z.lazy(() => UserRoleCreateWithoutUserInputSchema),
        z.lazy(() => UserRoleUncheckedCreateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const UserRoleUpdateWithWhereUniqueWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUpdateWithWhereUniqueWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => UserRoleUpdateWithoutUserInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateWithoutUserInputSchema),
      ]),
    })
    .strict();

export const UserRoleUpdateManyWithWhereWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUpdateManyWithWhereWithoutUserInput> =
  z
    .object({
      where: z.lazy(() => UserRoleScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => UserRoleUpdateManyMutationInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateManyWithoutUserInputSchema),
      ]),
    })
    .strict();

export const UserRoleScalarWhereInputSchema: z.ZodType<Prisma.UserRoleScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => UserRoleScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => UserRoleScalarWhereInputSchema),
          z.lazy(() => UserRoleScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      userId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      roleId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      expiresAt: z
        .union([z.lazy(() => DateTimeNullableFilterSchema), z.coerce.date()])
        .optional()
        .nullable(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      createdBy: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    })
    .strict();

export const UserCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateWithoutAccountsInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      sessions: z
        .lazy(() => SessionCreateNestedManyWithoutUserInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedCreateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutAccountsInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      sessions: z
        .lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserCreateOrConnectWithoutAccountsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutAccountsInput> =
  z
    .object({
      where: z.lazy(() => UserWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => UserCreateWithoutAccountsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema),
      ]),
    })
    .strict();

export const UserUpsertWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpsertWithoutAccountsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => UserUpdateWithoutAccountsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema),
      ]),
      create: z.union([
        z.lazy(() => UserCreateWithoutAccountsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutAccountsInputSchema),
      ]),
      where: z.lazy(() => UserWhereInputSchema).optional(),
    })
    .strict();

export const UserUpdateToOneWithWhereWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutAccountsInput> =
  z
    .object({
      where: z.lazy(() => UserWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => UserUpdateWithoutAccountsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutAccountsInputSchema),
      ]),
    })
    .strict();

export const UserUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUpdateWithoutAccountsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessions: z
        .lazy(() => SessionUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedUpdateWithoutAccountsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutAccountsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessions: z
        .lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateWithoutSessionsInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      accounts: z
        .lazy(() => AccountCreateNestedManyWithoutUserInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedCreateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutSessionsInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      accounts: z
        .lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserCreateOrConnectWithoutSessionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutSessionsInput> =
  z
    .object({
      where: z.lazy(() => UserWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => UserCreateWithoutSessionsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema),
      ]),
    })
    .strict();

export const UserUpsertWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutSessionsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => UserUpdateWithoutSessionsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema),
      ]),
      create: z.union([
        z.lazy(() => UserCreateWithoutSessionsInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutSessionsInputSchema),
      ]),
      where: z.lazy(() => UserWhereInputSchema).optional(),
    })
    .strict();

export const UserUpdateToOneWithWhereWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutSessionsInput> =
  z
    .object({
      where: z.lazy(() => UserWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => UserUpdateWithoutSessionsInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutSessionsInputSchema),
      ]),
    })
    .strict();

export const UserUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUpdateWithoutSessionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      accounts: z
        .lazy(() => AccountUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSessionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      accounts: z
        .lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      roles: z
        .lazy(() => UserRoleUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionCreateWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionCreateWithoutRoleInput> =
  z
    .object({
      id: z.string().optional(),
      createdAt: z.coerce.date().optional(),
      permission: z.lazy(
        () => PermissionCreateNestedOneWithoutRolesInputSchema,
      ),
    })
    .strict();

export const RolePermissionUncheckedCreateWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUncheckedCreateWithoutRoleInput> =
  z
    .object({
      id: z.string().optional(),
      permissionId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const RolePermissionCreateOrConnectWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionCreateOrConnectWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
        z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const RolePermissionCreateManyRoleInputEnvelopeSchema: z.ZodType<Prisma.RolePermissionCreateManyRoleInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => RolePermissionCreateManyRoleInputSchema),
        z.lazy(() => RolePermissionCreateManyRoleInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserRoleCreateWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleCreateWithoutRoleInput> =
  z
    .object({
      id: z.string().optional(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      user: z.lazy(() => UserCreateNestedOneWithoutRolesInputSchema),
    })
    .strict();

export const UserRoleUncheckedCreateWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUncheckedCreateWithoutRoleInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const UserRoleCreateOrConnectWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleCreateOrConnectWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
        z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const UserRoleCreateManyRoleInputEnvelopeSchema: z.ZodType<Prisma.UserRoleCreateManyRoleInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => UserRoleCreateManyRoleInputSchema),
        z.lazy(() => UserRoleCreateManyRoleInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const RolePermissionUpsertWithWhereUniqueWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUpsertWithWhereUniqueWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => RolePermissionUpdateWithoutRoleInputSchema),
        z.lazy(() => RolePermissionUncheckedUpdateWithoutRoleInputSchema),
      ]),
      create: z.union([
        z.lazy(() => RolePermissionCreateWithoutRoleInputSchema),
        z.lazy(() => RolePermissionUncheckedCreateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const RolePermissionUpdateWithWhereUniqueWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUpdateWithWhereUniqueWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => RolePermissionUpdateWithoutRoleInputSchema),
        z.lazy(() => RolePermissionUncheckedUpdateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const RolePermissionUpdateManyWithWhereWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUpdateManyWithWhereWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => RolePermissionUpdateManyMutationInputSchema),
        z.lazy(() => RolePermissionUncheckedUpdateManyWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const RolePermissionScalarWhereInputSchema: z.ZodType<Prisma.RolePermissionScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => RolePermissionScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => RolePermissionScalarWhereInputSchema),
          z.lazy(() => RolePermissionScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      roleId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      permissionId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
    })
    .strict();

export const UserRoleUpsertWithWhereUniqueWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUpsertWithWhereUniqueWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => UserRoleUpdateWithoutRoleInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateWithoutRoleInputSchema),
      ]),
      create: z.union([
        z.lazy(() => UserRoleCreateWithoutRoleInputSchema),
        z.lazy(() => UserRoleUncheckedCreateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const UserRoleUpdateWithWhereUniqueWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUpdateWithWhereUniqueWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => UserRoleWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => UserRoleUpdateWithoutRoleInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const UserRoleUpdateManyWithWhereWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUpdateManyWithWhereWithoutRoleInput> =
  z
    .object({
      where: z.lazy(() => UserRoleScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => UserRoleUpdateManyMutationInputSchema),
        z.lazy(() => UserRoleUncheckedUpdateManyWithoutRoleInputSchema),
      ]),
    })
    .strict();

export const RolePermissionCreateWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionCreateWithoutPermissionInput> =
  z
    .object({
      id: z.string().optional(),
      createdAt: z.coerce.date().optional(),
      role: z.lazy(() => RoleCreateNestedOneWithoutPermissionsInputSchema),
    })
    .strict();

export const RolePermissionUncheckedCreateWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUncheckedCreateWithoutPermissionInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const RolePermissionCreateOrConnectWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionCreateOrConnectWithoutPermissionInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
        z.lazy(() => RolePermissionUncheckedCreateWithoutPermissionInputSchema),
      ]),
    })
    .strict();

export const RolePermissionCreateManyPermissionInputEnvelopeSchema: z.ZodType<Prisma.RolePermissionCreateManyPermissionInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => RolePermissionCreateManyPermissionInputSchema),
        z.lazy(() => RolePermissionCreateManyPermissionInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const RolePermissionUpsertWithWhereUniqueWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUpsertWithWhereUniqueWithoutPermissionInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => RolePermissionUpdateWithoutPermissionInputSchema),
        z.lazy(() => RolePermissionUncheckedUpdateWithoutPermissionInputSchema),
      ]),
      create: z.union([
        z.lazy(() => RolePermissionCreateWithoutPermissionInputSchema),
        z.lazy(() => RolePermissionUncheckedCreateWithoutPermissionInputSchema),
      ]),
    })
    .strict();

export const RolePermissionUpdateWithWhereUniqueWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUpdateWithWhereUniqueWithoutPermissionInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => RolePermissionUpdateWithoutPermissionInputSchema),
        z.lazy(() => RolePermissionUncheckedUpdateWithoutPermissionInputSchema),
      ]),
    })
    .strict();

export const RolePermissionUpdateManyWithWhereWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUpdateManyWithWhereWithoutPermissionInput> =
  z
    .object({
      where: z.lazy(() => RolePermissionScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => RolePermissionUpdateManyMutationInputSchema),
        z.lazy(
          () => RolePermissionUncheckedUpdateManyWithoutPermissionInputSchema,
        ),
      ]),
    })
    .strict();

export const RoleCreateWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleCreateWithoutPermissionsInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      users: z
        .lazy(() => UserRoleCreateNestedManyWithoutRoleInputSchema)
        .optional(),
    })
    .strict();

export const RoleUncheckedCreateWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleUncheckedCreateWithoutPermissionsInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      users: z
        .lazy(() => UserRoleUncheckedCreateNestedManyWithoutRoleInputSchema)
        .optional(),
    })
    .strict();

export const RoleCreateOrConnectWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleCreateOrConnectWithoutPermissionsInput> =
  z
    .object({
      where: z.lazy(() => RoleWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => RoleCreateWithoutPermissionsInputSchema),
        z.lazy(() => RoleUncheckedCreateWithoutPermissionsInputSchema),
      ]),
    })
    .strict();

export const PermissionCreateWithoutRolesInputSchema: z.ZodType<Prisma.PermissionCreateWithoutRolesInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      resource: z.string(),
      action: z.string(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PermissionUncheckedCreateWithoutRolesInputSchema: z.ZodType<Prisma.PermissionUncheckedCreateWithoutRolesInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      resource: z.string(),
      action: z.string(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PermissionCreateOrConnectWithoutRolesInputSchema: z.ZodType<Prisma.PermissionCreateOrConnectWithoutRolesInput> =
  z
    .object({
      where: z.lazy(() => PermissionWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PermissionCreateWithoutRolesInputSchema),
        z.lazy(() => PermissionUncheckedCreateWithoutRolesInputSchema),
      ]),
    })
    .strict();

export const RoleUpsertWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleUpsertWithoutPermissionsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => RoleUpdateWithoutPermissionsInputSchema),
        z.lazy(() => RoleUncheckedUpdateWithoutPermissionsInputSchema),
      ]),
      create: z.union([
        z.lazy(() => RoleCreateWithoutPermissionsInputSchema),
        z.lazy(() => RoleUncheckedCreateWithoutPermissionsInputSchema),
      ]),
      where: z.lazy(() => RoleWhereInputSchema).optional(),
    })
    .strict();

export const RoleUpdateToOneWithWhereWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleUpdateToOneWithWhereWithoutPermissionsInput> =
  z
    .object({
      where: z.lazy(() => RoleWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => RoleUpdateWithoutPermissionsInputSchema),
        z.lazy(() => RoleUncheckedUpdateWithoutPermissionsInputSchema),
      ]),
    })
    .strict();

export const RoleUpdateWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleUpdateWithoutPermissionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      users: z
        .lazy(() => UserRoleUpdateManyWithoutRoleNestedInputSchema)
        .optional(),
    })
    .strict();

export const RoleUncheckedUpdateWithoutPermissionsInputSchema: z.ZodType<Prisma.RoleUncheckedUpdateWithoutPermissionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      users: z
        .lazy(() => UserRoleUncheckedUpdateManyWithoutRoleNestedInputSchema)
        .optional(),
    })
    .strict();

export const PermissionUpsertWithoutRolesInputSchema: z.ZodType<Prisma.PermissionUpsertWithoutRolesInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PermissionUpdateWithoutRolesInputSchema),
        z.lazy(() => PermissionUncheckedUpdateWithoutRolesInputSchema),
      ]),
      create: z.union([
        z.lazy(() => PermissionCreateWithoutRolesInputSchema),
        z.lazy(() => PermissionUncheckedCreateWithoutRolesInputSchema),
      ]),
      where: z.lazy(() => PermissionWhereInputSchema).optional(),
    })
    .strict();

export const PermissionUpdateToOneWithWhereWithoutRolesInputSchema: z.ZodType<Prisma.PermissionUpdateToOneWithWhereWithoutRolesInput> =
  z
    .object({
      where: z.lazy(() => PermissionWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PermissionUpdateWithoutRolesInputSchema),
        z.lazy(() => PermissionUncheckedUpdateWithoutRolesInputSchema),
      ]),
    })
    .strict();

export const PermissionUpdateWithoutRolesInputSchema: z.ZodType<Prisma.PermissionUpdateWithoutRolesInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PermissionUncheckedUpdateWithoutRolesInputSchema: z.ZodType<Prisma.PermissionUncheckedUpdateWithoutRolesInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      resource: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      action: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserCreateWithoutRolesInputSchema: z.ZodType<Prisma.UserCreateWithoutRolesInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      accounts: z
        .lazy(() => AccountCreateNestedManyWithoutUserInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedCreateWithoutRolesInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutRolesInput> =
  z
    .object({
      id: z.string().optional(),
      email: z.string(),
      name: z.string().optional().nullable(),
      image: z.string().optional().nullable(),
      emailVerified: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      accounts: z
        .lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema)
        .optional(),
    })
    .strict();

export const UserCreateOrConnectWithoutRolesInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutRolesInput> =
  z
    .object({
      where: z.lazy(() => UserWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => UserCreateWithoutRolesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutRolesInputSchema),
      ]),
    })
    .strict();

export const RoleCreateWithoutUsersInputSchema: z.ZodType<Prisma.RoleCreateWithoutUsersInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      permissions: z
        .lazy(() => RolePermissionCreateNestedManyWithoutRoleInputSchema)
        .optional(),
    })
    .strict();

export const RoleUncheckedCreateWithoutUsersInputSchema: z.ZodType<Prisma.RoleUncheckedCreateWithoutUsersInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional().nullable(),
      isSystem: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
      permissions: z
        .lazy(
          () => RolePermissionUncheckedCreateNestedManyWithoutRoleInputSchema,
        )
        .optional(),
    })
    .strict();

export const RoleCreateOrConnectWithoutUsersInputSchema: z.ZodType<Prisma.RoleCreateOrConnectWithoutUsersInput> =
  z
    .object({
      where: z.lazy(() => RoleWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => RoleCreateWithoutUsersInputSchema),
        z.lazy(() => RoleUncheckedCreateWithoutUsersInputSchema),
      ]),
    })
    .strict();

export const UserUpsertWithoutRolesInputSchema: z.ZodType<Prisma.UserUpsertWithoutRolesInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => UserUpdateWithoutRolesInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutRolesInputSchema),
      ]),
      create: z.union([
        z.lazy(() => UserCreateWithoutRolesInputSchema),
        z.lazy(() => UserUncheckedCreateWithoutRolesInputSchema),
      ]),
      where: z.lazy(() => UserWhereInputSchema).optional(),
    })
    .strict();

export const UserUpdateToOneWithWhereWithoutRolesInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutRolesInput> =
  z
    .object({
      where: z.lazy(() => UserWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => UserUpdateWithoutRolesInputSchema),
        z.lazy(() => UserUncheckedUpdateWithoutRolesInputSchema),
      ]),
    })
    .strict();

export const UserUpdateWithoutRolesInputSchema: z.ZodType<Prisma.UserUpdateWithoutRolesInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      accounts: z
        .lazy(() => AccountUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserUncheckedUpdateWithoutRolesInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutRolesInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      email: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      image: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      emailVerified: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      accounts: z
        .lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
      sessions: z
        .lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema)
        .optional(),
    })
    .strict();

export const RoleUpsertWithoutUsersInputSchema: z.ZodType<Prisma.RoleUpsertWithoutUsersInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => RoleUpdateWithoutUsersInputSchema),
        z.lazy(() => RoleUncheckedUpdateWithoutUsersInputSchema),
      ]),
      create: z.union([
        z.lazy(() => RoleCreateWithoutUsersInputSchema),
        z.lazy(() => RoleUncheckedCreateWithoutUsersInputSchema),
      ]),
      where: z.lazy(() => RoleWhereInputSchema).optional(),
    })
    .strict();

export const RoleUpdateToOneWithWhereWithoutUsersInputSchema: z.ZodType<Prisma.RoleUpdateToOneWithWhereWithoutUsersInput> =
  z
    .object({
      where: z.lazy(() => RoleWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => RoleUpdateWithoutUsersInputSchema),
        z.lazy(() => RoleUncheckedUpdateWithoutUsersInputSchema),
      ]),
    })
    .strict();

export const RoleUpdateWithoutUsersInputSchema: z.ZodType<Prisma.RoleUpdateWithoutUsersInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      permissions: z
        .lazy(() => RolePermissionUpdateManyWithoutRoleNestedInputSchema)
        .optional(),
    })
    .strict();

export const RoleUncheckedUpdateWithoutUsersInputSchema: z.ZodType<Prisma.RoleUncheckedUpdateWithoutUsersInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      displayName: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      isSystem: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      permissions: z
        .lazy(
          () => RolePermissionUncheckedUpdateManyWithoutRoleNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockCreateWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockCreateWithoutChildBlocksInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlock: z
        .lazy(() => PromptBlockCreateNestedOneWithoutChildBlocksInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedCreateWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockUncheckedCreateWithoutChildBlocksInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlockId: z.string().optional().nullable(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockCreateOrConnectWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockCreateOrConnectWithoutChildBlocksInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutChildBlocksInputSchema),
        z.lazy(() => PromptBlockUncheckedCreateWithoutChildBlocksInputSchema),
      ]),
    })
    .strict();

export const PromptBlockCreateWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockCreateWithoutParentBlockInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      childBlocks: z
        .lazy(() => PromptBlockCreateNestedManyWithoutParentBlockInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedCreateWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUncheckedCreateWithoutParentBlockInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedCreateNestedManyWithoutParentBlockInputSchema,
        )
        .optional(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedCreateNestedManyWithoutBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockCreateOrConnectWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockCreateOrConnectWithoutParentBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
        z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
      ]),
    })
    .strict();

export const PromptBlockCreateManyParentBlockInputEnvelopeSchema: z.ZodType<Prisma.PromptBlockCreateManyParentBlockInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PromptBlockCreateManyParentBlockInputSchema),
        z.lazy(() => PromptBlockCreateManyParentBlockInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionBlockCreateWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateWithoutBlockInput> =
  z
    .object({
      id: z.string().optional(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      composition: z.lazy(
        () => PromptCompositionCreateNestedOneWithoutBlocksInputSchema,
      ),
    })
    .strict();

export const PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedCreateWithoutBlockInput> =
  z
    .object({
      id: z.string().optional(),
      compositionId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateOrConnectWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateOrConnectWithoutBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
        z.lazy(
          () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockCreateManyBlockInputEnvelopeSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyBlockInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PromptCompositionBlockCreateManyBlockInputSchema),
        z.lazy(() => PromptCompositionBlockCreateManyBlockInputSchema).array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptBlockUpsertWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockUpsertWithoutChildBlocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PromptBlockUpdateWithoutChildBlocksInputSchema),
        z.lazy(() => PromptBlockUncheckedUpdateWithoutChildBlocksInputSchema),
      ]),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutChildBlocksInputSchema),
        z.lazy(() => PromptBlockUncheckedCreateWithoutChildBlocksInputSchema),
      ]),
      where: z.lazy(() => PromptBlockWhereInputSchema).optional(),
    })
    .strict();

export const PromptBlockUpdateToOneWithWhereWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockUpdateToOneWithWhereWithoutChildBlocksInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PromptBlockUpdateWithoutChildBlocksInputSchema),
        z.lazy(() => PromptBlockUncheckedUpdateWithoutChildBlocksInputSchema),
      ]),
    })
    .strict();

export const PromptBlockUpdateWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockUpdateWithoutChildBlocksInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlock: z
        .lazy(() => PromptBlockUpdateOneWithoutChildBlocksNestedInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateWithoutChildBlocksInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateWithoutChildBlocksInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlockId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUpsertWithWhereUniqueWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUpsertWithWhereUniqueWithoutParentBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => PromptBlockUpdateWithoutParentBlockInputSchema),
        z.lazy(() => PromptBlockUncheckedUpdateWithoutParentBlockInputSchema),
      ]),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutParentBlockInputSchema),
        z.lazy(() => PromptBlockUncheckedCreateWithoutParentBlockInputSchema),
      ]),
    })
    .strict();

export const PromptBlockUpdateWithWhereUniqueWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUpdateWithWhereUniqueWithoutParentBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PromptBlockUpdateWithoutParentBlockInputSchema),
        z.lazy(() => PromptBlockUncheckedUpdateWithoutParentBlockInputSchema),
      ]),
    })
    .strict();

export const PromptBlockUpdateManyWithWhereWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUpdateManyWithWhereWithoutParentBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PromptBlockUpdateManyMutationInputSchema),
        z.lazy(
          () => PromptBlockUncheckedUpdateManyWithoutParentBlockInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptBlockScalarWhereInputSchema: z.ZodType<Prisma.PromptBlockScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptBlockScalarWhereInputSchema),
          z.lazy(() => PromptBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptBlockScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptBlockScalarWhereInputSchema),
          z.lazy(() => PromptBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      name: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      category: z
        .union([
          z.lazy(() => EnumPromptBlockCategoryFilterSchema),
          z.lazy(() => PromptBlockCategorySchema),
        ])
        .optional(),
      content: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      description: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
      metadata: z.lazy(() => JsonNullableFilterSchema).optional(),
      version: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
      isActive: z
        .union([z.lazy(() => BoolFilterSchema), z.boolean()])
        .optional(),
      createdAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      updatedAt: z
        .union([z.lazy(() => DateTimeFilterSchema), z.coerce.date()])
        .optional(),
      parentBlockId: z
        .union([z.lazy(() => StringNullableFilterSchema), z.string()])
        .optional()
        .nullable(),
    })
    .strict();

export const PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpsertWithWhereUniqueWithoutBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => PromptCompositionBlockUpdateWithoutBlockInputSchema),
        z.lazy(
          () => PromptCompositionBlockUncheckedUpdateWithoutBlockInputSchema,
        ),
      ]),
      create: z.union([
        z.lazy(() => PromptCompositionBlockCreateWithoutBlockInputSchema),
        z.lazy(
          () => PromptCompositionBlockUncheckedCreateWithoutBlockInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateWithWhereUniqueWithoutBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PromptCompositionBlockUpdateWithoutBlockInputSchema),
        z.lazy(
          () => PromptCompositionBlockUncheckedUpdateWithoutBlockInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockUpdateManyWithWhereWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyWithWhereWithoutBlockInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PromptCompositionBlockUpdateManyMutationInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutBlockInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockScalarWhereInputSchema: z.ZodType<Prisma.PromptCompositionBlockScalarWhereInput> =
  z
    .object({
      AND: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
      OR: z
        .lazy(() => PromptCompositionBlockScalarWhereInputSchema)
        .array()
        .optional(),
      NOT: z
        .union([
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
          z.lazy(() => PromptCompositionBlockScalarWhereInputSchema).array(),
        ])
        .optional(),
      id: z.union([z.lazy(() => StringFilterSchema), z.string()]).optional(),
      compositionId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      blockId: z
        .union([z.lazy(() => StringFilterSchema), z.string()])
        .optional(),
      order: z.union([z.lazy(() => IntFilterSchema), z.number()]).optional(),
      overrides: z.lazy(() => JsonNullableFilterSchema).optional(),
    })
    .strict();

export const PromptCompositionBlockCreateWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateWithoutCompositionInput> =
  z
    .object({
      id: z.string().optional(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      block: z.lazy(
        () => PromptBlockCreateNestedOneWithoutUsedInCompositionsInputSchema,
      ),
    })
    .strict();

export const PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedCreateWithoutCompositionInput> =
  z
    .object({
      id: z.string().optional(),
      blockId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateOrConnectWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateOrConnectWithoutCompositionInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptCompositionBlockCreateWithoutCompositionInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockCreateManyCompositionInputEnvelopeSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyCompositionInputEnvelope> =
  z
    .object({
      data: z.union([
        z.lazy(() => PromptCompositionBlockCreateManyCompositionInputSchema),
        z
          .lazy(() => PromptCompositionBlockCreateManyCompositionInputSchema)
          .array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpsertWithWhereUniqueWithoutCompositionInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      update: z.union([
        z.lazy(() => PromptCompositionBlockUpdateWithoutCompositionInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateWithoutCompositionInputSchema,
        ),
      ]),
      create: z.union([
        z.lazy(() => PromptCompositionBlockCreateWithoutCompositionInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedCreateWithoutCompositionInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateWithWhereUniqueWithoutCompositionInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockWhereUniqueInputSchema),
      data: z.union([
        z.lazy(() => PromptCompositionBlockUpdateWithoutCompositionInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateWithoutCompositionInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyWithWhereWithoutCompositionInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionBlockScalarWhereInputSchema),
      data: z.union([
        z.lazy(() => PromptCompositionBlockUpdateManyMutationInputSchema),
        z.lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutCompositionInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionCreateWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionCreateWithoutBlocksInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      purpose: z.lazy(() => PromptPurposeSchema),
      description: z.string().optional().nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PromptCompositionUncheckedCreateWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionUncheckedCreateWithoutBlocksInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      purpose: z.lazy(() => PromptPurposeSchema),
      description: z.string().optional().nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PromptCompositionCreateOrConnectWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionCreateOrConnectWithoutBlocksInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptCompositionCreateWithoutBlocksInputSchema),
        z.lazy(() => PromptCompositionUncheckedCreateWithoutBlocksInputSchema),
      ]),
    })
    .strict();

export const PromptBlockCreateWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockCreateWithoutUsedInCompositionsInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlock: z
        .lazy(() => PromptBlockCreateNestedOneWithoutChildBlocksInputSchema)
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockCreateNestedManyWithoutParentBlockInputSchema)
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedCreateWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockUncheckedCreateWithoutUsedInCompositionsInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
      parentBlockId: z.string().optional().nullable(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedCreateNestedManyWithoutParentBlockInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockCreateOrConnectWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockCreateOrConnectWithoutUsedInCompositionsInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereUniqueInputSchema),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutUsedInCompositionsInputSchema),
        z.lazy(
          () => PromptBlockUncheckedCreateWithoutUsedInCompositionsInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptCompositionUpsertWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionUpsertWithoutBlocksInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PromptCompositionUpdateWithoutBlocksInputSchema),
        z.lazy(() => PromptCompositionUncheckedUpdateWithoutBlocksInputSchema),
      ]),
      create: z.union([
        z.lazy(() => PromptCompositionCreateWithoutBlocksInputSchema),
        z.lazy(() => PromptCompositionUncheckedCreateWithoutBlocksInputSchema),
      ]),
      where: z.lazy(() => PromptCompositionWhereInputSchema).optional(),
    })
    .strict();

export const PromptCompositionUpdateToOneWithWhereWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionUpdateToOneWithWhereWithoutBlocksInput> =
  z
    .object({
      where: z.lazy(() => PromptCompositionWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PromptCompositionUpdateWithoutBlocksInputSchema),
        z.lazy(() => PromptCompositionUncheckedUpdateWithoutBlocksInputSchema),
      ]),
    })
    .strict();

export const PromptCompositionUpdateWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionUpdateWithoutBlocksInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionUncheckedUpdateWithoutBlocksInputSchema: z.ZodType<Prisma.PromptCompositionUncheckedUpdateWithoutBlocksInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      purpose: z
        .union([
          z.lazy(() => PromptPurposeSchema),
          z.lazy(() => EnumPromptPurposeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      variables: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUpsertWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockUpsertWithoutUsedInCompositionsInput> =
  z
    .object({
      update: z.union([
        z.lazy(() => PromptBlockUpdateWithoutUsedInCompositionsInputSchema),
        z.lazy(
          () => PromptBlockUncheckedUpdateWithoutUsedInCompositionsInputSchema,
        ),
      ]),
      create: z.union([
        z.lazy(() => PromptBlockCreateWithoutUsedInCompositionsInputSchema),
        z.lazy(
          () => PromptBlockUncheckedCreateWithoutUsedInCompositionsInputSchema,
        ),
      ]),
      where: z.lazy(() => PromptBlockWhereInputSchema).optional(),
    })
    .strict();

export const PromptBlockUpdateToOneWithWhereWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockUpdateToOneWithWhereWithoutUsedInCompositionsInput> =
  z
    .object({
      where: z.lazy(() => PromptBlockWhereInputSchema).optional(),
      data: z.union([
        z.lazy(() => PromptBlockUpdateWithoutUsedInCompositionsInputSchema),
        z.lazy(
          () => PromptBlockUncheckedUpdateWithoutUsedInCompositionsInputSchema,
        ),
      ]),
    })
    .strict();

export const PromptBlockUpdateWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockUpdateWithoutUsedInCompositionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlock: z
        .lazy(() => PromptBlockUpdateOneWithoutChildBlocksNestedInputSchema)
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockUpdateManyWithoutParentBlockNestedInputSchema)
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateWithoutUsedInCompositionsInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateWithoutUsedInCompositionsInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      parentBlockId: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedUpdateManyWithoutParentBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const AccountCreateManyUserInputSchema: z.ZodType<Prisma.AccountCreateManyUserInput> =
  z
    .object({
      id: z.string().optional(),
      type: z.string().optional(),
      provider: z.string(),
      providerAccountId: z.string(),
      refreshToken: z.string().optional().nullable(),
      accessToken: z.string().optional().nullable(),
      expiresAt: z.coerce.date().optional().nullable(),
      tokenType: z.string().optional().nullable(),
      scope: z.string().optional().nullable(),
      idToken: z.string().optional().nullable(),
      sessionState: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const SessionCreateManyUserInputSchema: z.ZodType<Prisma.SessionCreateManyUserInput> =
  z
    .object({
      id: z.string().optional(),
      sessionToken: z.string(),
      expires: z.coerce.date(),
      ipAddress: z.string().optional().nullable(),
      userAgent: z.string().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const UserRoleCreateManyUserInputSchema: z.ZodType<Prisma.UserRoleCreateManyUserInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const AccountUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AccountUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const AccountUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.AccountUncheckedUpdateManyWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      type: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      provider: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      providerAccountId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      refreshToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      accessToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      tokenType: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      scope: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      idToken: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      sessionState: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const SessionUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.SessionUncheckedUpdateManyWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      sessionToken: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expires: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      ipAddress: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      userAgent: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      role: z
        .lazy(() => RoleUpdateOneRequiredWithoutUsersNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserRoleUncheckedUpdateWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const UserRoleUncheckedUpdateManyWithoutUserInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateManyWithoutUserInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const RolePermissionCreateManyRoleInputSchema: z.ZodType<Prisma.RolePermissionCreateManyRoleInput> =
  z
    .object({
      id: z.string().optional(),
      permissionId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const UserRoleCreateManyRoleInputSchema: z.ZodType<Prisma.UserRoleCreateManyRoleInput> =
  z
    .object({
      id: z.string().optional(),
      userId: z.string(),
      expiresAt: z.coerce.date().optional().nullable(),
      createdAt: z.coerce.date().optional(),
      createdBy: z.string().optional().nullable(),
    })
    .strict();

export const RolePermissionUpdateWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUpdateWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      permission: z
        .lazy(() => PermissionUpdateOneRequiredWithoutRolesNestedInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      permissionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateManyWithoutRoleInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateManyWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      permissionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const UserRoleUpdateWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUpdateWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      user: z
        .lazy(() => UserUpdateOneRequiredWithoutRolesNestedInputSchema)
        .optional(),
    })
    .strict();

export const UserRoleUncheckedUpdateWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const UserRoleUncheckedUpdateManyWithoutRoleInputSchema: z.ZodType<Prisma.UserRoleUncheckedUpdateManyWithoutRoleInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      userId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      expiresAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdBy: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
    })
    .strict();

export const RolePermissionCreateManyPermissionInputSchema: z.ZodType<Prisma.RolePermissionCreateManyPermissionInput> =
  z
    .object({
      id: z.string().optional(),
      roleId: z.string(),
      createdAt: z.coerce.date().optional(),
    })
    .strict();

export const RolePermissionUpdateWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUpdateWithoutPermissionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      role: z
        .lazy(() => RoleUpdateOneRequiredWithoutPermissionsNestedInputSchema)
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateWithoutPermissionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const RolePermissionUncheckedUpdateManyWithoutPermissionInputSchema: z.ZodType<Prisma.RolePermissionUncheckedUpdateManyWithoutPermissionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      roleId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptBlockCreateManyParentBlockInputSchema: z.ZodType<Prisma.PromptBlockCreateManyParentBlockInput> =
  z
    .object({
      id: z.string().optional(),
      name: z.string(),
      category: z.lazy(() => PromptBlockCategorySchema),
      content: z.string(),
      description: z.string().optional().nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z.number().optional(),
      isActive: z.boolean().optional(),
      createdAt: z.coerce.date().optional(),
      updatedAt: z.coerce.date().optional(),
    })
    .strict();

export const PromptCompositionBlockCreateManyBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyBlockInput> =
  z
    .object({
      id: z.string().optional(),
      compositionId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptBlockUpdateWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUpdateWithoutParentBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      childBlocks: z
        .lazy(() => PromptBlockUpdateManyWithoutParentBlockNestedInputSchema)
        .optional(),
      usedInCompositions: z
        .lazy(
          () => PromptCompositionBlockUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateWithoutParentBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      childBlocks: z
        .lazy(
          () =>
            PromptBlockUncheckedUpdateManyWithoutParentBlockNestedInputSchema,
        )
        .optional(),
      usedInCompositions: z
        .lazy(
          () =>
            PromptCompositionBlockUncheckedUpdateManyWithoutBlockNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptBlockUncheckedUpdateManyWithoutParentBlockInputSchema: z.ZodType<Prisma.PromptBlockUncheckedUpdateManyWithoutParentBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      name: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      category: z
        .union([
          z.lazy(() => PromptBlockCategorySchema),
          z.lazy(() => EnumPromptBlockCategoryFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      content: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      description: z
        .union([
          z.string(),
          z.lazy(() => NullableStringFieldUpdateOperationsInputSchema),
        ])
        .optional()
        .nullable(),
      metadata: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      version: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      isActive: z
        .union([
          z.boolean(),
          z.lazy(() => BoolFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      createdAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      updatedAt: z
        .union([
          z.coerce.date(),
          z.lazy(() => DateTimeFieldUpdateOperationsInputSchema),
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateWithoutBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      composition: z
        .lazy(
          () =>
            PromptCompositionUpdateOneRequiredWithoutBlocksNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateWithoutBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      compositionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateManyWithoutBlockInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateManyWithoutBlockInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      compositionId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockCreateManyCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyCompositionInput> =
  z
    .object({
      id: z.string().optional(),
      blockId: z.string(),
      order: z.number(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateWithoutCompositionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
      block: z
        .lazy(
          () =>
            PromptBlockUpdateOneRequiredWithoutUsedInCompositionsNestedInputSchema,
        )
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateWithoutCompositionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blockId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

export const PromptCompositionBlockUncheckedUpdateManyWithoutCompositionInputSchema: z.ZodType<Prisma.PromptCompositionBlockUncheckedUpdateManyWithoutCompositionInput> =
  z
    .object({
      id: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      blockId: z
        .union([
          z.string(),
          z.lazy(() => StringFieldUpdateOperationsInputSchema),
        ])
        .optional(),
      order: z
        .union([z.number(), z.lazy(() => IntFieldUpdateOperationsInputSchema)])
        .optional(),
      overrides: z
        .union([
          z.lazy(() => NullableJsonNullValueInputSchema),
          InputJsonValueSchema,
        ])
        .optional(),
    })
    .strict();

/////////////////////////////////////////
// ARGS
/////////////////////////////////////////

export const UserFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.UserFindFirstArgs, "select" | "include">
> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const UserFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.UserFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const UserFindManyArgsSchema: z.ZodType<
  Omit<Prisma.UserFindManyArgs, "select" | "include">
> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([UserScalarFieldEnumSchema, UserScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const UserAggregateArgsSchema: z.ZodType<Prisma.UserAggregateArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithRelationInputSchema.array(),
        UserOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const UserGroupByArgsSchema: z.ZodType<Prisma.UserGroupByArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserOrderByWithAggregationInputSchema.array(),
        UserOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: UserScalarFieldEnumSchema.array(),
    having: UserScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const UserFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.UserFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.UserFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const AccountFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.AccountFindFirstArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereInputSchema.optional(),
    orderBy: z
      .union([
        AccountOrderByWithRelationInputSchema.array(),
        AccountOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AccountWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AccountScalarFieldEnumSchema,
        AccountScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AccountFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.AccountFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereInputSchema.optional(),
    orderBy: z
      .union([
        AccountOrderByWithRelationInputSchema.array(),
        AccountOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AccountWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AccountScalarFieldEnumSchema,
        AccountScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AccountFindManyArgsSchema: z.ZodType<
  Omit<Prisma.AccountFindManyArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereInputSchema.optional(),
    orderBy: z
      .union([
        AccountOrderByWithRelationInputSchema.array(),
        AccountOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AccountWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AccountScalarFieldEnumSchema,
        AccountScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AccountAggregateArgsSchema: z.ZodType<Prisma.AccountAggregateArgs> =
  z
    .object({
      where: AccountWhereInputSchema.optional(),
      orderBy: z
        .union([
          AccountOrderByWithRelationInputSchema.array(),
          AccountOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: AccountWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const AccountGroupByArgsSchema: z.ZodType<Prisma.AccountGroupByArgs> = z
  .object({
    where: AccountWhereInputSchema.optional(),
    orderBy: z
      .union([
        AccountOrderByWithAggregationInputSchema.array(),
        AccountOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: AccountScalarFieldEnumSchema.array(),
    having: AccountScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const AccountFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.AccountFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereUniqueInputSchema,
  })
  .strict();

export const AccountFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.AccountFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereUniqueInputSchema,
  })
  .strict();

export const SessionFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.SessionFindFirstArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereInputSchema.optional(),
    orderBy: z
      .union([
        SessionOrderByWithRelationInputSchema.array(),
        SessionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: SessionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        SessionScalarFieldEnumSchema,
        SessionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const SessionFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.SessionFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereInputSchema.optional(),
    orderBy: z
      .union([
        SessionOrderByWithRelationInputSchema.array(),
        SessionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: SessionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        SessionScalarFieldEnumSchema,
        SessionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const SessionFindManyArgsSchema: z.ZodType<
  Omit<Prisma.SessionFindManyArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereInputSchema.optional(),
    orderBy: z
      .union([
        SessionOrderByWithRelationInputSchema.array(),
        SessionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: SessionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        SessionScalarFieldEnumSchema,
        SessionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const SessionAggregateArgsSchema: z.ZodType<Prisma.SessionAggregateArgs> =
  z
    .object({
      where: SessionWhereInputSchema.optional(),
      orderBy: z
        .union([
          SessionOrderByWithRelationInputSchema.array(),
          SessionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: SessionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const SessionGroupByArgsSchema: z.ZodType<Prisma.SessionGroupByArgs> = z
  .object({
    where: SessionWhereInputSchema.optional(),
    orderBy: z
      .union([
        SessionOrderByWithAggregationInputSchema.array(),
        SessionOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: SessionScalarFieldEnumSchema.array(),
    having: SessionScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const SessionFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.SessionFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereUniqueInputSchema,
  })
  .strict();

export const SessionFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.SessionFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereUniqueInputSchema,
  })
  .strict();

export const VerificationFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.VerificationFindFirstArgs, "select">
> = z
  .object({
    where: VerificationWhereInputSchema.optional(),
    orderBy: z
      .union([
        VerificationOrderByWithRelationInputSchema.array(),
        VerificationOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: VerificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        VerificationScalarFieldEnumSchema,
        VerificationScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const VerificationFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.VerificationFindFirstOrThrowArgs, "select">
> = z
  .object({
    where: VerificationWhereInputSchema.optional(),
    orderBy: z
      .union([
        VerificationOrderByWithRelationInputSchema.array(),
        VerificationOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: VerificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        VerificationScalarFieldEnumSchema,
        VerificationScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const VerificationFindManyArgsSchema: z.ZodType<
  Omit<Prisma.VerificationFindManyArgs, "select">
> = z
  .object({
    where: VerificationWhereInputSchema.optional(),
    orderBy: z
      .union([
        VerificationOrderByWithRelationInputSchema.array(),
        VerificationOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: VerificationWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        VerificationScalarFieldEnumSchema,
        VerificationScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const VerificationAggregateArgsSchema: z.ZodType<Prisma.VerificationAggregateArgs> =
  z
    .object({
      where: VerificationWhereInputSchema.optional(),
      orderBy: z
        .union([
          VerificationOrderByWithRelationInputSchema.array(),
          VerificationOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: VerificationWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const VerificationGroupByArgsSchema: z.ZodType<Prisma.VerificationGroupByArgs> =
  z
    .object({
      where: VerificationWhereInputSchema.optional(),
      orderBy: z
        .union([
          VerificationOrderByWithAggregationInputSchema.array(),
          VerificationOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: VerificationScalarFieldEnumSchema.array(),
      having: VerificationScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const VerificationFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.VerificationFindUniqueArgs, "select">
> = z
  .object({
    where: VerificationWhereUniqueInputSchema,
  })
  .strict();

export const VerificationFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.VerificationFindUniqueOrThrowArgs, "select">
> = z
  .object({
    where: VerificationWhereUniqueInputSchema,
  })
  .strict();

export const RoleFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.RoleFindFirstArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        RoleOrderByWithRelationInputSchema.array(),
        RoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([RoleScalarFieldEnumSchema, RoleScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const RoleFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.RoleFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        RoleOrderByWithRelationInputSchema.array(),
        RoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([RoleScalarFieldEnumSchema, RoleScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const RoleFindManyArgsSchema: z.ZodType<
  Omit<Prisma.RoleFindManyArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        RoleOrderByWithRelationInputSchema.array(),
        RoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([RoleScalarFieldEnumSchema, RoleScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const RoleAggregateArgsSchema: z.ZodType<Prisma.RoleAggregateArgs> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        RoleOrderByWithRelationInputSchema.array(),
        RoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const RoleGroupByArgsSchema: z.ZodType<Prisma.RoleGroupByArgs> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        RoleOrderByWithAggregationInputSchema.array(),
        RoleOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: RoleScalarFieldEnumSchema.array(),
    having: RoleScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const RoleFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.RoleFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereUniqueInputSchema,
  })
  .strict();

export const RoleFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.RoleFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereUniqueInputSchema,
  })
  .strict();

export const PermissionFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.PermissionFindFirstArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PermissionOrderByWithRelationInputSchema.array(),
        PermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PermissionScalarFieldEnumSchema,
        PermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PermissionFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PermissionFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PermissionOrderByWithRelationInputSchema.array(),
        PermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PermissionScalarFieldEnumSchema,
        PermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PermissionFindManyArgsSchema: z.ZodType<
  Omit<Prisma.PermissionFindManyArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PermissionOrderByWithRelationInputSchema.array(),
        PermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PermissionScalarFieldEnumSchema,
        PermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PermissionAggregateArgsSchema: z.ZodType<Prisma.PermissionAggregateArgs> =
  z
    .object({
      where: PermissionWhereInputSchema.optional(),
      orderBy: z
        .union([
          PermissionOrderByWithRelationInputSchema.array(),
          PermissionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: PermissionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PermissionGroupByArgsSchema: z.ZodType<Prisma.PermissionGroupByArgs> =
  z
    .object({
      where: PermissionWhereInputSchema.optional(),
      orderBy: z
        .union([
          PermissionOrderByWithAggregationInputSchema.array(),
          PermissionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: PermissionScalarFieldEnumSchema.array(),
      having: PermissionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PermissionFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.PermissionFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereUniqueInputSchema,
  })
  .strict();

export const PermissionFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PermissionFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereUniqueInputSchema,
  })
  .strict();

export const RolePermissionFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionFindFirstArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        RolePermissionOrderByWithRelationInputSchema.array(),
        RolePermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RolePermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        RolePermissionScalarFieldEnumSchema,
        RolePermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const RolePermissionFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        RolePermissionOrderByWithRelationInputSchema.array(),
        RolePermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RolePermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        RolePermissionScalarFieldEnumSchema,
        RolePermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const RolePermissionFindManyArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionFindManyArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereInputSchema.optional(),
    orderBy: z
      .union([
        RolePermissionOrderByWithRelationInputSchema.array(),
        RolePermissionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: RolePermissionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        RolePermissionScalarFieldEnumSchema,
        RolePermissionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const RolePermissionAggregateArgsSchema: z.ZodType<Prisma.RolePermissionAggregateArgs> =
  z
    .object({
      where: RolePermissionWhereInputSchema.optional(),
      orderBy: z
        .union([
          RolePermissionOrderByWithRelationInputSchema.array(),
          RolePermissionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: RolePermissionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const RolePermissionGroupByArgsSchema: z.ZodType<Prisma.RolePermissionGroupByArgs> =
  z
    .object({
      where: RolePermissionWhereInputSchema.optional(),
      orderBy: z
        .union([
          RolePermissionOrderByWithAggregationInputSchema.array(),
          RolePermissionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: RolePermissionScalarFieldEnumSchema.array(),
      having: RolePermissionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const RolePermissionFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereUniqueInputSchema,
  })
  .strict();

export const RolePermissionFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereUniqueInputSchema,
  })
  .strict();

export const UserRoleFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleFindFirstArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserRoleOrderByWithRelationInputSchema.array(),
        UserRoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserRoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        UserRoleScalarFieldEnumSchema,
        UserRoleScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const UserRoleFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserRoleOrderByWithRelationInputSchema.array(),
        UserRoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserRoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        UserRoleScalarFieldEnumSchema,
        UserRoleScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const UserRoleFindManyArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleFindManyArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereInputSchema.optional(),
    orderBy: z
      .union([
        UserRoleOrderByWithRelationInputSchema.array(),
        UserRoleOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: UserRoleWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        UserRoleScalarFieldEnumSchema,
        UserRoleScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const UserRoleAggregateArgsSchema: z.ZodType<Prisma.UserRoleAggregateArgs> =
  z
    .object({
      where: UserRoleWhereInputSchema.optional(),
      orderBy: z
        .union([
          UserRoleOrderByWithRelationInputSchema.array(),
          UserRoleOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: UserRoleWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const UserRoleGroupByArgsSchema: z.ZodType<Prisma.UserRoleGroupByArgs> =
  z
    .object({
      where: UserRoleWhereInputSchema.optional(),
      orderBy: z
        .union([
          UserRoleOrderByWithAggregationInputSchema.array(),
          UserRoleOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: UserRoleScalarFieldEnumSchema.array(),
      having: UserRoleScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const UserRoleFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereUniqueInputSchema,
  })
  .strict();

export const UserRoleFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereUniqueInputSchema,
  })
  .strict();

export const AuditLogFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogFindFirstArgs, "select">
> = z
  .object({
    where: AuditLogWhereInputSchema.optional(),
    orderBy: z
      .union([
        AuditLogOrderByWithRelationInputSchema.array(),
        AuditLogOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AuditLogWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AuditLogScalarFieldEnumSchema,
        AuditLogScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AuditLogFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogFindFirstOrThrowArgs, "select">
> = z
  .object({
    where: AuditLogWhereInputSchema.optional(),
    orderBy: z
      .union([
        AuditLogOrderByWithRelationInputSchema.array(),
        AuditLogOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AuditLogWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AuditLogScalarFieldEnumSchema,
        AuditLogScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AuditLogFindManyArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogFindManyArgs, "select">
> = z
  .object({
    where: AuditLogWhereInputSchema.optional(),
    orderBy: z
      .union([
        AuditLogOrderByWithRelationInputSchema.array(),
        AuditLogOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: AuditLogWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        AuditLogScalarFieldEnumSchema,
        AuditLogScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const AuditLogAggregateArgsSchema: z.ZodType<Prisma.AuditLogAggregateArgs> =
  z
    .object({
      where: AuditLogWhereInputSchema.optional(),
      orderBy: z
        .union([
          AuditLogOrderByWithRelationInputSchema.array(),
          AuditLogOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: AuditLogWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const AuditLogGroupByArgsSchema: z.ZodType<Prisma.AuditLogGroupByArgs> =
  z
    .object({
      where: AuditLogWhereInputSchema.optional(),
      orderBy: z
        .union([
          AuditLogOrderByWithAggregationInputSchema.array(),
          AuditLogOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: AuditLogScalarFieldEnumSchema.array(),
      having: AuditLogScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const AuditLogFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogFindUniqueArgs, "select">
> = z
  .object({
    where: AuditLogWhereUniqueInputSchema,
  })
  .strict();

export const AuditLogFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogFindUniqueOrThrowArgs, "select">
> = z
  .object({
    where: AuditLogWhereUniqueInputSchema,
  })
  .strict();

export const TaskFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.TaskFindFirstArgs, "select">
> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const TaskFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.TaskFindFirstOrThrowArgs, "select">
> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const TaskFindManyArgsSchema: z.ZodType<
  Omit<Prisma.TaskFindManyArgs, "select">
> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([TaskScalarFieldEnumSchema, TaskScalarFieldEnumSchema.array()])
      .optional(),
  })
  .strict();

export const TaskAggregateArgsSchema: z.ZodType<Prisma.TaskAggregateArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithRelationInputSchema.array(),
        TaskOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: TaskWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const TaskGroupByArgsSchema: z.ZodType<Prisma.TaskGroupByArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    orderBy: z
      .union([
        TaskOrderByWithAggregationInputSchema.array(),
        TaskOrderByWithAggregationInputSchema,
      ])
      .optional(),
    by: TaskScalarFieldEnumSchema.array(),
    having: TaskScalarWhereWithAggregatesInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
  })
  .strict();

export const TaskFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.TaskFindUniqueArgs, "select">
> = z
  .object({
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.TaskFindUniqueOrThrowArgs, "select">
> = z
  .object({
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const PromptBlockFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockFindFirstArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptBlockOrderByWithRelationInputSchema.array(),
        PromptBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptBlockScalarFieldEnumSchema,
        PromptBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptBlockFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptBlockOrderByWithRelationInputSchema.array(),
        PromptBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptBlockScalarFieldEnumSchema,
        PromptBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptBlockFindManyArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockFindManyArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptBlockOrderByWithRelationInputSchema.array(),
        PromptBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptBlockScalarFieldEnumSchema,
        PromptBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptBlockAggregateArgsSchema: z.ZodType<Prisma.PromptBlockAggregateArgs> =
  z
    .object({
      where: PromptBlockWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptBlockOrderByWithRelationInputSchema.array(),
          PromptBlockOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: PromptBlockWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptBlockGroupByArgsSchema: z.ZodType<Prisma.PromptBlockGroupByArgs> =
  z
    .object({
      where: PromptBlockWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptBlockOrderByWithAggregationInputSchema.array(),
          PromptBlockOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: PromptBlockScalarFieldEnumSchema.array(),
      having: PromptBlockScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptBlockFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptBlockFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionFindFirstArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionOrderByWithRelationInputSchema.array(),
        PromptCompositionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionScalarFieldEnumSchema,
        PromptCompositionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionOrderByWithRelationInputSchema.array(),
        PromptCompositionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionScalarFieldEnumSchema,
        PromptCompositionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionFindManyArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionFindManyArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionOrderByWithRelationInputSchema.array(),
        PromptCompositionOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionScalarFieldEnumSchema,
        PromptCompositionScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionAggregateArgsSchema: z.ZodType<Prisma.PromptCompositionAggregateArgs> =
  z
    .object({
      where: PromptCompositionWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptCompositionOrderByWithRelationInputSchema.array(),
          PromptCompositionOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: PromptCompositionWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptCompositionGroupByArgsSchema: z.ZodType<Prisma.PromptCompositionGroupByArgs> =
  z
    .object({
      where: PromptCompositionWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptCompositionOrderByWithAggregationInputSchema.array(),
          PromptCompositionOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: PromptCompositionScalarFieldEnumSchema.array(),
      having: PromptCompositionScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptCompositionFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionBlockFindFirstArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockFindFirstArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionBlockOrderByWithRelationInputSchema.array(),
        PromptCompositionBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionBlockScalarFieldEnumSchema,
        PromptCompositionBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionBlockFindFirstOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockFindFirstOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionBlockOrderByWithRelationInputSchema.array(),
        PromptCompositionBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionBlockScalarFieldEnumSchema,
        PromptCompositionBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionBlockFindManyArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockFindManyArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereInputSchema.optional(),
    orderBy: z
      .union([
        PromptCompositionBlockOrderByWithRelationInputSchema.array(),
        PromptCompositionBlockOrderByWithRelationInputSchema,
      ])
      .optional(),
    cursor: PromptCompositionBlockWhereUniqueInputSchema.optional(),
    take: z.number().optional(),
    skip: z.number().optional(),
    distinct: z
      .union([
        PromptCompositionBlockScalarFieldEnumSchema,
        PromptCompositionBlockScalarFieldEnumSchema.array(),
      ])
      .optional(),
  })
  .strict();

export const PromptCompositionBlockAggregateArgsSchema: z.ZodType<Prisma.PromptCompositionBlockAggregateArgs> =
  z
    .object({
      where: PromptCompositionBlockWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptCompositionBlockOrderByWithRelationInputSchema.array(),
          PromptCompositionBlockOrderByWithRelationInputSchema,
        ])
        .optional(),
      cursor: PromptCompositionBlockWhereUniqueInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptCompositionBlockGroupByArgsSchema: z.ZodType<Prisma.PromptCompositionBlockGroupByArgs> =
  z
    .object({
      where: PromptCompositionBlockWhereInputSchema.optional(),
      orderBy: z
        .union([
          PromptCompositionBlockOrderByWithAggregationInputSchema.array(),
          PromptCompositionBlockOrderByWithAggregationInputSchema,
        ])
        .optional(),
      by: PromptCompositionBlockScalarFieldEnumSchema.array(),
      having:
        PromptCompositionBlockScalarWhereWithAggregatesInputSchema.optional(),
      take: z.number().optional(),
      skip: z.number().optional(),
    })
    .strict();

export const PromptCompositionBlockFindUniqueArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockFindUniqueArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionBlockFindUniqueOrThrowArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockFindUniqueOrThrowArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereUniqueInputSchema,
  })
  .strict();

export const UserCreateArgsSchema: z.ZodType<
  Omit<Prisma.UserCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([UserCreateInputSchema, UserUncheckedCreateInputSchema]),
  })
  .strict();

export const UserUpsertArgsSchema: z.ZodType<
  Omit<Prisma.UserUpsertArgs, "select" | "include">
> = z
  .object({
    where: UserWhereUniqueInputSchema,
    create: z.union([UserCreateInputSchema, UserUncheckedCreateInputSchema]),
    update: z.union([UserUpdateInputSchema, UserUncheckedUpdateInputSchema]),
  })
  .strict();

export const UserCreateManyArgsSchema: z.ZodType<Prisma.UserCreateManyArgs> = z
  .object({
    data: z.union([
      UserCreateManyInputSchema,
      UserCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const UserCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserCreateManyInputSchema,
        UserCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserDeleteArgsSchema: z.ZodType<
  Omit<Prisma.UserDeleteArgs, "select" | "include">
> = z
  .object({
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserUpdateArgsSchema: z.ZodType<
  Omit<Prisma.UserUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([UserUpdateInputSchema, UserUncheckedUpdateInputSchema]),
    where: UserWhereUniqueInputSchema,
  })
  .strict();

export const UserUpdateManyArgsSchema: z.ZodType<Prisma.UserUpdateManyArgs> = z
  .object({
    data: z.union([
      UserUpdateManyMutationInputSchema,
      UserUncheckedUpdateManyInputSchema,
    ]),
    where: UserWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const UserUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserUpdateManyMutationInputSchema,
        UserUncheckedUpdateManyInputSchema,
      ]),
      where: UserWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const UserDeleteManyArgsSchema: z.ZodType<Prisma.UserDeleteManyArgs> = z
  .object({
    where: UserWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const AccountCreateArgsSchema: z.ZodType<
  Omit<Prisma.AccountCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      AccountCreateInputSchema,
      AccountUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const AccountUpsertArgsSchema: z.ZodType<
  Omit<Prisma.AccountUpsertArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereUniqueInputSchema,
    create: z.union([
      AccountCreateInputSchema,
      AccountUncheckedCreateInputSchema,
    ]),
    update: z.union([
      AccountUpdateInputSchema,
      AccountUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const AccountCreateManyArgsSchema: z.ZodType<Prisma.AccountCreateManyArgs> =
  z
    .object({
      data: z.union([
        AccountCreateManyInputSchema,
        AccountCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AccountCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        AccountCreateManyInputSchema,
        AccountCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AccountDeleteArgsSchema: z.ZodType<
  Omit<Prisma.AccountDeleteArgs, "select" | "include">
> = z
  .object({
    where: AccountWhereUniqueInputSchema,
  })
  .strict();

export const AccountUpdateArgsSchema: z.ZodType<
  Omit<Prisma.AccountUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      AccountUpdateInputSchema,
      AccountUncheckedUpdateInputSchema,
    ]),
    where: AccountWhereUniqueInputSchema,
  })
  .strict();

export const AccountUpdateManyArgsSchema: z.ZodType<Prisma.AccountUpdateManyArgs> =
  z
    .object({
      data: z.union([
        AccountUpdateManyMutationInputSchema,
        AccountUncheckedUpdateManyInputSchema,
      ]),
      where: AccountWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const AccountUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AccountUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        AccountUpdateManyMutationInputSchema,
        AccountUncheckedUpdateManyInputSchema,
      ]),
      where: AccountWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const AccountDeleteManyArgsSchema: z.ZodType<Prisma.AccountDeleteManyArgs> =
  z
    .object({
      where: AccountWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SessionCreateArgsSchema: z.ZodType<
  Omit<Prisma.SessionCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      SessionCreateInputSchema,
      SessionUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const SessionUpsertArgsSchema: z.ZodType<
  Omit<Prisma.SessionUpsertArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereUniqueInputSchema,
    create: z.union([
      SessionCreateInputSchema,
      SessionUncheckedCreateInputSchema,
    ]),
    update: z.union([
      SessionUpdateInputSchema,
      SessionUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const SessionCreateManyArgsSchema: z.ZodType<Prisma.SessionCreateManyArgs> =
  z
    .object({
      data: z.union([
        SessionCreateManyInputSchema,
        SessionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const SessionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        SessionCreateManyInputSchema,
        SessionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const SessionDeleteArgsSchema: z.ZodType<
  Omit<Prisma.SessionDeleteArgs, "select" | "include">
> = z
  .object({
    where: SessionWhereUniqueInputSchema,
  })
  .strict();

export const SessionUpdateArgsSchema: z.ZodType<
  Omit<Prisma.SessionUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      SessionUpdateInputSchema,
      SessionUncheckedUpdateInputSchema,
    ]),
    where: SessionWhereUniqueInputSchema,
  })
  .strict();

export const SessionUpdateManyArgsSchema: z.ZodType<Prisma.SessionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        SessionUpdateManyMutationInputSchema,
        SessionUncheckedUpdateManyInputSchema,
      ]),
      where: SessionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SessionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.SessionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        SessionUpdateManyMutationInputSchema,
        SessionUncheckedUpdateManyInputSchema,
      ]),
      where: SessionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const SessionDeleteManyArgsSchema: z.ZodType<Prisma.SessionDeleteManyArgs> =
  z
    .object({
      where: SessionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const VerificationCreateArgsSchema: z.ZodType<
  Omit<Prisma.VerificationCreateArgs, "select">
> = z
  .object({
    data: z.union([
      VerificationCreateInputSchema,
      VerificationUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const VerificationUpsertArgsSchema: z.ZodType<
  Omit<Prisma.VerificationUpsertArgs, "select">
> = z
  .object({
    where: VerificationWhereUniqueInputSchema,
    create: z.union([
      VerificationCreateInputSchema,
      VerificationUncheckedCreateInputSchema,
    ]),
    update: z.union([
      VerificationUpdateInputSchema,
      VerificationUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const VerificationCreateManyArgsSchema: z.ZodType<Prisma.VerificationCreateManyArgs> =
  z
    .object({
      data: z.union([
        VerificationCreateManyInputSchema,
        VerificationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const VerificationCreateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        VerificationCreateManyInputSchema,
        VerificationCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const VerificationDeleteArgsSchema: z.ZodType<
  Omit<Prisma.VerificationDeleteArgs, "select">
> = z
  .object({
    where: VerificationWhereUniqueInputSchema,
  })
  .strict();

export const VerificationUpdateArgsSchema: z.ZodType<
  Omit<Prisma.VerificationUpdateArgs, "select">
> = z
  .object({
    data: z.union([
      VerificationUpdateInputSchema,
      VerificationUncheckedUpdateInputSchema,
    ]),
    where: VerificationWhereUniqueInputSchema,
  })
  .strict();

export const VerificationUpdateManyArgsSchema: z.ZodType<Prisma.VerificationUpdateManyArgs> =
  z
    .object({
      data: z.union([
        VerificationUpdateManyMutationInputSchema,
        VerificationUncheckedUpdateManyInputSchema,
      ]),
      where: VerificationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const VerificationUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.VerificationUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        VerificationUpdateManyMutationInputSchema,
        VerificationUncheckedUpdateManyInputSchema,
      ]),
      where: VerificationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const VerificationDeleteManyArgsSchema: z.ZodType<Prisma.VerificationDeleteManyArgs> =
  z
    .object({
      where: VerificationWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const RoleCreateArgsSchema: z.ZodType<
  Omit<Prisma.RoleCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([RoleCreateInputSchema, RoleUncheckedCreateInputSchema]),
  })
  .strict();

export const RoleUpsertArgsSchema: z.ZodType<
  Omit<Prisma.RoleUpsertArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereUniqueInputSchema,
    create: z.union([RoleCreateInputSchema, RoleUncheckedCreateInputSchema]),
    update: z.union([RoleUpdateInputSchema, RoleUncheckedUpdateInputSchema]),
  })
  .strict();

export const RoleCreateManyArgsSchema: z.ZodType<Prisma.RoleCreateManyArgs> = z
  .object({
    data: z.union([
      RoleCreateManyInputSchema,
      RoleCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const RoleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RoleCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        RoleCreateManyInputSchema,
        RoleCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const RoleDeleteArgsSchema: z.ZodType<
  Omit<Prisma.RoleDeleteArgs, "select" | "include">
> = z
  .object({
    where: RoleWhereUniqueInputSchema,
  })
  .strict();

export const RoleUpdateArgsSchema: z.ZodType<
  Omit<Prisma.RoleUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([RoleUpdateInputSchema, RoleUncheckedUpdateInputSchema]),
    where: RoleWhereUniqueInputSchema,
  })
  .strict();

export const RoleUpdateManyArgsSchema: z.ZodType<Prisma.RoleUpdateManyArgs> = z
  .object({
    data: z.union([
      RoleUpdateManyMutationInputSchema,
      RoleUncheckedUpdateManyInputSchema,
    ]),
    where: RoleWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const RoleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RoleUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        RoleUpdateManyMutationInputSchema,
        RoleUncheckedUpdateManyInputSchema,
      ]),
      where: RoleWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const RoleDeleteManyArgsSchema: z.ZodType<Prisma.RoleDeleteManyArgs> = z
  .object({
    where: RoleWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const PermissionCreateArgsSchema: z.ZodType<
  Omit<Prisma.PermissionCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PermissionCreateInputSchema,
      PermissionUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const PermissionUpsertArgsSchema: z.ZodType<
  Omit<Prisma.PermissionUpsertArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereUniqueInputSchema,
    create: z.union([
      PermissionCreateInputSchema,
      PermissionUncheckedCreateInputSchema,
    ]),
    update: z.union([
      PermissionUpdateInputSchema,
      PermissionUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const PermissionCreateManyArgsSchema: z.ZodType<Prisma.PermissionCreateManyArgs> =
  z
    .object({
      data: z.union([
        PermissionCreateManyInputSchema,
        PermissionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PermissionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PermissionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PermissionCreateManyInputSchema,
        PermissionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PermissionDeleteArgsSchema: z.ZodType<
  Omit<Prisma.PermissionDeleteArgs, "select" | "include">
> = z
  .object({
    where: PermissionWhereUniqueInputSchema,
  })
  .strict();

export const PermissionUpdateArgsSchema: z.ZodType<
  Omit<Prisma.PermissionUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PermissionUpdateInputSchema,
      PermissionUncheckedUpdateInputSchema,
    ]),
    where: PermissionWhereUniqueInputSchema,
  })
  .strict();

export const PermissionUpdateManyArgsSchema: z.ZodType<Prisma.PermissionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PermissionUpdateManyMutationInputSchema,
        PermissionUncheckedUpdateManyInputSchema,
      ]),
      where: PermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PermissionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PermissionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PermissionUpdateManyMutationInputSchema,
        PermissionUncheckedUpdateManyInputSchema,
      ]),
      where: PermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PermissionDeleteManyArgsSchema: z.ZodType<Prisma.PermissionDeleteManyArgs> =
  z
    .object({
      where: PermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const RolePermissionCreateArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      RolePermissionCreateInputSchema,
      RolePermissionUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const RolePermissionUpsertArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionUpsertArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereUniqueInputSchema,
    create: z.union([
      RolePermissionCreateInputSchema,
      RolePermissionUncheckedCreateInputSchema,
    ]),
    update: z.union([
      RolePermissionUpdateInputSchema,
      RolePermissionUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const RolePermissionCreateManyArgsSchema: z.ZodType<Prisma.RolePermissionCreateManyArgs> =
  z
    .object({
      data: z.union([
        RolePermissionCreateManyInputSchema,
        RolePermissionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const RolePermissionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.RolePermissionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        RolePermissionCreateManyInputSchema,
        RolePermissionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const RolePermissionDeleteArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionDeleteArgs, "select" | "include">
> = z
  .object({
    where: RolePermissionWhereUniqueInputSchema,
  })
  .strict();

export const RolePermissionUpdateArgsSchema: z.ZodType<
  Omit<Prisma.RolePermissionUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      RolePermissionUpdateInputSchema,
      RolePermissionUncheckedUpdateInputSchema,
    ]),
    where: RolePermissionWhereUniqueInputSchema,
  })
  .strict();

export const RolePermissionUpdateManyArgsSchema: z.ZodType<Prisma.RolePermissionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        RolePermissionUpdateManyMutationInputSchema,
        RolePermissionUncheckedUpdateManyInputSchema,
      ]),
      where: RolePermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const RolePermissionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.RolePermissionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        RolePermissionUpdateManyMutationInputSchema,
        RolePermissionUncheckedUpdateManyInputSchema,
      ]),
      where: RolePermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const RolePermissionDeleteManyArgsSchema: z.ZodType<Prisma.RolePermissionDeleteManyArgs> =
  z
    .object({
      where: RolePermissionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const UserRoleCreateArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      UserRoleCreateInputSchema,
      UserRoleUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const UserRoleUpsertArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleUpsertArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereUniqueInputSchema,
    create: z.union([
      UserRoleCreateInputSchema,
      UserRoleUncheckedCreateInputSchema,
    ]),
    update: z.union([
      UserRoleUpdateInputSchema,
      UserRoleUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const UserRoleCreateManyArgsSchema: z.ZodType<Prisma.UserRoleCreateManyArgs> =
  z
    .object({
      data: z.union([
        UserRoleCreateManyInputSchema,
        UserRoleCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserRoleCreateManyAndReturnArgsSchema: z.ZodType<Prisma.UserRoleCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserRoleCreateManyInputSchema,
        UserRoleCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const UserRoleDeleteArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleDeleteArgs, "select" | "include">
> = z
  .object({
    where: UserRoleWhereUniqueInputSchema,
  })
  .strict();

export const UserRoleUpdateArgsSchema: z.ZodType<
  Omit<Prisma.UserRoleUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      UserRoleUpdateInputSchema,
      UserRoleUncheckedUpdateInputSchema,
    ]),
    where: UserRoleWhereUniqueInputSchema,
  })
  .strict();

export const UserRoleUpdateManyArgsSchema: z.ZodType<Prisma.UserRoleUpdateManyArgs> =
  z
    .object({
      data: z.union([
        UserRoleUpdateManyMutationInputSchema,
        UserRoleUncheckedUpdateManyInputSchema,
      ]),
      where: UserRoleWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const UserRoleUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.UserRoleUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        UserRoleUpdateManyMutationInputSchema,
        UserRoleUncheckedUpdateManyInputSchema,
      ]),
      where: UserRoleWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const UserRoleDeleteManyArgsSchema: z.ZodType<Prisma.UserRoleDeleteManyArgs> =
  z
    .object({
      where: UserRoleWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const AuditLogCreateArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogCreateArgs, "select">
> = z
  .object({
    data: z.union([
      AuditLogCreateInputSchema,
      AuditLogUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const AuditLogUpsertArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogUpsertArgs, "select">
> = z
  .object({
    where: AuditLogWhereUniqueInputSchema,
    create: z.union([
      AuditLogCreateInputSchema,
      AuditLogUncheckedCreateInputSchema,
    ]),
    update: z.union([
      AuditLogUpdateInputSchema,
      AuditLogUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const AuditLogCreateManyArgsSchema: z.ZodType<Prisma.AuditLogCreateManyArgs> =
  z
    .object({
      data: z.union([
        AuditLogCreateManyInputSchema,
        AuditLogCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AuditLogCreateManyAndReturnArgsSchema: z.ZodType<Prisma.AuditLogCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        AuditLogCreateManyInputSchema,
        AuditLogCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const AuditLogDeleteArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogDeleteArgs, "select">
> = z
  .object({
    where: AuditLogWhereUniqueInputSchema,
  })
  .strict();

export const AuditLogUpdateArgsSchema: z.ZodType<
  Omit<Prisma.AuditLogUpdateArgs, "select">
> = z
  .object({
    data: z.union([
      AuditLogUpdateInputSchema,
      AuditLogUncheckedUpdateInputSchema,
    ]),
    where: AuditLogWhereUniqueInputSchema,
  })
  .strict();

export const AuditLogUpdateManyArgsSchema: z.ZodType<Prisma.AuditLogUpdateManyArgs> =
  z
    .object({
      data: z.union([
        AuditLogUpdateManyMutationInputSchema,
        AuditLogUncheckedUpdateManyInputSchema,
      ]),
      where: AuditLogWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const AuditLogUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.AuditLogUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        AuditLogUpdateManyMutationInputSchema,
        AuditLogUncheckedUpdateManyInputSchema,
      ]),
      where: AuditLogWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const AuditLogDeleteManyArgsSchema: z.ZodType<Prisma.AuditLogDeleteManyArgs> =
  z
    .object({
      where: AuditLogWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TaskCreateArgsSchema: z.ZodType<
  Omit<Prisma.TaskCreateArgs, "select">
> = z
  .object({
    data: z.union([TaskCreateInputSchema, TaskUncheckedCreateInputSchema]),
  })
  .strict();

export const TaskUpsertArgsSchema: z.ZodType<
  Omit<Prisma.TaskUpsertArgs, "select">
> = z
  .object({
    where: TaskWhereUniqueInputSchema,
    create: z.union([TaskCreateInputSchema, TaskUncheckedCreateInputSchema]),
    update: z.union([TaskUpdateInputSchema, TaskUncheckedUpdateInputSchema]),
  })
  .strict();

export const TaskCreateManyArgsSchema: z.ZodType<Prisma.TaskCreateManyArgs> = z
  .object({
    data: z.union([
      TaskCreateManyInputSchema,
      TaskCreateManyInputSchema.array(),
    ]),
    skipDuplicates: z.boolean().optional(),
  })
  .strict();

export const TaskCreateManyAndReturnArgsSchema: z.ZodType<Prisma.TaskCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TaskCreateManyInputSchema,
        TaskCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const TaskDeleteArgsSchema: z.ZodType<
  Omit<Prisma.TaskDeleteArgs, "select">
> = z
  .object({
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskUpdateArgsSchema: z.ZodType<
  Omit<Prisma.TaskUpdateArgs, "select">
> = z
  .object({
    data: z.union([TaskUpdateInputSchema, TaskUncheckedUpdateInputSchema]),
    where: TaskWhereUniqueInputSchema,
  })
  .strict();

export const TaskUpdateManyArgsSchema: z.ZodType<Prisma.TaskUpdateManyArgs> = z
  .object({
    data: z.union([
      TaskUpdateManyMutationInputSchema,
      TaskUncheckedUpdateManyInputSchema,
    ]),
    where: TaskWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const TaskUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.TaskUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        TaskUpdateManyMutationInputSchema,
        TaskUncheckedUpdateManyInputSchema,
      ]),
      where: TaskWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const TaskDeleteManyArgsSchema: z.ZodType<Prisma.TaskDeleteManyArgs> = z
  .object({
    where: TaskWhereInputSchema.optional(),
    limit: z.number().optional(),
  })
  .strict();

export const PromptBlockCreateArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptBlockCreateInputSchema,
      PromptBlockUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const PromptBlockUpsertArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockUpsertArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereUniqueInputSchema,
    create: z.union([
      PromptBlockCreateInputSchema,
      PromptBlockUncheckedCreateInputSchema,
    ]),
    update: z.union([
      PromptBlockUpdateInputSchema,
      PromptBlockUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const PromptBlockCreateManyArgsSchema: z.ZodType<Prisma.PromptBlockCreateManyArgs> =
  z
    .object({
      data: z.union([
        PromptBlockCreateManyInputSchema,
        PromptBlockCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptBlockCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptBlockCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptBlockCreateManyInputSchema,
        PromptBlockCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptBlockDeleteArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockDeleteArgs, "select" | "include">
> = z
  .object({
    where: PromptBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptBlockUpdateArgsSchema: z.ZodType<
  Omit<Prisma.PromptBlockUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptBlockUpdateInputSchema,
      PromptBlockUncheckedUpdateInputSchema,
    ]),
    where: PromptBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptBlockUpdateManyArgsSchema: z.ZodType<Prisma.PromptBlockUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PromptBlockUpdateManyMutationInputSchema,
        PromptBlockUncheckedUpdateManyInputSchema,
      ]),
      where: PromptBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptBlockUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptBlockUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptBlockUpdateManyMutationInputSchema,
        PromptBlockUncheckedUpdateManyInputSchema,
      ]),
      where: PromptBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptBlockDeleteManyArgsSchema: z.ZodType<Prisma.PromptBlockDeleteManyArgs> =
  z
    .object({
      where: PromptBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionCreateArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptCompositionCreateInputSchema,
      PromptCompositionUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const PromptCompositionUpsertArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionUpsertArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereUniqueInputSchema,
    create: z.union([
      PromptCompositionCreateInputSchema,
      PromptCompositionUncheckedCreateInputSchema,
    ]),
    update: z.union([
      PromptCompositionUpdateInputSchema,
      PromptCompositionUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const PromptCompositionCreateManyArgsSchema: z.ZodType<Prisma.PromptCompositionCreateManyArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionCreateManyInputSchema,
        PromptCompositionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptCompositionCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionCreateManyInputSchema,
        PromptCompositionCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionDeleteArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionDeleteArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionUpdateArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptCompositionUpdateInputSchema,
      PromptCompositionUncheckedUpdateInputSchema,
    ]),
    where: PromptCompositionWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionUpdateManyArgsSchema: z.ZodType<Prisma.PromptCompositionUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionUpdateManyMutationInputSchema,
        PromptCompositionUncheckedUpdateManyInputSchema,
      ]),
      where: PromptCompositionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptCompositionUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionUpdateManyMutationInputSchema,
        PromptCompositionUncheckedUpdateManyInputSchema,
      ]),
      where: PromptCompositionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionDeleteManyArgsSchema: z.ZodType<Prisma.PromptCompositionDeleteManyArgs> =
  z
    .object({
      where: PromptCompositionWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionBlockCreateArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockCreateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptCompositionBlockCreateInputSchema,
      PromptCompositionBlockUncheckedCreateInputSchema,
    ]),
  })
  .strict();

export const PromptCompositionBlockUpsertArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockUpsertArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereUniqueInputSchema,
    create: z.union([
      PromptCompositionBlockCreateInputSchema,
      PromptCompositionBlockUncheckedCreateInputSchema,
    ]),
    update: z.union([
      PromptCompositionBlockUpdateInputSchema,
      PromptCompositionBlockUncheckedUpdateInputSchema,
    ]),
  })
  .strict();

export const PromptCompositionBlockCreateManyArgsSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionBlockCreateManyInputSchema,
        PromptCompositionBlockCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionBlockCreateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptCompositionBlockCreateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionBlockCreateManyInputSchema,
        PromptCompositionBlockCreateManyInputSchema.array(),
      ]),
      skipDuplicates: z.boolean().optional(),
    })
    .strict();

export const PromptCompositionBlockDeleteArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockDeleteArgs, "select" | "include">
> = z
  .object({
    where: PromptCompositionBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionBlockUpdateArgsSchema: z.ZodType<
  Omit<Prisma.PromptCompositionBlockUpdateArgs, "select" | "include">
> = z
  .object({
    data: z.union([
      PromptCompositionBlockUpdateInputSchema,
      PromptCompositionBlockUncheckedUpdateInputSchema,
    ]),
    where: PromptCompositionBlockWhereUniqueInputSchema,
  })
  .strict();

export const PromptCompositionBlockUpdateManyArgsSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionBlockUpdateManyMutationInputSchema,
        PromptCompositionBlockUncheckedUpdateManyInputSchema,
      ]),
      where: PromptCompositionBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionBlockUpdateManyAndReturnArgsSchema: z.ZodType<Prisma.PromptCompositionBlockUpdateManyAndReturnArgs> =
  z
    .object({
      data: z.union([
        PromptCompositionBlockUpdateManyMutationInputSchema,
        PromptCompositionBlockUncheckedUpdateManyInputSchema,
      ]),
      where: PromptCompositionBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

export const PromptCompositionBlockDeleteManyArgsSchema: z.ZodType<Prisma.PromptCompositionBlockDeleteManyArgs> =
  z
    .object({
      where: PromptCompositionBlockWhereInputSchema.optional(),
      limit: z.number().optional(),
    })
    .strict();

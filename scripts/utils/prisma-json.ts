import { Prisma } from "@/generated/prisma/server";

function toJson(value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export function toPrismaJson(
  value: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  return toJson(value);
}

export function mergePrismaJson(
  existing: Prisma.JsonValue | null | undefined,
  updates: Record<string, unknown>,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  const base =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? (existing as Record<string, unknown>)
      : {};

  return toPrismaJson({ ...base, ...updates });
}

/**
 * Conditions on an access-service field ("show this when Service is GCP").
 *
 * A LOOKUP[ACCESS_SERVICES] field stores the service's id, which differs
 * between environments, so conditions compare the service's slug instead.
 * The slug is exposed to expressions under a derived key next to the field:
 * `{ field: "service#slug" }`. It is never stored as a field value; the
 * form renderer and the submit path add it to the evaluation context.
 */

export const SERVICE_SLUG_SUFFIX = "#slug";

export function serviceSlugKey(fieldKey: string): string {
  return `${fieldKey}${SERVICE_SLUG_SUFFIX}`;
}

/** "service#slug" → "service"; any other key → null. */
export function fieldKeyFromServiceSlugKey(key: string): string | null {
  return key.endsWith(SERVICE_SLUG_SUFFIX)
    ? key.slice(0, -SERVICE_SLUG_SUFFIX.length)
    : null;
}

export function isAccessServiceField(field: {
  type: string;
  config?: Record<string, unknown> | null;
}): boolean {
  return (
    field.type === "LOOKUP" &&
    (field.config as { dataSource?: unknown } | null | undefined)
      ?.dataSource === "ACCESS_SERVICES"
  );
}

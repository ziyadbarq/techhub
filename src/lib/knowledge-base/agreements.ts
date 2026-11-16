import "server-only";
import { prisma } from "@/infrastructure/database/prisma/client";
import { PERMISSIONS } from "@/core/domain/value-objects/permission-key";
import { buildAgreementReport, type AgreementPerson, type AgreementReport } from "./agreement-report";

/** Upper bound on the audience read for one report. */
const MAX_AUDIENCE = 5000;

/**
 * Everyone expected to agree to a document: users holding Knowledge Base view
 * through an active, unexpired role (plus restricted view for a RESTRICTED
 * document), excluding people marked inactive or excluded (service accounts).
 * Mirrors how permissions are resolved for a single user.
 */
async function loadAudience(classification: string): Promise<AgreementPerson[]> {
  const now = new Date();
  const grants = (permission: string) => ({
    roles: {
      some: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        role: {
          isActive: true,
          permissions: { some: { permission: { name: permission, isActive: true } } },
        },
      },
    },
  });

  const users = await prisma.user.findMany({
    where: {
      AND: [
        grants(PERMISSIONS.KNOWLEDGE_BASE_VIEW),
        ...(classification === "RESTRICTED"
          ? [grants(PERMISSIONS.KNOWLEDGE_BASE_RESTRICTED_VIEW)]
          : []),
        {
          OR: [
            { person: { is: null } },
            { person: { is: { isActive: true, isExcluded: false } } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      person: { select: { firstName: true, lastName: true, department: true } },
    },
    take: MAX_AUDIENCE,
  });

  return users.map((user) => {
    const personName = user.person
      ? `${user.person.firstName} ${user.person.lastName}`.trim()
      : "";
    return {
      userId: user.id,
      name: personName || user.name?.trim() || user.email,
      email: user.email,
      department: user.person?.department ?? null,
    };
  });
}

export async function getAgreementReport(
  articleId: string,
  version: number,
  classification: string,
): Promise<AgreementReport> {
  const [audience, records] = await Promise.all([
    loadAudience(classification),
    prisma.knowledgeAcknowledgement.findMany({
      where: { articleId, version: { lte: version } },
      select: { userId: true, version: true, acknowledgedAt: true },
    }),
  ]);
  return buildAgreementReport(version, audience, records);
}

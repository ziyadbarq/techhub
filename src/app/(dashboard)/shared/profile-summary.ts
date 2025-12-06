/**
 * Shared loader for profile-centric pages (Profile, Settings).
 * Aggregates user/person context and personal assets/licenses/reservations
 * while capturing any load errors for graceful display.
 */

import type { User } from "@/interface-adapters/auth/better-auth";
import {
  getCurrentPersonAction,
  getMyAssetsAction,
  getMyLicensesAction,
  getMyReservationsAction,
  type MyAssetDTO,
  type MyLicenseDTO,
  type MyReservationDTO,
} from "@/interface-adapters/controllers/my-dashboard.controller";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { ActionResponse } from "@/interface-adapters/controllers/types";
import { requireAuth } from "@/lib/auth/session";
import { getContainer } from "@/di/container";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";

type UnwrapResult<T> = {
  data: T;
  error?: string;
};

function unwrapAction<T>(
  result: PromiseSettledResult<ActionResponse<T>>,
  fallback: T,
  errorLabel: string,
): UnwrapResult<T> {
  if (result.status === "fulfilled") {
    if (result.value.success) {
      return { data: result.value.data };
    }
    return {
      data: fallback,
      error: result.value.error ?? `Failed to load ${errorLabel}`,
    };
  }

  return {
    data: fallback,
    error: `Failed to load ${errorLabel}`,
  };
}

export interface ProfileSummary {
  user: User;
  person: PersonDTO | null;
  assets: MyAssetDTO[];
  licenses: MyLicenseDTO[];
  reservations: MyReservationDTO[];
  errors: string[];
}

/**
 * Load all user-centric data used by profile surfaces.
 * Redirects to login when unauthenticated (via requireAuth).
 */
export async function loadProfileSummary(): Promise<ProfileSummary> {
  const { user } = await requireAuth();
  const errors: string[] = [];

  // Fetch latest user data from database (session may be cached)
  const container = getContainer();
  const prisma = container.get<PrismaClient>(DI_TOKENS.PrismaClient);
  const freshUserData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      image: true,
      name: true,
    },
  });

  // Merge fresh data with session user
  const userWithFreshData: User = {
    ...user,
    image: freshUserData?.image ?? user.image,
    name: freshUserData?.name ?? user.name,
  };

  const [personResult, assetsResult, licensesResult, reservationsResult] =
    await Promise.allSettled([
      getCurrentPersonAction(),
      getMyAssetsAction(),
      getMyLicensesAction(),
      getMyReservationsAction(),
    ]);

  const person = unwrapAction(personResult, null, "profile information");
  const assets = unwrapAction(assetsResult, [] as MyAssetDTO[], "assets");
  const licenses = unwrapAction(
    licensesResult,
    [] as MyLicenseDTO[],
    "licenses",
  );
  const reservations = unwrapAction(
    reservationsResult,
    [] as MyReservationDTO[],
    "reservations",
  );

  [person, assets, licenses, reservations].forEach((result) => {
    if (result.error) {
      errors.push(result.error);
    }
  });

  return {
    user: userWithFreshData,
    person: person.data,
    assets: assets.data,
    licenses: licenses.data,
    reservations: reservations.data,
    errors,
  };
}

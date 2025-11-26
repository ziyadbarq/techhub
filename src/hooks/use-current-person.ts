/**
 * Current Person Hook
 * Fetches and caches the Person entity linked to the current authenticated user
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/client";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { getCurrentPersonAction } from "@/interface-adapters/controllers/my-dashboard.controller";

export interface UseCurrentPersonReturn {
  /** The Person entity linked to the current user, null if not linked */
  person: PersonDTO | null;
  /** True while fetching person data */
  isLoading: boolean;
  /** True if fetch failed */
  isError: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** True if the user has a linked Person entity */
  hasLinkedPerson: boolean;
  /** Refetch the person data */
  refetch: () => Promise<void>;
}

/**
 * Hook for accessing the current user's Person entity
 *
 * Returns the Person record linked to the authenticated user.
 * If the user has no linked Person (e.g., system account), person will be null.
 *
 * @example
 * ```tsx
 * function ProfileWidget() {
 *   const { person, isLoading } = useCurrentPerson();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!person) return <div>No profile linked</div>;
 *
 *   return <div>Hello, {person.firstName}!</div>;
 * }
 * ```
 */
export function useCurrentPerson(): UseCurrentPersonReturn {
  const { data: session, isPending } = useSession();
  const [person, setPerson] = useState<PersonDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerson = useCallback(async () => {
    if (!session?.user) {
      setPerson(null);
      setIsLoading(false);
      setIsError(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      const result = await getCurrentPersonAction();

      if (result.success) {
        setPerson(result.data);
      } else {
        setIsError(true);
        setError(result.error || "Failed to fetch person");
        setPerson(null);
      }
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : "Failed to fetch person");
      setPerson(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!isPending) {
      fetchPerson();
    }
  }, [fetchPerson, isPending]);

  return {
    person,
    isLoading: isPending || isLoading,
    isError,
    error,
    hasLinkedPerson: person !== null,
    refetch: fetchPerson,
  };
}

/**
 * Helper to get the full name of a person
 */
export function getPersonFullName(person: PersonDTO | null): string {
  if (!person) return "Unknown";

  const parts = [person.firstName];
  if (person.middleName) parts.push(person.middleName);
  parts.push(person.lastName);

  return parts.join(" ");
}

/**
 * Current Person Context
 * Provides the current user's Person entity to all descendants
 * Prevents duplicate API calls when multiple components need person data
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "@/lib/auth/client";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import { getCurrentPersonAction } from "@/interface-adapters/controllers/my-dashboard.controller";

interface CurrentPersonContextValue {
  person: PersonDTO | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  hasLinkedPerson: boolean;
  refetch: () => Promise<void>;
}

const CurrentPersonContext = createContext<CurrentPersonContextValue | null>(
  null,
);

interface CurrentPersonProviderProps {
  children: ReactNode;
}

/**
 * Provider that fetches and caches the current user's Person entity
 * Wrap dashboard or any section that needs person data
 */
export function CurrentPersonProvider({
  children,
}: CurrentPersonProviderProps) {
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

  return (
    <CurrentPersonContext.Provider
      value={{
        person,
        isLoading: isPending || isLoading,
        isError,
        error,
        hasLinkedPerson: person !== null,
        refetch: fetchPerson,
      }}
    >
      {children}
    </CurrentPersonContext.Provider>
  );
}

/**
 * Hook to access current person from context
 * Must be used within CurrentPersonProvider
 */
export function useCurrentPersonContext(): CurrentPersonContextValue {
  const context = useContext(CurrentPersonContext);
  if (!context) {
    throw new Error(
      "useCurrentPersonContext must be used within CurrentPersonProvider",
    );
  }
  return context;
}

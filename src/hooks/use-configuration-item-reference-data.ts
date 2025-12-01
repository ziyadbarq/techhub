/**
 * Shared loader for Configuration Item reference data
 * Fetches CI classes, lifecycle states, people, org units, locations, and assets
 * in one pass to keep forms lean and DRY.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listCIClassesAction } from "@/interface-adapters/controllers/ci-class.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import { listPersonsAction } from "@/interface-adapters/controllers/person.controller";
import { listOrganizationUnitsAction } from "@/interface-adapters/controllers/organization-unit.controller";
import { listLocationsAction } from "@/interface-adapters/controllers/location.controller";
import { listAssetsAction } from "@/interface-adapters/controllers/asset.controller";
import type { CIClassDTO } from "@/interface-adapters/presenters/ci-class.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";
import type { PersonDTO } from "@/interface-adapters/presenters/person.presenter";
import type { OrganizationUnitDTO } from "@/interface-adapters/presenters/organization-unit.presenter";
import type { LocationDTO } from "@/interface-adapters/presenters/location.presenter";
import type { AssetDTO } from "@/interface-adapters/presenters/asset.presenter";

interface ReferenceData {
  ciClasses: CIClassDTO[];
  lifecycleStates: LifecycleStateDTO[];
  persons: PersonDTO[];
  organizationUnits: OrganizationUnitDTO[];
  locations: LocationDTO[];
  assets: AssetDTO[];
}

const EMPTY_DATA: ReferenceData = {
  ciClasses: [],
  lifecycleStates: [],
  persons: [],
  organizationUnits: [],
  locations: [],
  assets: [],
};

export function useConfigurationItemReferenceData(shouldLoad: boolean) {
  const [data, setData] = useState<ReferenceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        ciClassesResult,
        lifecycleStatesResult,
        personsResult,
        orgUnitsResult,
        locationsResult,
        assetsResult,
      ] = await Promise.all([
        listCIClassesAction(),
        listLifecycleStatesAction(),
        listPersonsAction(),
        listOrganizationUnitsAction(),
        listLocationsAction(),
        listAssetsAction(),
      ]);

      const failures: string[] = [];
      if (!ciClassesResult.success) failures.push("CI classes");
      if (!lifecycleStatesResult.success) failures.push("lifecycle states");
      if (!personsResult.success) failures.push("people");
      if (!orgUnitsResult.success) failures.push("organization units");
      if (!locationsResult.success) failures.push("locations");
      if (!assetsResult.success) failures.push("assets");

      setData({
        ciClasses: ciClassesResult.success ? ciClassesResult.data : [],
        lifecycleStates: lifecycleStatesResult.success
          ? lifecycleStatesResult.data
          : [],
        persons: personsResult.success ? personsResult.data : [],
        organizationUnits: orgUnitsResult.success ? orgUnitsResult.data : [],
        locations: locationsResult.success ? locationsResult.data : [],
        assets: assetsResult.success ? assetsResult.data : [],
      });

      if (failures.length > 0) {
        setError(`Failed to load ${failures.join(", ")}`);
      } else {
        setError(null);
      }

      hasLoadedRef.current = true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load configuration data",
      );
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldLoad && !hasLoadedRef.current) {
      void load();
    }
  }, [shouldLoad, load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

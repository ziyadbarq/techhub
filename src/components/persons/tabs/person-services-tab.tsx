/**
 * Person Services Tab
 *
 * Displays service ownerships, configuration items, and data ownerships.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Server, Database, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getPersonConfigurationItemsAction,
  getPersonDataOwnershipsAction,
  getPersonServiceOwnershipsAction,
  type PersonConfigurationItemDTO,
  type PersonDataOwnershipDTO,
  type PersonServiceOwnershipDTO,
} from "@/interface-adapters/controllers/person-details.controller";

interface PersonServicesTabProps {
  personId: string;
  counts: {
    serviceOwnerships: number;
    configurationItems: number;
    dataOwnerships: number;
  };
}

export function PersonServicesTab({
  personId,
  counts,
}: PersonServicesTabProps) {
  const [serviceOwnerships, setServiceOwnerships] = useState<
    PersonServiceOwnershipDTO[]
  >([]);
  const [configurationItems, setConfigurationItems] = useState<
    PersonConfigurationItemDTO[]
  >([]);
  const [dataOwnerships, setDataOwnerships] = useState<
    PersonDataOwnershipDTO[]
  >([]);

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingCis, setLoadingCis] = useState(false);
  const [loadingDataOwnerships, setLoadingDataOwnerships] = useState(false);

  const totalItems = useMemo(
    () =>
      counts.serviceOwnerships +
      counts.configurationItems +
      counts.dataOwnerships,
    [counts],
  );

  const loadServiceOwnerships = useCallback(async () => {
    if (counts.serviceOwnerships === 0) {
      setServiceOwnerships([]);
      return;
    }
    setLoadingServices(true);
    try {
      const result = await getPersonServiceOwnershipsAction(personId);
      if (result.success) {
        setServiceOwnerships(result.data);
      } else {
        toast.error(result.error ?? "Failed to load service ownerships");
      }
    } catch {
      toast.error("Failed to load service ownerships");
    } finally {
      setLoadingServices(false);
    }
  }, [counts.serviceOwnerships, personId]);

  const loadConfigurationItems = useCallback(async () => {
    if (counts.configurationItems === 0) {
      setConfigurationItems([]);
      return;
    }
    setLoadingCis(true);
    try {
      const result = await getPersonConfigurationItemsAction(personId);
      if (result.success) {
        setConfigurationItems(result.data);
      } else {
        toast.error(result.error ?? "Failed to load configuration items");
      }
    } catch {
      toast.error("Failed to load configuration items");
    } finally {
      setLoadingCis(false);
    }
  }, [counts.configurationItems, personId]);

  const loadDataOwnerships = useCallback(async () => {
    if (counts.dataOwnerships === 0) {
      setDataOwnerships([]);
      return;
    }
    setLoadingDataOwnerships(true);
    try {
      const result = await getPersonDataOwnershipsAction(personId);
      if (result.success) {
        setDataOwnerships(result.data);
      } else {
        toast.error(result.error ?? "Failed to load data ownerships");
      }
    } catch {
      toast.error("Failed to load data ownerships");
    } finally {
      setLoadingDataOwnerships(false);
    }
  }, [counts.dataOwnerships, personId]);

  useEffect(() => {
    void loadServiceOwnerships();
  }, [loadServiceOwnerships]);

  useEffect(() => {
    void loadConfigurationItems();
  }, [loadConfigurationItems]);

  useEffect(() => {
    void loadDataOwnerships();
  }, [loadDataOwnerships]);

  return (
    <div className="space-y-4">
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No services, configuration items, or data ownerships assigned
            </p>
          </CardContent>
        </Card>
      )}

      {/* Service Ownerships */}
      {counts.serviceOwnerships > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Service Ownerships
              <Badge variant="secondary">{counts.serviceOwnerships}</Badge>
            </CardTitle>
            <CardDescription>
              Services owned by this person (Technical, Business, or Product
              owner)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingServices ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : serviceOwnerships.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No service ownerships found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {serviceOwnerships.map((ownership) => (
                  <div
                    key={ownership.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{ownership.serviceName}</p>
                      <p className="text-muted-foreground text-xs">
                        Criticality: {ownership.criticality}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{ownership.ownershipType}</Badge>
                      {ownership.isPrimary && (
                        <Badge variant="secondary">Primary</Badge>
                      )}
                      <Badge variant="secondary">{ownership.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Items */}
      {counts.configurationItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Configuration Items
              <Badge variant="secondary">{counts.configurationItems}</Badge>
            </CardTitle>
            <CardDescription>
              CMDB configuration items owned by this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCis ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : configurationItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No configuration items found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {configurationItems.map((ci) => (
                  <div
                    key={ci.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{ci.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {ci.ciClassName ?? "CI Class"} •{" "}
                        {ci.lifecycleStateName ?? "Unknown state"}
                      </p>
                    </div>
                    {ci.environment && (
                      <Badge variant="outline">{ci.environment}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Ownerships */}
      {counts.dataOwnerships > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Data Ownerships
              <Badge variant="secondary">{counts.dataOwnerships}</Badge>
            </CardTitle>
            <CardDescription>Data domains owned by this person</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDataOwnerships ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : dataOwnerships.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No data ownerships found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {dataOwnerships.map((ownership) => (
                  <div
                    key={ownership.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{ownership.dataDomainName}</p>
                      {ownership.note && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {ownership.note}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">Owner</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Person Governance Tab
 *
 * Displays verification campaigns, verification items, attachments,
 * and disposal activities.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, FileCheck, Paperclip, Trash2 } from "lucide-react";
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
import { formatDate } from "@/lib/utils/date-format";
import {
  getPersonAttachmentsAction,
  getPersonDisposalsAction,
  getPersonVerificationCampaignsAction,
  getPersonVerificationItemsAction,
  type PersonAttachmentDTO,
  type PersonDisposalDTO,
  type PersonVerificationCampaignDTO,
  type PersonVerificationItemDTO,
} from "@/interface-adapters/controllers/person-details.controller";

interface PersonGovernanceTabProps {
  personId: string;
  counts: {
    verificationCampaigns: number;
    verificationItems: number;
    attachments: number;
    initiatedDisposals: number;
    approvedDisposals: number;
  };
}

export function PersonGovernanceTab({
  personId,
  counts,
}: PersonGovernanceTabProps) {
  const [campaigns, setCampaigns] = useState<PersonVerificationCampaignDTO[]>(
    [],
  );
  const [verificationItems, setVerificationItems] = useState<
    PersonVerificationItemDTO[]
  >([]);
  const [attachments, setAttachments] = useState<PersonAttachmentDTO[]>([]);
  const [disposals, setDisposals] = useState<PersonDisposalDTO[]>([]);

  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [loadingDisposals, setLoadingDisposals] = useState(false);

  const totalItems = useMemo(
    () =>
      counts.verificationCampaigns +
      counts.verificationItems +
      counts.attachments +
      counts.initiatedDisposals +
      counts.approvedDisposals,
    [counts],
  );

  const loadCampaigns = useCallback(async () => {
    if (counts.verificationCampaigns === 0) {
      setCampaigns([]);
      return;
    }
    setLoadingCampaigns(true);
    try {
      const result = await getPersonVerificationCampaignsAction(personId);
      if (result.success) {
        setCampaigns(result.data);
      } else {
        toast.error(result.error ?? "Failed to load campaigns");
      }
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  }, [counts.verificationCampaigns, personId]);

  const loadItems = useCallback(async () => {
    if (counts.verificationItems === 0) {
      setVerificationItems([]);
      return;
    }
    setLoadingItems(true);
    try {
      const result = await getPersonVerificationItemsAction(personId);
      if (result.success) {
        setVerificationItems(result.data);
      } else {
        toast.error(result.error ?? "Failed to load verification items");
      }
    } catch {
      toast.error("Failed to load verification items");
    } finally {
      setLoadingItems(false);
    }
  }, [counts.verificationItems, personId]);

  const loadAttachments = useCallback(async () => {
    if (counts.attachments === 0) {
      setAttachments([]);
      return;
    }
    setLoadingAttachments(true);
    try {
      const result = await getPersonAttachmentsAction(personId);
      if (result.success) {
        setAttachments(result.data);
      } else {
        toast.error(result.error ?? "Failed to load attachments");
      }
    } catch {
      toast.error("Failed to load attachments");
    } finally {
      setLoadingAttachments(false);
    }
  }, [counts.attachments, personId]);

  const loadDisposals = useCallback(async () => {
    if (counts.initiatedDisposals + counts.approvedDisposals === 0) {
      setDisposals([]);
      return;
    }
    setLoadingDisposals(true);
    try {
      const result = await getPersonDisposalsAction(personId);
      if (result.success) {
        setDisposals(result.data);
      } else {
        toast.error(result.error ?? "Failed to load disposals");
      }
    } catch {
      toast.error("Failed to load disposals");
    } finally {
      setLoadingDisposals(false);
    }
  }, [counts.approvedDisposals, counts.initiatedDisposals, personId]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    void loadAttachments();
  }, [loadAttachments]);

  useEffect(() => {
    void loadDisposals();
  }, [loadDisposals]);

  return (
    <div className="space-y-4">
      {totalItems === 0 && (
        <Card>
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">
              No governance activities recorded for this person
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification Campaigns */}
      {counts.verificationCampaigns > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Verification Campaigns Created
              <Badge variant="secondary">{counts.verificationCampaigns}</Badge>
            </CardTitle>
            <CardDescription>
              Data verification campaigns created by this person
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCampaigns ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No campaigns found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {campaign.targetType} •{" "}
                        {formatDate(campaign.scheduledStart)}
                        {campaign.scheduledEnd
                          ? ` - ${formatDate(campaign.scheduledEnd)}`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline">Creator</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Verification Items */}
      {counts.verificationItems > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Verification Items Assigned
              <Badge variant="secondary">{counts.verificationItems}</Badge>
            </CardTitle>
            <CardDescription>
              Items assigned to this person for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingItems ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : verificationItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No verification items found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {verificationItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{item.campaignName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.targetType}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{item.status}</Badge>
                      {item.verifiedAt && (
                        <Badge variant="secondary">
                          Verified {formatDate(item.verifiedAt)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {counts.attachments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Attachments Uploaded
              <Badge variant="secondary">{counts.attachments}</Badge>
            </CardTitle>
            <CardDescription>Files uploaded by this person</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAttachments ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No attachments found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{attachment.fileName}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">
                        {attachment.attachmentType}
                      </Badge>
                      <Badge variant="secondary">{attachment.targetType}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disposal Activities */}
      {(counts.initiatedDisposals > 0 || counts.approvedDisposals > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Disposal Activities
            </CardTitle>
            <CardDescription>
              Asset disposal workflow participation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDisposals ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : disposals.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No disposal records found
              </p>
            ) : (
              <div className="divide-border rounded-md border">
                {disposals.map((disposal) => (
                  <div
                    key={disposal.id}
                    className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{disposal.assetTag}</p>
                      <p className="text-muted-foreground text-xs">
                        {disposal.disposalDate
                          ? formatDate(disposal.disposalDate)
                          : "Date not set"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{disposal.disposalType}</Badge>
                      <Badge variant="secondary">{disposal.status}</Badge>
                      <Badge variant="outline">
                        {disposal.role === "initiated"
                          ? "Initiated"
                          : "Approved"}
                      </Badge>
                    </div>
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

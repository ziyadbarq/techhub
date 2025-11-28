/**
 * Person Governance Tab
 *
 * Displays verification campaigns, verification items, attachments,
 * and disposal activities.
 */

"use client";

import {
  ClipboardCheck,
  FileCheck,
  Paperclip,
  Trash2,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  personId: _personId,
  counts,
}: PersonGovernanceTabProps) {
  const totalItems =
    counts.verificationCampaigns +
    counts.verificationItems +
    counts.attachments +
    counts.initiatedDisposals +
    counts.approvedDisposals;

  return (
    <div className="space-y-4">
      {/* Summary */}
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
            <p className="text-muted-foreground text-sm">
              {counts.verificationCampaigns} campaign
              {counts.verificationCampaigns !== 1 ? "s" : ""} created
            </p>
            {/* TODO: Load and display actual campaigns */}
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
            <p className="text-muted-foreground text-sm">
              {counts.verificationItems} item
              {counts.verificationItems !== 1 ? "s" : ""} to verify
            </p>
            {/* TODO: Load and display actual verification items */}
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
            <p className="text-muted-foreground text-sm">
              {counts.attachments} attachment
              {counts.attachments !== 1 ? "s" : ""} uploaded
            </p>
            {/* TODO: Load and display actual attachments */}
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
          <CardContent className="space-y-3">
            {counts.initiatedDisposals > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Trash2 className="mr-1 h-3 w-3" />
                  Initiated
                </Badge>
                <span className="text-sm">
                  {counts.initiatedDisposals} disposal
                  {counts.initiatedDisposals !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {counts.approvedDisposals > 0 && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-green-500 text-green-600"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Approved
                </Badge>
                <span className="text-sm">
                  {counts.approvedDisposals} disposal
                  {counts.approvedDisposals !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {/* TODO: Load and display actual disposal records */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

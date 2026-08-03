"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Edit, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContractDTO } from "@/interface-adapters/presenters/contract.presenter";

interface ContractDetailClientProps {
  contract: ContractDTO;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function ContractDetailClient({ contract }: ContractDetailClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="px-2">
              <Link href="/contracts">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{contract.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {contract.contractTypeName ? (
              <Badge variant="outline">{contract.contractTypeName}</Badge>
            ) : null}
            {contract.isExpired ? (
              <Badge variant="destructive">Expired</Badge>
            ) : contract.isActive ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
            {contract.autoRenew ? (
              <Badge variant="secondary">Auto-Renew</Badge>
            ) : null}
          </div>
        </div>

        <Button onClick={() => router.push(`/contracts/${contract.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-sm">Vendor</p>
            <p className="font-medium">{contract.vendorName ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Contract Number</p>
            <p className="font-medium">{contract.contractNumber ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Start Date</p>
            <p className="font-medium">{formatDate(contract.startDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">End Date</p>
            <p className="font-medium">{formatDate(contract.endDate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Total Value</p>
            <p className="font-medium">
              {contract.totalValue !== null && contract.totalValue !== undefined
                ? `${contract.totalValue.toLocaleString()} ${contract.currency ?? "SAR"}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Days Until Expiry</p>
            <p className="font-medium">{contract.daysUntilExpiry ?? "—"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground text-sm">Renewal Terms</p>
            <p className="font-medium whitespace-pre-wrap">
              {contract.renewalTerms ?? "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground text-sm">Note</p>
            <p className="font-medium whitespace-pre-wrap">
              {contract.note ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Vendor Overview Tab
 *
 * Displays vendor details in organized card sections.
 */

"use client";

import { format } from "date-fns";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  Tag,
  FileText,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VendorDTO } from "@/interface-adapters/presenters/vendor.presenter";

interface VendorOverviewTabProps {
  vendor: VendorDTO;
}

const VENDOR_TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  RESELLER: "Reseller",
  SERVICE_PROVIDER: "Service Provider",
  CONSULTANT: "Consultant",
  CONTRACTOR: "Contractor",
  OTHER: "Other",
};

export function VendorOverviewTab({ vendor }: VendorOverviewTabProps) {
  // Format address
  const addressParts = [
    vendor.address,
    vendor.city,
    vendor.state,
    vendor.postalCode,
    vendor.country,
  ].filter(Boolean);
  const formattedAddress =
    addressParts.length > 0 ? addressParts.join(", ") : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Business Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-muted-foreground text-xs">Legal Name</p>
            <p className="text-sm font-medium">
              {vendor.legalName ?? vendor.name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Vendor Code</p>
            <p className="text-sm font-medium">{vendor.code}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Type</p>
            <p className="text-sm font-medium">
              {VENDOR_TYPE_LABELS[vendor.vendorType] ?? vendor.vendorType}
            </p>
          </div>
          {vendor.taxId && (
            <div>
              <p className="text-muted-foreground text-xs">Tax ID</p>
              <p className="text-sm font-medium">{vendor.taxId}</p>
            </div>
          )}
          {vendor.description && (
            <div>
              <p className="text-muted-foreground text-xs">Description</p>
              <p className="text-sm">{vendor.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendor.email ? (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <a
                href={`mailto:${vendor.email}`}
                className="text-primary text-sm hover:underline"
              >
                {vendor.email}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                No email provided
              </span>
            </div>
          )}
          {vendor.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <a
                href={`tel:${vendor.phone}`}
                className="text-primary text-sm hover:underline"
              >
                {vendor.phone}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Phone className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                No phone provided
              </span>
            </div>
          )}
          {vendor.website ? (
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline"
              >
                {vendor.website}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground text-sm">
                No website provided
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formattedAddress ? (
            <div className="space-y-1">
              {vendor.address && (
                <p className="text-sm font-medium">{vendor.address}</p>
              )}
              <p className="text-sm">
                {[vendor.city, vendor.state, vendor.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {vendor.country && (
                <p className="text-muted-foreground text-sm">
                  {vendor.country}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No address provided</p>
          )}
        </CardContent>
      </Card>

      {/* Business Terms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Business Terms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vendor.paymentTerms ? (
            <div>
              <p className="text-muted-foreground text-xs">Payment Terms</p>
              <p className="text-sm">{vendor.paymentTerms}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No payment terms specified
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      {vendor.tags && vendor.tags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vendor.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {vendor.note && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{vendor.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Audit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-muted-foreground text-xs">Created</p>
            <p className="text-sm">
              {format(new Date(vendor.createdAt), "PPP 'at' p")}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Last Updated</p>
            <p className="text-sm">
              {format(new Date(vendor.updatedAt), "PPP 'at' p")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

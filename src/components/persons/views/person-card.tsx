/**
 * Person Card Component
 * Individual card for card grid view with CRUD actions
 */

"use client";

import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { EmployeeAvatar } from "@/components/employee-directory/employee-avatar";

interface PersonCardProps {
  person: EmployeeDirectoryDTO;
  onViewReportingChain?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index?: number;
}

export function PersonCard({
  person,
  onViewReportingChain,
  onEdit,
  onDelete,
  index = 0,
}: PersonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Card className="group h-full transition-shadow hover:shadow-md">
        <CardContent className="p-6">
          {/* Header with avatar and name */}
          <div className="mb-4 flex flex-col items-center text-center">
            <EmployeeAvatar
              firstName={person.firstName}
              lastName={person.lastName}
              size="lg"
              className="mb-3"
            />
            <h3 className="text-lg font-semibold">{person.fullName}</h3>
            {person.title && (
              <p className="text-muted-foreground text-sm">{person.title}</p>
            )}
          </div>

          {/* Department and Location */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="truncate">{person.orgUnitName}</span>
            </div>
            {(person.office || person.locationName) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="truncate">
                  {person.office || person.locationName}
                </span>
              </div>
            )}
          </div>

          {/* Direct reports badge */}
          {person.directReportsCount > 0 && (
            <div className="mb-4">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {person.directReportsCount} direct report
                {person.directReportsCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}

          {/* Actions - visible on hover */}
          <div className="flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex gap-1">
              {/* Contact actions */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={`mailto:${person.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{person.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {(person.phone || person.mobile) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a href={`tel:${person.mobile || person.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{person.mobile || person.phone}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Edit action */}
              {onEdit && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Delete action */}
              {onDelete && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onDelete}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onViewReportingChain}
              className="text-xs"
            >
              View Chain
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

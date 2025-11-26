/**
 * Employee Card Component
 * Individual card for card grid view
 */

"use client";

import { Mail, Phone, MapPin, Building2, Users } from "lucide-react";
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
import { EmployeeAvatar } from "./employee-avatar";

interface EmployeeCardProps {
  employee: EmployeeDirectoryDTO;
  onViewReportingChain?: () => void;
  index?: number;
}

export function EmployeeCard({
  employee,
  onViewReportingChain,
  index = 0,
}: EmployeeCardProps) {
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
              firstName={employee.firstName}
              lastName={employee.lastName}
              size="lg"
              className="mb-3"
            />
            <h3 className="text-lg font-semibold">{employee.fullName}</h3>
            {employee.title && (
              <p className="text-muted-foreground text-sm">{employee.title}</p>
            )}
          </div>

          {/* Department and Location */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="truncate">{employee.orgUnitName}</span>
            </div>
            {(employee.office || employee.locationName) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
                <span className="truncate">
                  {employee.office || employee.locationName}
                </span>
              </div>
            )}
          </div>

          {/* Direct reports badge */}
          {employee.directReportsCount > 0 && (
            <div className="mb-4">
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {employee.directReportsCount} direct report
                {employee.directReportsCount !== 1 ? "s" : ""}
              </Badge>
            </div>
          )}

          {/* Contact actions - visible on hover */}
          <div className="flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" asChild>
                      <a href={`mailto:${employee.email}`}>
                        <Mail className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{employee.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {(employee.phone || employee.mobile) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a href={`tel:${employee.mobile || employee.phone}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{employee.mobile || employee.phone}</p>
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

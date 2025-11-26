/**
 * Reporting Chain Dialog Component
 * Displays the full reporting chain for an employee up to the CEO
 */

"use client";

import { useEffect, useState } from "react";
import { Loader2, Users, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EmployeeDirectoryDTO } from "@/interface-adapters/presenters/employee-directory.presenter";
import { getReportingChainAction } from "@/interface-adapters/controllers/employee-directory.controller";
import { EmployeeAvatar } from "./employee-avatar";

interface ReportingChainDialogProps {
  employee: EmployeeDirectoryDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportingChainDialog({
  employee,
  open,
  onOpenChange,
}: ReportingChainDialogProps) {
  const [chain, setChain] = useState<EmployeeDirectoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee || !open) {
      setChain([]);
      setError(null);
      return;
    }

    async function loadReportingChain() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getReportingChainAction(employee!.id);
        if (result.success) {
          setChain(result.data.chain);
        } else {
          setError(result.error);
        }
      } catch (_err) {
        setError("Failed to load reporting chain");
      } finally {
        setIsLoading(false);
      }
    }

    loadReportingChain();
  }, [employee, open]);

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporting Chain</DialogTitle>
          <DialogDescription>
            Management hierarchy for {employee.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="text-primary h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-2 text-sm">
                Loading reporting chain...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="text-destructive h-8 w-8" />
              <p className="text-destructive mt-2 text-sm">{error}</p>
            </div>
          ) : chain.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="text-muted-foreground h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                {employee.fullName} has no managers in their reporting chain.
              </p>
              <Badge variant="secondary" className="mt-2">
                Top of Organization
              </Badge>
            </div>
          ) : (
            <div className="relative space-y-3">
              {/* Connecting line with gradient */}
              <div className="via-border to-primary/60 absolute top-10 bottom-10 left-[2rem] w-0.5 rounded-full bg-gradient-to-b from-amber-400/60" />

              <AnimatePresence mode="sync">
                {/* Chain members (managers up to CEO) */}
                {chain.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ChainCard member={member} isFirst={index === 0} />
                  </motion.div>
                ))}

                {/* Current employee at the bottom */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: chain.length * 0.1 }}
                >
                  <Card className="border-primary/50 bg-primary/5 relative overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative z-10 shrink-0">
                        <EmployeeAvatar
                          firstName={employee.firstName}
                          lastName={employee.lastName}
                          size="md"
                        />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 truncate text-sm font-medium">
                            {employee.fullName}
                          </p>
                          <Badge variant="default" className="shrink-0 text-xs">
                            Selected
                          </Badge>
                        </div>
                        {employee.title && (
                          <p className="text-muted-foreground text-xs">
                            {employee.title}
                          </p>
                        )}
                        {employee.orgUnitName &&
                          employee.orgUnitName !== "Unassigned" && (
                            <p className="text-muted-foreground truncate text-xs">
                              {employee.orgUnitName}
                            </p>
                          )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChainCardProps {
  member: EmployeeDirectoryDTO;
  isFirst: boolean;
}

function ChainCard({ member, isFirst }: ChainCardProps) {
  return (
    <Card className="border-border/60 hover:bg-muted/50 relative overflow-hidden transition-colors">
      <div className="flex items-center gap-3 p-3">
        <div className="relative z-10 shrink-0">
          <EmployeeAvatar
            firstName={member.firstName}
            lastName={member.lastName}
            size="md"
          />
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-sm font-medium">
              {member.fullName}
            </p>
            {isFirst && (
              <Badge
                variant="outline"
                className="shrink-0 border-amber-500/50 text-xs text-amber-600 dark:border-amber-400/50 dark:text-amber-400"
              >
                Top
              </Badge>
            )}
          </div>
          {member.title && (
            <p className="text-muted-foreground text-xs">{member.title}</p>
          )}
          {member.orgUnitName && member.orgUnitName !== "Unassigned" && (
            <p className="text-muted-foreground truncate text-xs">
              {member.orgUnitName}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

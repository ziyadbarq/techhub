/**
 * Dependency Node Component
 * Custom XYFlow node for displaying entities in the dependency infographic
 */

"use client";

import { memo } from "react";
import { Handle, Position, type Node } from "@xyflow/react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTierColors, type TierType } from "./config";

// ============================================================================
// Types
// ============================================================================

export interface DependencyNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  shortDesc: string;
  fullDesc: string;
  href: string;
  icon: LucideIcon;
  order: number;
  tier: TierType;
  hasIncoming: boolean;
  hasOutgoing: boolean;
  isDark: boolean;
}

export type DependencyNodeType = Node<DependencyNodeData, "dependency">;

interface DependencyNodeProps {
  data: DependencyNodeData;
}

// ============================================================================
// Component
// ============================================================================

function DependencyNodeComponent({ data }: DependencyNodeProps) {
  const {
    name,
    shortDesc,
    fullDesc,
    href,
    icon: Icon,
    order,
    tier,
    hasIncoming,
    hasOutgoing,
    isDark,
  } = data;

  const colors = getTierColors(isDark)[tier];

  return (
    <>
      {/* Target handle (top) - for incoming connections */}
      {hasIncoming && (
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={false}
          className="!h-2 !min-h-0 !w-2 !min-w-0 !border-0 !bg-transparent"
        />
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "block w-40 rounded-lg border-2 p-3",
              "transition-all duration-200",
              "hover:scale-[1.03] hover:shadow-lg",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              colors.bg,
              colors.border,
              colors.hover,
            )}
            aria-label={`${name} - Step ${order}: ${shortDesc}`}
          >
            <div className="flex items-start gap-2.5">
              {/* Icon */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  colors.iconBg,
                )}
              >
                <Icon className={cn("h-4 w-4", colors.iconColor)} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="truncate text-sm leading-tight font-semibold">
                    {name}
                  </h3>
                  {/* Step badge */}
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      colors.badgeBg,
                      colors.badgeText,
                    )}
                  >
                    {order}
                  </span>
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
                  {shortDesc}
                </p>
              </div>
            </div>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs" sideOffset={8}>
          <div className="space-y-1">
            <p className="font-semibold">
              Step {order}: {name}
            </p>
            <p className="text-muted-foreground text-sm">{fullDesc}</p>
          </div>
        </TooltipContent>
      </Tooltip>

      {/* Source handle (bottom) - for outgoing connections */}
      {hasOutgoing && (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={false}
          className="!h-2 !min-h-0 !w-2 !min-w-0 !border-0 !bg-transparent"
        />
      )}
    </>
  );
}

export const DependencyNode = memo(DependencyNodeComponent);

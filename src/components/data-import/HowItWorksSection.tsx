"use client";

/**
 * Collapsible "How it Works" section for the data import page
 */

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export function HowItWorksSection() {
  return (
    <Collapsible defaultOpen={false}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <div className="flex w-full items-center justify-between">
              <CardTitle>How it Works</CardTitle>
              <ChevronDown className="text-muted-foreground h-5 w-5 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    1
                  </span>
                  Select Entity
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Choose which entity you want to import data into (Assets,
                  Persons, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    2
                  </span>
                  Configure Settings
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Set import options like duplicate handling and data
                  sanitization
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    3
                  </span>
                  Upload File
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Drag and drop your CSV or Excel file, or download a template
                  first
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    4
                  </span>
                  Map Columns
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Match your file columns to entity fields (auto-mapped when
                  possible)
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    5
                  </span>
                  Validate Data
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Review validation results and download error reports if needed
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <span className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    6
                  </span>
                  Import
                </h3>
                <p className="text-muted-foreground ml-8 text-sm">
                  Watch real-time progress as your data is imported
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

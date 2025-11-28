"use client";

/**
 * Bulk Create Assets Wizard
 *
 * A multi-step dialog for creating ITAM Assets from multiple Intune devices.
 * Step 1: Configure - Select category and options
 * Step 2: Progress - Show creation progress
 * Step 3: Results - Show summary of created/skipped/failed
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Building2,
  Cpu,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type {
  IntuneDeviceDTO,
  BulkCreateAssetsResultDTO,
} from "@/interface-adapters/dtos/generated/intune-device.dto";
import { bulkCreateAssetsFromDevicesAction } from "@/interface-adapters/controllers/intune-device.controller";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";

interface BulkCreateAssetsWizardProps {
  devices: IntuneDeviceDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type WizardStep = "configure" | "progress" | "results";

export function BulkCreateAssetsWizard({
  devices,
  open,
  onOpenChange,
  onSuccess,
}: BulkCreateAssetsWizardProps) {
  const [step, setStep] = useState<WizardStep>("configure");
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [categoryId, setCategoryId] = useState("");
  const [stockLocationId, setStockLocationId] = useState("");
  const [lifecycleStateId, setLifecycleStateId] = useState("");
  const [autoCreateVendor, setAutoCreateVendor] = useState(true);
  const [autoCreateModel, setAutoCreateModel] = useState(true);
  const [autoLinkToDevice, setAutoLinkToDevice] = useState(true);

  // Data state
  const [categories, setCategories] = useState<AssetCategoryDTO[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationDTO[]>([]);
  const [lifecycleStates, setLifecycleStates] = useState<LifecycleStateDTO[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Result state
  const [result, setResult] = useState<BulkCreateAssetsResultDTO | null>(null);

  // Calculate device eligibility
  const eligibleDevices = devices.filter(
    (d) => d.serialNumber && d.serialNumber !== "0" && !d.linkedAssetId,
  );
  const devicesWithoutSerial = devices.filter(
    (d) => !d.serialNumber || d.serialNumber === "0",
  );
  const alreadyLinkedDevices = devices.filter((d) => d.linkedAssetId);

  // Load data on open
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesResult, stockLocationsResult, lifecycleStatesResult] =
        await Promise.all([
          listAssetCategoriesAction(),
          listStockLocationsAction(),
          listLifecycleStatesAction(),
        ]);

      if (categoriesResult.success) {
        setCategories(categoriesResult.data ?? []);
      }
      if (stockLocationsResult.success) {
        setStockLocations(stockLocationsResult.data ?? []);
      }
      if (lifecycleStatesResult.success) {
        setLifecycleStates(lifecycleStatesResult.data ?? []);
      }
    } catch {
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
      // Reset state when opening
      setStep("configure");
      setCategoryId("");
      setStockLocationId("");
      setLifecycleStateId("");
      setAutoCreateVendor(true);
      setAutoCreateModel(true);
      setAutoLinkToDevice(true);
      setResult(null);
    }
  }, [open, loadData]);

  const handleCreate = async () => {
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsCreating(true);
    setStep("progress");

    try {
      const response = await bulkCreateAssetsFromDevicesAction({
        deviceIds: devices.map((d) => d.id),
        categoryId,
        stockLocationId: stockLocationId || undefined,
        lifecycleStateId: lifecycleStateId || undefined,
        autoCreateVendor,
        autoCreateModel,
        autoLinkToDevice,
      });

      if (response.success) {
        setResult(response.data);
        setStep("results");
        const { summary } = response.data;
        if (summary.created > 0) {
          toast.success(
            `Created ${summary.created} asset${summary.created !== 1 ? "s" : ""} successfully`,
          );
        } else {
          toast.info("No assets were created");
        }
      } else {
        toast.error(response.error || "Failed to create assets");
        setStep("configure");
      }
    } catch {
      toast.error("Failed to create assets");
      setStep("configure");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (step === "results" && result && result.summary.created > 0) {
      onSuccess();
    }
    onOpenChange(false);
  };

  const canProceed = !!categoryId && eligibleDevices.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bulk Create Assets
          </DialogTitle>
          <DialogDescription>
            {step === "configure" &&
              `Create assets for ${devices.length} selected device${devices.length !== 1 ? "s" : ""}`}
            {step === "progress" && "Creating assets..."}
            {step === "results" && "Bulk creation complete"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">Loading...</span>
          </div>
        ) : (
          <>
            {/* Step 1: Configure */}
            {step === "configure" && (
              <div className="space-y-6 py-4">
                {/* Device Summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Selected Devices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center rounded-md border p-2">
                        <span className="text-2xl font-bold text-green-600">
                          {eligibleDevices.length}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Eligible
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-md border p-2">
                        <span className="text-2xl font-bold text-amber-600">
                          {devicesWithoutSerial.length}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          No Serial
                        </span>
                      </div>
                      <div className="flex flex-col items-center rounded-md border p-2">
                        <span className="text-muted-foreground text-2xl font-bold">
                          {alreadyLinkedDevices.length}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Already Linked
                        </span>
                      </div>
                    </div>
                    {(devicesWithoutSerial.length > 0 ||
                      alreadyLinkedDevices.length > 0) && (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Devices without serial numbers or already linked will be
                        skipped.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {eligibleDevices.length === 0 && (
                  <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border p-3 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      No eligible devices selected. All selected devices either
                      have no serial number or are already linked to an asset.
                    </span>
                  </div>
                )}

                {/* Category Selection (Required) */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Asset Category <span className="text-destructive">*</span>
                  </Label>
                  <SearchableSelect
                    options={categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                    value={categoryId}
                    onValueChange={setCategoryId}
                    placeholder="Select a category..."
                    searchPlaceholder="Search categories..."
                  />
                </div>

                {/* Stock Location (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="stockLocation"
                    className="text-sm font-medium"
                  >
                    Stock Location
                  </Label>
                  <SearchableSelect
                    options={stockLocations.map((loc) => ({
                      value: loc.id,
                      label: loc.name,
                    }))}
                    value={stockLocationId}
                    onValueChange={setStockLocationId}
                    placeholder="Select a location (optional)..."
                    searchPlaceholder="Search locations..."
                  />
                </div>

                {/* Lifecycle State (Optional) */}
                <div className="space-y-2">
                  <Label
                    htmlFor="lifecycleState"
                    className="text-sm font-medium"
                  >
                    Lifecycle State
                  </Label>
                  <SearchableSelect
                    options={lifecycleStates.map((state) => ({
                      value: state.id,
                      label: state.name,
                    }))}
                    value={lifecycleStateId}
                    onValueChange={setLifecycleStateId}
                    placeholder="Select a state (optional)..."
                    searchPlaceholder="Search states..."
                  />
                </div>

                {/* Auto-create Options */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-medium">Auto-Create Options</h4>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-muted-foreground h-4 w-4" />
                      <Label htmlFor="autoVendor" className="text-sm">
                        Auto-create Vendors from manufacturer
                      </Label>
                    </div>
                    <Switch
                      id="autoVendor"
                      checked={autoCreateVendor}
                      onCheckedChange={setAutoCreateVendor}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="text-muted-foreground h-4 w-4" />
                      <Label htmlFor="autoModel" className="text-sm">
                        Auto-create Asset Models from model
                      </Label>
                    </div>
                    <Switch
                      id="autoModel"
                      checked={autoCreateModel}
                      onCheckedChange={setAutoCreateModel}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="text-muted-foreground h-4 w-4" />
                      <Label htmlFor="autoLink" className="text-sm">
                        Auto-link assets to devices
                      </Label>
                    </div>
                    <Switch
                      id="autoLink"
                      checked={autoLinkToDevice}
                      onCheckedChange={setAutoLinkToDevice}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Progress */}
            {step === "progress" && (
              <div className="space-y-6 py-8 text-center">
                <Loader2 className="text-primary mx-auto h-12 w-12 animate-spin" />
                <div>
                  <p className="text-lg font-medium">Creating Assets...</p>
                  <p className="text-muted-foreground text-sm">
                    Processing {eligibleDevices.length} device
                    {eligibleDevices.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <Progress value={undefined} className="w-full" />
                <p className="text-muted-foreground text-xs">
                  This may take a few moments
                </p>
              </div>
            )}

            {/* Step 3: Results */}
            {step === "results" && result && (
              <div className="space-y-4 py-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-2">
                  <Card className="bg-muted/30">
                    <CardContent className="flex flex-col items-center p-3">
                      <span className="text-muted-foreground text-xl font-bold">
                        {result.summary.total}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        Total
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
                    <CardContent className="flex flex-col items-center p-3">
                      <span className="text-xl font-bold text-green-600">
                        {result.summary.created}
                      </span>
                      <span className="text-xs text-green-600">Created</span>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                    <CardContent className="flex flex-col items-center p-3">
                      <span className="text-xl font-bold text-amber-600">
                        {result.summary.skipped}
                      </span>
                      <span className="text-xs text-amber-600">Skipped</span>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <CardContent className="flex flex-col items-center p-3">
                      <span className="text-xl font-bold text-red-600">
                        {result.summary.failed}
                      </span>
                      <span className="text-xs text-red-600">Failed</span>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Stats */}
                {(result.summary.vendorsCreated > 0 ||
                  result.summary.modelsCreated > 0) && (
                  <div className="flex justify-center gap-2">
                    {result.summary.vendorsCreated > 0 && (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        {result.summary.vendorsCreated} vendor
                        {result.summary.vendorsCreated !== 1 ? "s" : ""} created
                      </Badge>
                    )}
                    {result.summary.modelsCreated > 0 && (
                      <Badge variant="outline">
                        <Cpu className="mr-1 h-3 w-3" />
                        {result.summary.modelsCreated} model
                        {result.summary.modelsCreated !== 1 ? "s" : ""} created
                      </Badge>
                    )}
                  </div>
                )}

                {/* Results List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Details</CardTitle>
                    <CardDescription>
                      Completed in {(result.durationMs / 1000).toFixed(1)}s
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[200px] px-4 pb-4">
                      <div className="space-y-2">
                        {result.results.map((item) => (
                          <div
                            key={item.deviceId}
                            className="flex items-center justify-between rounded-md border p-2 text-sm"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.deviceName}
                              </span>
                              {item.serialNumber && (
                                <span className="text-muted-foreground font-mono text-xs">
                                  {item.serialNumber}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {item.success ? (
                                <>
                                  <span className="font-mono text-xs text-green-600">
                                    {item.assetTag}
                                  </span>
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </>
                              ) : (
                                <>
                                  <span className="text-muted-foreground max-w-[150px] truncate text-xs">
                                    {item.error}
                                  </span>
                                  {item.error?.includes("skipped") ? (
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          {step === "configure" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!canProceed || isCreating}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create {eligibleDevices.length} Asset
                    {eligibleDevices.length !== 1 ? "s" : ""}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === "progress" && (
            <Button variant="outline" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}

          {step === "results" && (
            <Button
              onClick={handleClose}
              className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

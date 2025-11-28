"use client";

/**
 * Create Asset from Device Wizard
 *
 * A multi-step dialog for creating an ITAM Asset from an Intune device.
 * Step 1: Select category and configure options
 * Step 2: Review and confirm
 */

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Building2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import type { IntuneDeviceDTO } from "@/interface-adapters/dtos/generated/intune-device.dto";
import { createAssetFromDeviceAction } from "@/interface-adapters/controllers/intune-device.controller";
import { listAssetCategoriesAction } from "@/interface-adapters/controllers/asset-category.controller";
import { listStockLocationsAction } from "@/interface-adapters/controllers/stock-location.controller";
import { listLifecycleStatesAction } from "@/interface-adapters/controllers/lifecycle-state.controller";
import type { AssetCategoryDTO } from "@/interface-adapters/presenters/asset-category.presenter";
import type { StockLocationDTO } from "@/interface-adapters/presenters/stock-location.presenter";
import type { LifecycleStateDTO } from "@/interface-adapters/presenters/lifecycle-state.presenter";

interface CreateAssetFromDeviceWizardProps {
  device: IntuneDeviceDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type WizardStep = "configure" | "review" | "success";

export function CreateAssetFromDeviceWizard({
  device,
  open,
  onOpenChange,
  onSuccess,
}: CreateAssetFromDeviceWizardProps) {
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
  const [result, setResult] = useState<{
    assetId: string;
    assetTag: string;
    vendorCreated: boolean;
    modelCreated: boolean;
  } | null>(null);

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
    try {
      const response = await createAssetFromDeviceAction({
        deviceId: device.id,
        categoryId,
        stockLocationId: stockLocationId || undefined,
        lifecycleStateId: lifecycleStateId || undefined,
        autoCreateVendor,
        autoCreateModel,
        autoLinkToDevice,
      });

      if (response.success) {
        setResult({
          assetId: response.data.assetId,
          assetTag: response.data.assetTag,
          vendorCreated: response.data.vendorCreated,
          modelCreated: response.data.modelCreated,
        });
        setStep("success");
        toast.success(`Asset ${response.data.assetTag} created successfully`);
      } else {
        toast.error(response.error || "Failed to create asset");
      }
    } catch {
      toast.error("Failed to create asset");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onSuccess();
    }
    onOpenChange(false);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedStockLocation = stockLocations.find(
    (s) => s.id === stockLocationId,
  );
  const selectedLifecycleState = lifecycleStates.find(
    (l) => l.id === lifecycleStateId,
  );

  const canProceed = !!categoryId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Asset from Device
          </DialogTitle>
          <DialogDescription>
            {step === "configure" && "Configure options for the new asset"}
            {step === "review" && "Review and confirm asset creation"}
            {step === "success" && "Asset created successfully"}
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
                      Device Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{" "}
                        {device.deviceName}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Serial:</span>{" "}
                        <span className="font-mono">
                          {device.serialNumber ?? "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Manufacturer:
                        </span>{" "}
                        {device.manufacturer ?? "Unknown"}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>{" "}
                        {device.model ?? "Unknown"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* No Serial Number Warning */}
                {(!device.serialNumber || device.serialNumber === "0") && (
                  <div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border p-3 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>
                      This device has no serial number. Assets require a unique
                      serial number for tracking.
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
                        Auto-create Vendor from manufacturer
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
                        Auto-create Asset Model from model
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
                        Auto-link asset to this device
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

            {/* Step 2: Review */}
            {step === "review" && (
              <div className="space-y-4 py-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Asset Details</CardTitle>
                    <CardDescription>
                      Review the asset that will be created
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-muted-foreground">Asset Tag:</div>
                      <div className="font-medium">Auto-generated</div>

                      <div className="text-muted-foreground">
                        Serial Number:
                      </div>
                      <div className="font-mono">{device.serialNumber}</div>

                      <div className="text-muted-foreground">Category:</div>
                      <div>{selectedCategory?.name ?? "Not selected"}</div>

                      {selectedStockLocation && (
                        <>
                          <div className="text-muted-foreground">Location:</div>
                          <div>{selectedStockLocation.name}</div>
                        </>
                      )}

                      {selectedLifecycleState && (
                        <>
                          <div className="text-muted-foreground">
                            Lifecycle State:
                          </div>
                          <div>{selectedLifecycleState.name}</div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 border-t pt-3">
                      <div className="text-muted-foreground mb-2">
                        Auto-create options:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {autoCreateVendor && device.manufacturer && (
                          <Badge variant="secondary">
                            <Building2 className="mr-1 h-3 w-3" />
                            Vendor: {device.manufacturer}
                          </Badge>
                        )}
                        {autoCreateModel && device.model && (
                          <Badge variant="secondary">
                            <Cpu className="mr-1 h-3 w-3" />
                            Model: {device.model}
                          </Badge>
                        )}
                        {autoLinkToDevice && (
                          <Badge variant="secondary">
                            <Wrench className="mr-1 h-3 w-3" />
                            Link to device
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Success */}
            {step === "success" && result && (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">Asset Created!</p>
                  <p className="text-muted-foreground">
                    Asset tag:{" "}
                    <span className="font-mono font-medium">
                      {result.assetTag}
                    </span>
                  </p>
                </div>
                {(result.vendorCreated || result.modelCreated) && (
                  <div className="flex justify-center gap-2">
                    {result.vendorCreated && (
                      <Badge variant="outline">
                        <Building2 className="mr-1 h-3 w-3" />
                        Vendor created
                      </Badge>
                    )}
                    {result.modelCreated && (
                      <Badge variant="outline">
                        <Cpu className="mr-1 h-3 w-3" />
                        Model created
                      </Badge>
                    )}
                  </div>
                )}
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
                onClick={() => setStep("review")}
                disabled={!canProceed || !device.serialNumber}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("configure")}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-barq-yellow text-barq-black hover:bg-barq-yellow/90"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Create Asset
                  </>
                )}
              </Button>
            </>
          )}

          {step === "success" && (
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

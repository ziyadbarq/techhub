export interface AssetDependencies {
  warranties: number;
  maintenanceSchedules: number;
  maintenanceRecords: number;
  assignments: number;
  stockMovements: number;
  disposals: number;
  reservations: number;
  kitCheckoutItems: number;
  configurationItems: number;
}

export interface IAssetDependencyRepository {
  getDependencies(assetId: string): Promise<AssetDependencies>;
  countActiveReservations(assetId: string): Promise<number>;
  countActiveDisposals(assetId: string): Promise<number>;
  countActiveKitCheckouts(assetId: string): Promise<number>;
  countActiveAssignments(assetId: string): Promise<number>;
}

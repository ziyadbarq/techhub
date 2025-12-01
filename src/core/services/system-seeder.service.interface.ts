export interface ResetDatabaseOptions {
  reseed?: boolean;
}

export interface ResetDatabaseResult {
  success: boolean;
  message: string;
}

export interface SeedMinimalDataResult {
  success: boolean;
  message: string;
  details?: {
    rolesCreated: number;
    permissionsCreated: number;
  };
}

export interface ISystemSeederService {
  resetDatabase(options?: ResetDatabaseOptions): Promise<ResetDatabaseResult>;
  seedMinimalData(): Promise<SeedMinimalDataResult>;
}

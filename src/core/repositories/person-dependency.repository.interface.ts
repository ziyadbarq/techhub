export interface PersonDependencies {
  userAccount: boolean;
  managedOrgUnits: number;
  managedPeople: number;
  configurationItems: number;
  stockMovements: number;
  verificationCampaigns: number;
  verificationItems: number;
  auditLogs: number;
  attachments: number;
  dataOwnerships: number;
  maintenanceSchedules: number;
  maintenanceRecords: number;
  disposalsInitiated: number;
  disposalsApproved: number;
  disposalApprovals: number;
  disposalDocuments: number;
  kitCheckouts: number;
  reservationsFor: number;
  reservationsCreated: number;
  reservationsConfirmed: number;
  reservationsCancelled: number;
  roleAssignments: number;
}

export interface IPersonDependencyRepository {
  getDependencies(personId: string): Promise<PersonDependencies>;
  countActiveMaintenanceSchedules(personId: string): Promise<number>;
  countActiveReservations(personId: string): Promise<number>;
}

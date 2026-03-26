import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import type { ILoggerService } from "@/core/services";
import type { ServiceInfrastructure } from "@/core/domain/entities/service-infrastructure.entity";
import type { ServiceLocation } from "@/generated/prisma";
import { LogExecution } from "@/lib/decorators";

export interface UpdateServiceInfrastructureRequest {
  infrastructureId: string;
  location?: ServiceLocation;
  cloudProvider?: string;
  compartment?: string;
  project?: string;
  region?: string;
  ipAddress?: string;
  hostname?: string;
  backupEnabled?: boolean;
  backupSchedule?: string;
  lastBackupDate?: Date;
  cloudProviderDetails?: Record<string, unknown>;
}

@injectable()
export class UpdateServiceInfrastructureUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceInfrastructureRepository)
    private readonly infrastructureRepository: IServiceInfrastructureRepository,

    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  @LogExecution("serviceInfrastructure.update")
  async execute(
    request: UpdateServiceInfrastructureRequest,
  ): Promise<ServiceInfrastructure> {
    const infrastructure = await this.infrastructureRepository.findById(
      request.infrastructureId,
    );
    if (!infrastructure) {
      throw new Error(
        `Service infrastructure with ID ${request.infrastructureId} not found`,
      );
    }

    infrastructure.update({
      location: request.location,
      cloudProvider: request.cloudProvider,
      compartment: request.compartment,
      project: request.project,
      region: request.region,
      ipAddress: request.ipAddress,
      hostname: request.hostname,
      backupEnabled: request.backupEnabled,
      backupSchedule: request.backupSchedule,
      lastBackupDate: request.lastBackupDate,
      cloudProviderDetails: request.cloudProviderDetails,
    });

    return this.infrastructureRepository.update(infrastructure);
  }
}

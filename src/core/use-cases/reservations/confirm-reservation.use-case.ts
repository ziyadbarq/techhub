import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface ConfirmReservationRequest {
  reservationId: string;
  confirmedById: string;
}

@injectable()
export class ConfirmReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
  ) {}

  async execute(request: ConfirmReservationRequest): Promise<AssetReservation> {
    const reservation = await this.reservationRepository.findById(
      request.reservationId,
    );
    if (!reservation) {
      throw new NotFoundError(
        `Reservation with ID ${request.reservationId} not found`,
      );
    }

    reservation.confirm(request.confirmedById);

    return this.reservationRepository.update(reservation);
  }
}

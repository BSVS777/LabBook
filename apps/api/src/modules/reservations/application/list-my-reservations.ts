import type { Reservation } from '../domain/reservation.js';
import type { ReservationRepository } from './ports/reservation-repository.js';

export interface ListMyReservationsInput {
  readonly userId: string;
}

/** Every reservation of the user (active and cancelled), earliest start first. */
export class ListMyReservations {
  constructor(private readonly reservations: ReservationRepository) {}

  async execute({ userId }: ListMyReservationsInput): Promise<readonly Reservation[]> {
    const mine = await this.reservations.findByUser(userId);
    return [...mine].sort((a, b) => a.slot.start.getTime() - b.slot.start.getTime());
  }
}

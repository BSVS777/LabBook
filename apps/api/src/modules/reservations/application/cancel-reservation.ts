import type { Clock } from '../../../shared/application/clock.js';
import type { Actor } from '../../../shared/domain/role.js';
import { ReservationNotFoundError } from '../domain/reservation-errors.js';
import type { Reservation } from '../domain/reservation.js';
import type { ReservationRepository } from './ports/reservation-repository.js';

export interface CancelReservationInput {
  readonly actor: Actor;
  readonly reservationId: string;
}

export class CancelReservation {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, reservationId }: CancelReservationInput): Promise<Reservation> {
    const reservation = await this.reservations.findById(reservationId);
    if (!reservation) throw new ReservationNotFoundError();

    const cancelled = reservation.cancel(actor, this.clock.now());
    await this.reservations.save(cancelled);
    return cancelled;
  }
}

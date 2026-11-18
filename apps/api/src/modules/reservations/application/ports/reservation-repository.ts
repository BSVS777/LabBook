import type { Reservation } from '../../domain/reservation.js';
import type { TimeSlot } from '../../domain/time-slot.js';

export interface ReservationRepository {
  /** Inserts or replaces the reservation with the same id. */
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | undefined>;
  findActiveOverlapping(labId: string, slot: TimeSlot): Promise<readonly Reservation[]>;
  findByUser(userId: string): Promise<readonly Reservation[]>;
  /** Active reservations of the lab that intersect the half-open interval `[from, to)`. */
  findActiveByLabBetween(labId: string, from: Date, to: Date): Promise<readonly Reservation[]>;
}

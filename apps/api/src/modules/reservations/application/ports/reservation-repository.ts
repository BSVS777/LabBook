import type { Reservation } from '../../domain/reservation.js';

export interface ReservationRepository {
  /** Inserts or replaces the reservation with the same id. Not safe for creating new bookings. */
  save(reservation: Reservation): Promise<void>;
  /**
   * Atomically checks that no active reservation of the same lab overlaps and stores the new one.
   * Implementations must make the check and the write indivisible, so two concurrent calls for
   * overlapping slots can never both succeed.
   * @throws ReservationOverlapError when the slot is already taken.
   */
  addIfSlotFree(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | undefined>;
  findByUser(userId: string): Promise<readonly Reservation[]>;
  /** Active reservations of the lab that intersect the half-open interval `[from, to)`. */
  findActiveByLabBetween(labId: string, from: Date, to: Date): Promise<readonly Reservation[]>;
}

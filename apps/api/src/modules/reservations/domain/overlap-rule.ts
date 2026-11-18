import { ReservationOverlapError } from './reservation-errors.js';
import type { Reservation } from './reservation.js';
import type { TimeSlot } from './time-slot.js';

/** Rule 1: a lab cannot hold two active reservations whose slots intersect. */
export function assertNoOverlap(slot: TimeSlot, labReservations: readonly Reservation[]): void {
  if (labReservations.some((reservation) => reservation.blocks(slot))) {
    throw new ReservationOverlapError();
  }
}

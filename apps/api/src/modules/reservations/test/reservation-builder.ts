import { Reservation, type ReservationProps } from '../domain/reservation.js';
import { TimeSlot } from '../domain/time-slot.js';
import { bogota } from './time.js';

export const DEFAULT_LAB_ID = 'lab-1';
export const DEFAULT_USER_ID = 'user-1';

/** A one-hour slot on a Monday, in Bogota local time. */
export function aSlot(start = '2026-03-02T10:00', end = '2026-03-02T11:00'): TimeSlot {
  return TimeSlot.create(bogota(start), bogota(end));
}

export function aReservation(overrides: Partial<ReservationProps> = {}): Reservation {
  return Reservation.restore({
    id: 'reservation-1',
    labId: DEFAULT_LAB_ID,
    userId: DEFAULT_USER_ID,
    slot: aSlot(),
    status: 'active',
    createdAt: bogota('2026-02-27T09:00'),
    ...overrides,
  });
}

import { parseOneOf } from '../../../../shared/infrastructure/closed-set.js';
import { Reservation, RESERVATION_STATUSES } from '../../domain/reservation.js';
import { TimeSlot } from '../../domain/time-slot.js';

/** The persisted shape of a reservation, independent of the generated Prisma types. */
export interface ReservationRow {
  readonly id: string;
  readonly labId: string;
  readonly userId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly status: string;
  readonly createdAt: Date;
  readonly cancelledAt: Date | null;
}

export function toReservation(row: ReservationRow): Reservation {
  return Reservation.restore({
    id: row.id,
    labId: row.labId,
    userId: row.userId,
    slot: TimeSlot.create(row.startsAt, row.endsAt),
    status: parseOneOf(RESERVATION_STATUSES, row.status, 'reservation status'),
    createdAt: row.createdAt,
  });
}

/** `cancelledAt` is stamped by the caller, because the domain does not track it. */
export function toReservationRow(
  reservation: Reservation,
  cancelledAt: Date | null,
): ReservationRow {
  return {
    id: reservation.id,
    labId: reservation.labId,
    userId: reservation.userId,
    startsAt: reservation.slot.start,
    endsAt: reservation.slot.end,
    status: reservation.status,
    createdAt: reservation.createdAt,
    cancelledAt,
  };
}

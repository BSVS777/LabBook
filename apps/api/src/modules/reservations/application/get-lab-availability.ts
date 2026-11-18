import type { Clock } from '../../../shared/application/clock.js';
import type { LabRepository } from '../../labs/application/ports/lab-repository.js';
import { LabNotFoundError } from '../../labs/domain/lab-errors.js';
import type { BookingPolicy } from '../domain/booking-policy.js';
import type { Reservation } from '../domain/reservation.js';
import type { TimeSlot } from '../domain/time-slot.js';
import type { ReservationRepository } from './ports/reservation-repository.js';

/** `unavailable` slots are not past but cannot be booked: lead time or maximum advance is violated. */
export type AvailabilityStatus = 'free' | 'taken' | 'past' | 'unavailable';

export interface AvailabilitySlot {
  readonly start: Date;
  readonly end: Date;
  readonly status: AvailabilityStatus;
}

export interface LabAvailability {
  readonly labId: string;
  /** Local date in the business time zone, `YYYY-MM-DD`. */
  readonly date: string;
  readonly isOpen: boolean;
  readonly slots: readonly AvailabilitySlot[];
}

export interface GetLabAvailabilityInput {
  readonly labId: string;
  readonly date: string;
}

export class GetLabAvailability {
  constructor(
    private readonly labs: LabRepository,
    private readonly reservations: ReservationRepository,
    private readonly policy: BookingPolicy,
    private readonly clock: Clock,
  ) {}

  async execute({ labId, date }: GetLabAvailabilityInput): Promise<LabAvailability> {
    const lab = await this.labs.findById(labId);
    if (!lab) throw new LabNotFoundError();
    lab.assertBookable();

    const daySlots = this.policy.slotsOf(date);
    const [first] = daySlots;
    const last = daySlots.at(-1);
    if (!first || !last) return { labId: lab.id, date, isOpen: false, slots: [] };

    const booked = await this.reservations.findActiveByLabBetween(lab.id, first.start, last.end);
    const now = this.clock.now();
    return {
      labId: lab.id,
      date,
      isOpen: true,
      slots: daySlots.map((slot) => ({
        start: slot.start,
        end: slot.end,
        status: this.statusOf(slot, booked, now),
      })),
    };
  }

  private statusOf(slot: TimeSlot, booked: readonly Reservation[], now: Date): AvailabilityStatus {
    if (slot.start < now) return 'past';
    if (booked.some((reservation) => reservation.blocks(slot))) return 'taken';
    return this.policy.isWithinBookingWindow(slot.start, now) ? 'free' : 'unavailable';
  }
}

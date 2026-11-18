import type { Clock } from '../../../shared/application/clock.js';
import type { IdGenerator } from '../../../shared/application/id-generator.js';
import { LabNotFoundError } from '../../labs/domain/lab-errors.js';
import type { LabRepository } from '../../labs/application/ports/lab-repository.js';
import type { BookingPolicy } from '../domain/booking-policy.js';
import { assertNoOverlap } from '../domain/overlap-rule.js';
import { Reservation } from '../domain/reservation.js';
import { TimeSlot } from '../domain/time-slot.js';
import type { ReservationRepository } from './ports/reservation-repository.js';

export interface CreateReservationInput {
  readonly userId: string;
  readonly labId: string;
  readonly start: Date;
  readonly end: Date;
}

export class CreateReservation {
  constructor(
    private readonly labs: LabRepository,
    private readonly reservations: ReservationRepository,
    private readonly policy: BookingPolicy,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreateReservationInput): Promise<Reservation> {
    const lab = await this.labs.findById(input.labId);
    if (!lab) throw new LabNotFoundError();
    lab.assertBookable();

    const now = this.clock.now();
    const slot = TimeSlot.create(input.start, input.end);
    this.policy.assertCanBook(slot, now);
    assertNoOverlap(slot, await this.reservations.findActiveOverlapping(lab.id, slot));

    const reservation = Reservation.create({
      id: this.ids.next(),
      labId: lab.id,
      userId: input.userId,
      slot,
      createdAt: now,
    });
    await this.reservations.save(reservation);
    return reservation;
  }
}

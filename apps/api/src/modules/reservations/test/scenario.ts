import { FixedClock } from '../../../shared/test/fixed-clock.js';
import { SequentialIdGenerator } from '../../../shared/test/sequential-id-generator.js';
import { InMemoryLabRepository } from '../../labs/infrastructure/in-memory/in-memory-lab-repository.js';
import { aLab } from '../../labs/test/lab-builder.js';
import { CancelReservation } from '../application/cancel-reservation.js';
import { CreateReservation } from '../application/create-reservation.js';
import { GetLabAvailability } from '../application/get-lab-availability.js';
import { ListMyReservations } from '../application/list-my-reservations.js';
import { BookingPolicy } from '../domain/booking-policy.js';
import { DEFAULT_BUSINESS_TIME_ZONE } from '../domain/reservation-rules.js';
import { InMemoryReservationRepository } from '../infrastructure/in-memory/in-memory-reservation-repository.js';
import { DEFAULT_LAB_ID } from './reservation-builder.js';
import { bogota } from './time.js';

export const INACTIVE_LAB_ID = 'lab-inactive';
/** Saturday morning, Bogota time: the following Monday is a valid booking day. */
export const DEFAULT_NOW = bogota('2026-02-28T08:00');

/** Wires every reservation use case to in-memory adapters and a controllable clock. */
export function createReservationScenario(now: Date = DEFAULT_NOW) {
  const labs = new InMemoryLabRepository([
    aLab({ id: DEFAULT_LAB_ID }),
    aLab({ id: INACTIVE_LAB_ID, name: 'Closed Lab', isActive: false }),
  ]);
  const reservations = new InMemoryReservationRepository();
  const clock = new FixedClock(now);
  const policy = new BookingPolicy(DEFAULT_BUSINESS_TIME_ZONE);
  const ids = new SequentialIdGenerator('reservation');

  return {
    clock,
    reservations,
    createReservation: new CreateReservation(labs, reservations, policy, ids, clock),
    cancelReservation: new CancelReservation(reservations, clock),
    listMyReservations: new ListMyReservations(reservations),
    getLabAvailability: new GetLabAvailability(labs, reservations, policy, clock),
  };
}

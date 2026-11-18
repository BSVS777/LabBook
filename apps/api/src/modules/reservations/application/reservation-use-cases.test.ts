import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import type { Actor } from '../../../shared/domain/role.js';
import { aReservation, aSlot, DEFAULT_LAB_ID } from '../test/reservation-builder.js';
import { createReservationScenario, INACTIVE_LAB_ID } from '../test/scenario.js';
import { bogota } from '../test/time.js';

const STUDENT: Actor = { id: 'user-1', role: 'student' };
const OTHER_STUDENT: Actor = { id: 'user-2', role: 'student' };
const ADMIN: Actor = { id: 'admin-1', role: 'admin' };

function request(start: string, end: string, labId = DEFAULT_LAB_ID, userId = STUDENT.id) {
  return { userId, labId, start: bogota(start), end: bogota(end) };
}

describe('CreateReservation', () => {
  it('stores an active reservation owned by the user, stamped by the clock', async () => {
    const scenario = createReservationScenario();

    const reservation = await scenario.createReservation.execute(
      request('2026-03-02T10:00', '2026-03-02T11:00'),
    );

    expect(reservation).toMatchObject({
      id: 'reservation-1',
      userId: STUDENT.id,
      status: 'active',
    });
    expect(reservation.createdAt).toEqual(scenario.clock.now());
    expect(await scenario.reservations.findById(reservation.id)).toBe(reservation);
  });

  it('allows back-to-back reservations in the same lab', async () => {
    const scenario = createReservationScenario();
    await scenario.createReservation.execute(request('2026-03-02T10:00', '2026-03-02T11:00'));

    await expect(
      scenario.createReservation.execute(request('2026-03-02T11:00', '2026-03-02T12:00')),
    ).resolves.toBeDefined();
  });

  it('rejects an overlapping reservation in the same lab', async () => {
    const scenario = createReservationScenario();
    await scenario.createReservation.execute(request('2026-03-02T10:00', '2026-03-02T11:00'));

    await expect(
      scenario.createReservation.execute(request('2026-03-02T10:30', '2026-03-02T11:30')),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESERVATION_OVERLAP });
  });

  it('frees the slot again once the reservation is cancelled', async () => {
    const scenario = createReservationScenario();
    const first = await scenario.createReservation.execute(
      request('2026-03-02T10:00', '2026-03-02T11:00'),
    );
    await scenario.cancelReservation.execute({ actor: STUDENT, reservationId: first.id });

    await expect(
      scenario.createReservation.execute(request('2026-03-02T10:00', '2026-03-02T11:00')),
    ).resolves.toBeDefined();
  });

  it('applies the booking policy', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.createReservation.execute(request('2026-03-08T10:00', '2026-03-08T11:00')),
    ).rejects.toMatchObject({ code: ERROR_CODES.CLOSED_DAY });
  });

  it('validates the time slot itself', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.createReservation.execute(request('2026-03-02T10:00', '2026-03-02T12:30')),
    ).rejects.toMatchObject({ code: ERROR_CODES.INVALID_DURATION });
  });

  it('rejects an unknown lab', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.createReservation.execute(request('2026-03-02T10:00', '2026-03-02T11:00', 'nope')),
    ).rejects.toMatchObject({ code: ERROR_CODES.LAB_NOT_FOUND });
  });

  it('rejects an inactive lab', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.createReservation.execute(
        request('2026-03-02T10:00', '2026-03-02T11:00', INACTIVE_LAB_ID),
      ),
    ).rejects.toMatchObject({ code: ERROR_CODES.LAB_INACTIVE });
  });
});

describe('CancelReservation', () => {
  async function scenarioWithReservation() {
    const scenario = createReservationScenario();
    const reservation = await scenario.createReservation.execute(
      request('2026-03-02T10:00', '2026-03-02T11:00'),
    );
    return { scenario, reservation };
  }

  it('cancels and persists the reservation for its owner', async () => {
    const { scenario, reservation } = await scenarioWithReservation();

    await scenario.cancelReservation.execute({ actor: STUDENT, reservationId: reservation.id });

    expect((await scenario.reservations.findById(reservation.id))?.status).toBe('cancelled');
  });

  it('lets an admin cancel it', async () => {
    const { scenario, reservation } = await scenarioWithReservation();

    const cancelled = await scenario.cancelReservation.execute({
      actor: ADMIN,
      reservationId: reservation.id,
    });

    expect(cancelled.status).toBe('cancelled');
  });

  it('forbids another student and leaves the reservation untouched', async () => {
    const { scenario, reservation } = await scenarioWithReservation();

    await expect(
      scenario.cancelReservation.execute({ actor: OTHER_STUDENT, reservationId: reservation.id }),
    ).rejects.toMatchObject({ code: ERROR_CODES.FORBIDDEN });
    expect((await scenario.reservations.findById(reservation.id))?.status).toBe('active');
  });

  it('rejects cancelling after the reservation started', async () => {
    const { scenario, reservation } = await scenarioWithReservation();
    scenario.clock.advanceTo(bogota('2026-03-02T10:00'));

    await expect(
      scenario.cancelReservation.execute({ actor: STUDENT, reservationId: reservation.id }),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESERVATION_ALREADY_STARTED });
  });

  it('rejects an unknown reservation', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.cancelReservation.execute({ actor: STUDENT, reservationId: 'nope' }),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESERVATION_NOT_FOUND });
  });
});

describe('ListMyReservations', () => {
  it('returns only the user reservations sorted by start', async () => {
    const scenario = createReservationScenario();
    await scenario.reservations.save(
      aReservation({ id: 'late', slot: aSlot('2026-03-03T10:00', '2026-03-03T11:00') }),
    );
    await scenario.reservations.save(
      aReservation({ id: 'early', slot: aSlot('2026-03-02T08:00', '2026-03-02T09:00') }),
    );
    await scenario.reservations.save(aReservation({ id: 'foreign', userId: OTHER_STUDENT.id }));

    const mine = await scenario.listMyReservations.execute({ userId: STUDENT.id });

    expect(mine.map((reservation) => reservation.id)).toEqual(['early', 'late']);
  });

  it('includes cancelled reservations', async () => {
    const scenario = createReservationScenario();
    await scenario.reservations.save(aReservation({ status: 'cancelled' }));

    expect(await scenario.listMyReservations.execute({ userId: STUDENT.id })).toHaveLength(1);
  });

  it('returns an empty list for a user without reservations', async () => {
    const scenario = createReservationScenario();

    expect(await scenario.listMyReservations.execute({ userId: 'nobody' })).toEqual([]);
  });
});

describe('GetLabAvailability', () => {
  const MONDAY = '2026-03-02';

  it('lists every half-hour slot of an open day', async () => {
    const scenario = createReservationScenario();

    const availability = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: MONDAY,
    });

    expect(availability.isOpen).toBe(true);
    expect(availability.slots).toHaveLength(28);
    expect(availability.slots.every((slot) => slot.status === 'free')).toBe(true);
  });

  it('marks reserved slots as taken and ignores cancelled reservations', async () => {
    const scenario = createReservationScenario();
    await scenario.reservations.save(
      aReservation({ id: 'active', slot: aSlot('2026-03-02T10:00', '2026-03-02T11:00') }),
    );
    await scenario.reservations.save(
      aReservation({
        id: 'cancelled',
        status: 'cancelled',
        slot: aSlot('2026-03-02T14:00', '2026-03-02T15:00'),
      }),
    );

    const { slots } = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: MONDAY,
    });
    const statusAt = (time: string) =>
      slots.find((slot) => slot.start.getTime() === bogota(`${MONDAY}T${time}`).getTime())?.status;

    expect(statusAt('09:30')).toBe('free');
    expect(statusAt('10:00')).toBe('taken');
    expect(statusAt('10:30')).toBe('taken');
    expect(statusAt('11:00')).toBe('free');
    expect(statusAt('14:00')).toBe('free');
  });

  it('marks slots that already started as past, even when reserved', async () => {
    const scenario = createReservationScenario(bogota('2026-03-02T09:00'));
    await scenario.reservations.save(
      aReservation({ slot: aSlot('2026-03-02T08:00', '2026-03-02T09:00') }),
    );

    const { slots } = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: MONDAY,
    });

    expect(slots.filter((slot) => slot.status === 'past')).toHaveLength(4);
    expect(slots[4]?.status).toBe('unavailable');
  });

  it('marks future slots inside the lead time as unavailable, not free', async () => {
    const scenario = createReservationScenario(bogota('2026-03-02T09:00'));

    const { slots } = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: MONDAY,
    });
    const statusAt = (time: string) =>
      slots.find((slot) => slot.start.getTime() === bogota(`${MONDAY}T${time}`).getTime())?.status;

    expect(statusAt('09:00')).toBe('unavailable');
    expect(statusAt('09:30')).toBe('unavailable');
    expect(statusAt('10:00')).toBe('free');
  });

  it('marks slots beyond the maximum advance as unavailable', async () => {
    const scenario = createReservationScenario(bogota('2026-03-02T08:00'));

    const { slots } = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: '2026-03-16',
    });
    const statusAt = (time: string) =>
      slots.find((slot) => slot.start.getTime() === bogota(`2026-03-16T${time}`).getTime())?.status;

    expect(statusAt('07:30')).toBe('free');
    expect(statusAt('08:00')).toBe('free');
    expect(statusAt('08:30')).toBe('unavailable');
  });

  it('lists every slot as unavailable when the whole day is out of the window', async () => {
    const scenario = createReservationScenario();

    const { slots } = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: '2026-04-06',
    });

    expect(slots.every((slot) => slot.status === 'unavailable')).toBe(true);
  });

  it('returns no slots on a closed day', async () => {
    const scenario = createReservationScenario();

    const availability = await scenario.getLabAvailability.execute({
      labId: DEFAULT_LAB_ID,
      date: '2026-03-08',
    });

    expect(availability).toMatchObject({ isOpen: false, slots: [] });
  });

  it('rejects an unknown lab', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.getLabAvailability.execute({ labId: 'nope', date: MONDAY }),
    ).rejects.toMatchObject({ code: ERROR_CODES.LAB_NOT_FOUND });
  });

  it('rejects an inactive lab', async () => {
    const scenario = createReservationScenario();

    await expect(
      scenario.getLabAvailability.execute({ labId: INACTIVE_LAB_ID, date: MONDAY }),
    ).rejects.toMatchObject({ code: ERROR_CODES.LAB_INACTIVE });
  });
});

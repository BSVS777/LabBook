import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../../shared/domain/domain-error.js';
import { aReservation, aSlot } from '../../test/reservation-builder.js';
import { InMemoryReservationRepository } from './in-memory-reservation-repository.js';

describe('InMemoryReservationRepository.addIfSlotFree', () => {
  it('stores a reservation whose slot is free', async () => {
    const repository = new InMemoryReservationRepository();
    const reservation = aReservation();

    await repository.addIfSlotFree(reservation);

    expect(await repository.findById(reservation.id)).toBe(reservation);
  });

  it('rejects an overlapping reservation of the same lab without storing it', async () => {
    const repository = new InMemoryReservationRepository();
    await repository.addIfSlotFree(aReservation({ id: 'first' }));

    await expect(repository.addIfSlotFree(aReservation({ id: 'second' }))).rejects.toMatchObject({
      code: ERROR_CODES.RESERVATION_OVERLAP,
    });
    expect(await repository.findById('second')).toBeUndefined();
  });

  it('accepts the same slot in another lab and back-to-back slots', async () => {
    const repository = new InMemoryReservationRepository();
    await repository.addIfSlotFree(aReservation({ id: 'first' }));

    await repository.addIfSlotFree(aReservation({ id: 'other-lab', labId: 'lab-2' }));
    await repository.addIfSlotFree(
      aReservation({ id: 'next', slot: aSlot('2026-03-02T11:00', '2026-03-02T12:00') }),
    );

    expect(await repository.findByUser('user-1')).toHaveLength(3);
  });

  it('ignores cancelled reservations', async () => {
    const repository = new InMemoryReservationRepository();
    await repository.addIfSlotFree(aReservation({ id: 'cancelled', status: 'cancelled' }));

    await expect(repository.addIfSlotFree(aReservation({ id: 'new' }))).resolves.toBeUndefined();
  });

  it('lets exactly one of two simultaneous overlapping requests succeed', async () => {
    const repository = new InMemoryReservationRepository();

    const outcomes = await Promise.allSettled([
      repository.addIfSlotFree(aReservation({ id: 'a' })),
      repository.addIfSlotFree(aReservation({ id: 'b' })),
    ]);

    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
  });
});

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../../shared/domain/domain-error.js';
import { FixedClock } from '../../../../shared/test/fixed-clock.js';
import { createTestDatabase } from '../../../../shared/test/test-database.js';
import { aReservation, aSlot } from '../../test/reservation-builder.js';
import { bogota } from '../../test/time.js';
import { PrismaReservationRepository } from './prisma-reservation-repository.js';

const LAB_ID = 'lab-1';
const OTHER_LAB_ID = 'lab-2';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';
const CONCURRENT_ATTEMPTS = 8;

const database = createTestDatabase();
const clock = new FixedClock(bogota('2026-03-01T09:00'));
const repository = new PrismaReservationRepository(database.prisma, clock);

beforeEach(async () => {
  await database.prisma.reservation.deleteMany();
  await database.prisma.user.deleteMany();
  await database.prisma.lab.deleteMany();
  await database.prisma.lab.createMany({
    data: [
      { id: LAB_ID, name: 'Chemistry', location: 'A', capacity: 20 },
      { id: OTHER_LAB_ID, name: 'Physics', location: 'B', capacity: 10 },
    ],
  });
  await database.prisma.user.createMany({
    data: [USER_ID, OTHER_USER_ID].map((id) => ({
      id,
      email: `${id}@example.com`,
      name: id,
      role: 'student',
      passwordHash: 'hash',
    })),
  });
});

afterAll(async () => {
  await database.dispose();
});

describe('PrismaReservationRepository.save and finders', () => {
  it('round-trips a reservation through the database', async () => {
    const reservation = aReservation();

    await repository.save(reservation);
    const found = await repository.findById(reservation.id);

    expect(found?.id).toBe(reservation.id);
    expect(found?.labId).toBe(LAB_ID);
    expect(found?.slot.start).toEqual(reservation.slot.start);
    expect(found?.slot.end).toEqual(reservation.slot.end);
    expect(found?.status).toBe('active');
    expect(found?.createdAt).toEqual(reservation.createdAt);
  });

  it('returns undefined for an unknown reservation', async () => {
    expect(await repository.findById('ghost')).toBeUndefined();
  });

  it('persists a cancellation and stamps the cancellation time', async () => {
    const reservation = aReservation();
    await repository.save(reservation);

    const cancelled = reservation.cancel({ id: USER_ID, role: 'student' }, clock.now());
    await repository.save(cancelled);

    expect((await repository.findById(reservation.id))?.status).toBe('cancelled');
    const row = await database.prisma.reservation.findUniqueOrThrow({
      where: { id: reservation.id },
    });
    expect(row.cancelledAt).toEqual(clock.now());
  });

  it('lists the reservations of a user ordered by start, cancelled ones included', async () => {
    await repository.save(
      aReservation({ id: 'late', slot: aSlot('2026-03-02T15:00', '2026-03-02T16:00') }),
    );
    await repository.save(
      aReservation({
        id: 'early',
        status: 'cancelled',
        slot: aSlot('2026-03-02T09:00', '2026-03-02T10:00'),
      }),
    );
    await repository.save(aReservation({ id: 'theirs', userId: OTHER_USER_ID }));

    const mine = await repository.findByUser(USER_ID);

    expect(mine.map(({ id }) => id)).toEqual(['early', 'late']);
  });

  it('finds active reservations of a lab inside a half-open window', async () => {
    await repository.save(
      aReservation({ id: 'before', slot: aSlot('2026-03-02T08:00', '2026-03-02T09:00') }),
    );
    await repository.save(
      aReservation({ id: 'inside', slot: aSlot('2026-03-02T10:00', '2026-03-02T11:00') }),
    );
    await repository.save(
      aReservation({ id: 'straddling', slot: aSlot('2026-03-02T09:30', '2026-03-02T10:30') }),
    );
    await repository.save(
      aReservation({
        id: 'cancelled',
        status: 'cancelled',
        slot: aSlot('2026-03-02T10:30', '2026-03-02T11:30'),
      }),
    );
    await repository.save(aReservation({ id: 'other-lab', labId: OTHER_LAB_ID }));

    const found = await repository.findActiveByLabBetween(
      LAB_ID,
      bogota('2026-03-02T09:00'),
      bogota('2026-03-02T10:00'),
    );

    expect(found.map(({ id }) => id)).toEqual(['straddling']);
  });

  it('refuses to load a reservation whose persisted status is not valid', async () => {
    const reservation = aReservation();
    await repository.save(reservation);
    await database.prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: 'pending' },
    });

    await expect(repository.findById(reservation.id)).rejects.toThrow(/reservation status/);
  });
});

describe('PrismaReservationRepository.addIfSlotFree', () => {
  it('stores a reservation whose slot is free', async () => {
    await repository.addIfSlotFree(aReservation());

    expect(await repository.findById('reservation-1')).toBeDefined();
  });

  it.each([
    ['identical', '2026-03-02T10:00', '2026-03-02T11:00'],
    ['overlapping the start', '2026-03-02T09:30', '2026-03-02T10:30'],
    ['overlapping the end', '2026-03-02T10:30', '2026-03-02T11:30'],
    ['contained', '2026-03-02T10:30', '2026-03-02T11:00'],
  ])('rejects a %s slot in the same lab and does not store it', async (_label, start, end) => {
    await repository.addIfSlotFree(aReservation({ id: 'first' }));

    await expect(
      repository.addIfSlotFree(aReservation({ id: 'second', slot: aSlot(start, end) })),
    ).rejects.toMatchObject({ code: ERROR_CODES.RESERVATION_OVERLAP });
    expect(await repository.findById('second')).toBeUndefined();
  });

  it('accepts back-to-back slots, other labs and slots freed by a cancellation', async () => {
    await repository.addIfSlotFree(aReservation({ id: 'first' }));

    await repository.addIfSlotFree(
      aReservation({ id: 'next', slot: aSlot('2026-03-02T11:00', '2026-03-02T12:00') }),
    );
    await repository.addIfSlotFree(aReservation({ id: 'other-lab', labId: OTHER_LAB_ID }));
    await repository.save(aReservation({ id: 'first', status: 'cancelled' }));
    await repository.addIfSlotFree(aReservation({ id: 'retaken' }));

    expect(await repository.findByUser(USER_ID)).toHaveLength(4);
  });

  it('lets exactly one of two simultaneous overlapping requests succeed', async () => {
    const outcomes = await Promise.allSettled([
      repository.addIfSlotFree(aReservation({ id: 'a', userId: USER_ID })),
      repository.addIfSlotFree(aReservation({ id: 'b', userId: OTHER_USER_ID })),
    ]);

    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.find(({ status }) => status === 'rejected')).toMatchObject({
      reason: { code: ERROR_CODES.RESERVATION_OVERLAP },
    });
    expect(await database.prisma.reservation.count({ where: { labId: LAB_ID } })).toBe(1);
  });

  it('keeps a single winner under many simultaneous requests', async () => {
    const attempts = Array.from({ length: CONCURRENT_ATTEMPTS }, (_unused, index) =>
      repository.addIfSlotFree(aReservation({ id: `attempt-${String(index)}` })),
    );

    const outcomes = await Promise.allSettled(attempts);

    expect(outcomes.filter(({ status }) => status === 'fulfilled')).toHaveLength(1);
    expect(await database.prisma.reservation.count({ where: { labId: LAB_ID } })).toBe(1);
  });
});

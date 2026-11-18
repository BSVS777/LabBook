import { describe, expect, it } from 'vitest';

import { errorResponseSchema } from './error.js';
import {
  availabilityQuerySchema,
  availabilityResponseSchema,
  createReservationBodySchema,
} from './reservations.js';

describe('createReservationBodySchema', () => {
  const valid = {
    labId: 'lab-1',
    start: '2026-03-02T15:00:00.000Z',
    end: '2026-03-02T16:00:00.000Z',
  };

  it('accepts UTC ISO instants', () => {
    expect(createReservationBodySchema.parse(valid)).toEqual(valid);
  });

  it('rejects dates that are not ISO instants', () => {
    expect(createReservationBodySchema.safeParse({ ...valid, start: 'tomorrow' }).success).toBe(
      false,
    );
  });

  it('rejects a missing lab', () => {
    expect(createReservationBodySchema.safeParse({ ...valid, labId: '' }).success).toBe(false);
  });
});

describe('availabilityQuerySchema', () => {
  it('accepts a calendar date', () => {
    expect(availabilityQuerySchema.parse({ date: '2026-03-02' })).toEqual({ date: '2026-03-02' });
  });

  it.each(['2026-3-2', '2026-02-30', '02/03/2026', ''])('rejects %j', (date) => {
    expect(availabilityQuerySchema.safeParse({ date }).success).toBe(false);
  });
});

describe('availabilityResponseSchema', () => {
  it('accepts a closed day without slots', () => {
    const closed = { labId: 'lab-1', date: '2026-03-08', isOpen: false, slots: [] };

    expect(availabilityResponseSchema.parse(closed)).toEqual(closed);
  });

  it('accepts the unavailable slot status', () => {
    const slot = {
      start: '2026-03-02T12:00:00.000Z',
      end: '2026-03-02T12:30:00.000Z',
      status: 'unavailable',
    };
    const body = { labId: 'l', date: '2026-03-02', isOpen: true, slots: [slot] };

    expect(availabilityResponseSchema.parse(body)).toEqual(body);
  });

  it('rejects an unknown slot status', () => {
    const slot = {
      start: '2026-03-02T12:00:00.000Z',
      end: '2026-03-02T12:30:00.000Z',
      status: 'busy',
    };

    expect(
      availabilityResponseSchema.safeParse({
        labId: 'l',
        date: '2026-03-02',
        isOpen: true,
        slots: [slot],
      }).success,
    ).toBe(false);
  });
});

describe('errorResponseSchema', () => {
  it('accepts the documented error envelope', () => {
    const body = { error: { code: 'RESERVATION_OVERLAP', message: 'Ya reservado' } };

    expect(errorResponseSchema.parse(body)).toEqual(body);
  });

  it('rejects an unknown error code', () => {
    expect(errorResponseSchema.safeParse({ error: { code: 'NOPE', message: 'x' } }).success).toBe(
      false,
    );
  });
});

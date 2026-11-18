import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import { aReservation, aSlot } from '../test/reservation-builder.js';
import { assertNoOverlap } from './overlap-rule.js';

const existing = aReservation({ slot: aSlot('2026-03-02T10:00', '2026-03-02T11:00') });

describe('assertNoOverlap', () => {
  it('accepts a lab without reservations', () => {
    expect(() => {
      assertNoOverlap(aSlot(), []);
    }).not.toThrow();
  });

  it.each([
    ['identical', '2026-03-02T10:00', '2026-03-02T11:00'],
    ['partially overlapping at the start', '2026-03-02T09:30', '2026-03-02T10:30'],
    ['partially overlapping at the end', '2026-03-02T10:30', '2026-03-02T11:30'],
    ['contained', '2026-03-02T10:30', '2026-03-02T11:00'],
    ['containing', '2026-03-02T09:30', '2026-03-02T11:30'],
  ])('rejects a %s slot', (_label, start, end) => {
    expect(() => {
      assertNoOverlap(aSlot(start, end), [existing]);
    }).toThrow(expect.objectContaining({ code: ERROR_CODES.RESERVATION_OVERLAP }));
  });

  it.each([
    ['right after', '2026-03-02T11:00', '2026-03-02T11:30'],
    ['right before', '2026-03-02T09:30', '2026-03-02T10:00'],
  ])('allows a back-to-back slot %s', (_label, start, end) => {
    expect(() => {
      assertNoOverlap(aSlot(start, end), [existing]);
    }).not.toThrow();
  });

  it('ignores cancelled reservations', () => {
    const cancelled = aReservation({ status: 'cancelled' });

    expect(() => {
      assertNoOverlap(aSlot(), [cancelled]);
    }).not.toThrow();
  });
});

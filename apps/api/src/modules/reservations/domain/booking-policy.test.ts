import { describe, expect, it } from 'vitest';

import { ERROR_CODES, type DomainErrorCode } from '../../../shared/domain/domain-error.js';
import { aSlot } from '../test/reservation-builder.js';
import { addMinutes, bogota } from '../test/time.js';
import { BookingPolicy } from './booking-policy.js';
import { DEFAULT_BUSINESS_TIME_ZONE } from './reservation-rules.js';

const policy = new BookingPolicy(DEFAULT_BUSINESS_TIME_ZONE);
/** Saturday morning: every weekday of the following week is within 14 days. */
const NOW = bogota('2026-02-28T08:00');
const MINUTES_IN_14_DAYS = 14 * 24 * 60;

function rejectionOf(start: string, end: string, now = NOW): DomainErrorCode | undefined {
  try {
    policy.assertCanBook(aSlot(start, end), now);
    return undefined;
  } catch (error) {
    return (error as { code: DomainErrorCode }).code;
  }
}

describe('BookingPolicy', () => {
  describe('opening hours', () => {
    it('accepts a reservation at opening time', () => {
      expect(rejectionOf('2026-03-02T07:00', '2026-03-02T07:30')).toBeUndefined();
    });

    it('accepts a reservation ending exactly at closing time', () => {
      expect(rejectionOf('2026-03-02T20:00', '2026-03-02T21:00')).toBeUndefined();
    });

    it('rejects a reservation starting before opening', () => {
      expect(rejectionOf('2026-03-02T06:30', '2026-03-02T07:30')).toBe(
        ERROR_CODES.OUTSIDE_OPENING_HOURS,
      );
    });

    it('rejects a reservation ending after closing', () => {
      expect(rejectionOf('2026-03-02T20:30', '2026-03-02T21:30')).toBe(
        ERROR_CODES.OUTSIDE_OPENING_HOURS,
      );
    });

    it('rejects a reservation that crosses midnight', () => {
      expect(rejectionOf('2026-03-02T23:30', '2026-03-03T00:30')).toBe(
        ERROR_CODES.OUTSIDE_OPENING_HOURS,
      );
    });

    it('evaluates hours in the business zone, not in UTC', () => {
      // 07:00 Bogota is 12:00 UTC; 21:00 Bogota is 02:00 UTC of the next day.
      expect(rejectionOf('2026-03-02T20:30', '2026-03-02T21:00')).toBeUndefined();
    });
  });

  describe('closed days', () => {
    it('rejects Sunday', () => {
      expect(rejectionOf('2026-03-08T10:00', '2026-03-08T11:00')).toBe(ERROR_CODES.CLOSED_DAY);
    });

    it('accepts Saturday', () => {
      expect(rejectionOf('2026-03-07T10:00', '2026-03-07T11:00')).toBeUndefined();
    });
  });

  describe('lead time', () => {
    const start = '2026-03-02T10:00';
    const end = '2026-03-02T10:30';
    const startInstant = bogota(start);

    it('accepts a start exactly 60 minutes from now', () => {
      expect(rejectionOf(start, end, addMinutes(startInstant, -60))).toBeUndefined();
    });

    it('rejects a start 59 minutes from now', () => {
      expect(rejectionOf(start, end, addMinutes(startInstant, -59))).toBe(
        ERROR_CODES.INSUFFICIENT_LEAD_TIME,
      );
    });

    it('rejects a start in the past', () => {
      expect(rejectionOf(start, end, addMinutes(startInstant, 30))).toBe(ERROR_CODES.PAST_DATE);
    });
  });

  describe('maximum advance', () => {
    const start = '2026-03-16T10:00';
    const startInstant = bogota(start);

    it('accepts a start exactly 14 days from now', () => {
      const now = addMinutes(startInstant, -MINUTES_IN_14_DAYS);

      expect(rejectionOf(start, '2026-03-16T10:30', now)).toBeUndefined();
    });

    it('rejects a start 14 days and 30 minutes from now', () => {
      const now = addMinutes(startInstant, -(MINUTES_IN_14_DAYS + 30));

      expect(rejectionOf(start, '2026-03-16T10:30', now)).toBe(ERROR_CODES.TOO_FAR_IN_ADVANCE);
    });
  });

  describe('booking window', () => {
    const slotStart = bogota('2026-03-02T10:00');

    it('accepts a start exactly at the minimum lead time', () => {
      expect(policy.isWithinBookingWindow(slotStart, addMinutes(slotStart, -60))).toBe(true);
    });

    it('rejects a start inside the lead time', () => {
      expect(policy.isWithinBookingWindow(slotStart, addMinutes(slotStart, -30))).toBe(false);
    });

    it('rejects a start that already passed', () => {
      expect(policy.isWithinBookingWindow(slotStart, addMinutes(slotStart, 30))).toBe(false);
    });

    it('accepts a start exactly at the maximum advance and rejects one slot later', () => {
      expect(
        policy.isWithinBookingWindow(slotStart, addMinutes(slotStart, -MINUTES_IN_14_DAYS)),
      ).toBe(true);
      expect(
        policy.isWithinBookingWindow(slotStart, addMinutes(slotStart, -(MINUTES_IN_14_DAYS + 30))),
      ).toBe(false);
    });
  });

  describe('daily slots', () => {
    it('lists 28 half-hour slots between opening and closing on an open day', () => {
      const slots = policy.slotsOf('2026-03-02');

      expect(slots).toHaveLength(28);
      expect(slots[0]?.start).toEqual(bogota('2026-03-02T07:00'));
      expect(slots[27]?.end).toEqual(bogota('2026-03-02T21:00'));
    });

    it('lists no slots and reports closed on Sunday', () => {
      expect(policy.isOpenOn('2026-03-08')).toBe(false);
      expect(policy.slotsOf('2026-03-08')).toEqual([]);
    });

    it('reports Saturday as open', () => {
      expect(policy.isOpenOn('2026-03-07')).toBe(true);
    });
  });
});

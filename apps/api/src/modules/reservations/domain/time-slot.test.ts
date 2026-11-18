import { describe, expect, it } from 'vitest';

import { ERROR_CODES } from '../../../shared/domain/domain-error.js';
import { bogota } from '../test/time.js';
import { TimeSlot } from './time-slot.js';

const START = '2026-03-02T09:00';

function slotCode(start: string, end: string): string | undefined {
  try {
    TimeSlot.create(bogota(start), bogota(end));
    return undefined;
  } catch (error) {
    return (error as { code?: string }).code;
  }
}

describe('TimeSlot', () => {
  describe('duration', () => {
    it.each([
      ['30 minutes', '2026-03-02T09:30', 30],
      ['90 minutes', '2026-03-02T10:30', 90],
      ['120 minutes', '2026-03-02T11:00', 120],
    ])('accepts %s', (_label, end, minutes) => {
      expect(TimeSlot.create(bogota(START), bogota(end)).durationMinutes).toBe(minutes);
    });

    it('rejects 150 minutes as too long', () => {
      expect(slotCode(START, '2026-03-02T11:30')).toBe(ERROR_CODES.INVALID_DURATION);
    });
  });

  describe('alignment', () => {
    it('rejects a duration that is not a multiple of the slot size', () => {
      expect(slotCode(START, '2026-03-02T09:45')).toBe(ERROR_CODES.SLOT_NOT_ALIGNED);
    });

    it('rejects a start that is not on a slot boundary', () => {
      expect(slotCode('2026-03-02T07:15', '2026-03-02T08:15')).toBe(ERROR_CODES.SLOT_NOT_ALIGNED);
    });

    it('accepts half-hour boundaries', () => {
      expect(slotCode('2026-03-02T07:30', '2026-03-02T08:00')).toBeUndefined();
    });
  });

  describe('ordering', () => {
    it('rejects an end equal to the start', () => {
      expect(slotCode(START, START)).toBe(ERROR_CODES.INVALID_TIME_SLOT);
    });

    it('rejects an end before the start', () => {
      expect(slotCode(START, '2026-03-02T08:30')).toBe(ERROR_CODES.INVALID_TIME_SLOT);
    });

    it.each([
      ['start', new Date('nope'), bogota(START)],
      ['end', bogota(START), new Date('nope')],
      ['start and end', new Date('nope'), new Date('nope')],
    ])('rejects an invalid %s with INVALID_TIME_SLOT', (_label, start, end) => {
      expect(() => TimeSlot.create(start, end)).toThrow(
        expect.objectContaining({ code: ERROR_CODES.INVALID_TIME_SLOT }),
      );
    });
  });

  describe('overlaps', () => {
    const base = TimeSlot.create(bogota('2026-03-02T09:00'), bogota('2026-03-02T10:00'));
    const slot = (start: string, end: string): TimeSlot =>
      TimeSlot.create(bogota(start), bogota(end));

    it('detects partial overlap on either side', () => {
      expect(base.overlaps(slot('2026-03-02T08:30', '2026-03-02T09:30'))).toBe(true);
      expect(base.overlaps(slot('2026-03-02T09:30', '2026-03-02T10:30'))).toBe(true);
    });

    it('detects containment in both directions', () => {
      expect(base.overlaps(slot('2026-03-02T09:30', '2026-03-02T10:00'))).toBe(true);
      expect(base.overlaps(slot('2026-03-02T08:30', '2026-03-02T10:30'))).toBe(true);
    });

    it('allows back-to-back slots', () => {
      expect(base.overlaps(slot('2026-03-02T10:00', '2026-03-02T10:30'))).toBe(false);
      expect(base.overlaps(slot('2026-03-02T08:30', '2026-03-02T09:00'))).toBe(false);
    });
  });
});

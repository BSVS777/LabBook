import { describe, expect, it } from 'vitest';

import { bogota } from '../../modules/reservations/test/time.js';
import { minuteOfDay, toInstant, toLocalDateTime, Weekday } from './business-calendar.js';

const BOGOTA = 'America/Bogota';
const NEW_YORK = 'America/New_York';

describe('toLocalDateTime', () => {
  it('reads the wall clock in the requested zone', () => {
    expect(toLocalDateTime(bogota('2026-03-02T07:30'), BOGOTA)).toEqual({
      date: '2026-03-02',
      weekday: Weekday.MONDAY,
      hour: 7,
      minute: 30,
    });
  });

  it('rolls the local date back when UTC is already the next day', () => {
    const local = toLocalDateTime(new Date('2026-03-03T02:00:00Z'), BOGOTA);

    expect(local.date).toBe('2026-03-02');
    expect(local.hour).toBe(21);
  });

  it('reports midnight as hour 0', () => {
    expect(toLocalDateTime(bogota('2026-03-02T00:00'), BOGOTA).hour).toBe(0);
  });

  it('identifies Sunday', () => {
    expect(toLocalDateTime(bogota('2026-03-01T12:00'), BOGOTA).weekday).toBe(Weekday.SUNDAY);
  });

  it('follows daylight saving time of the zone', () => {
    const winter = toLocalDateTime(new Date('2026-01-15T12:00:00Z'), NEW_YORK);
    const summer = toLocalDateTime(new Date('2026-07-15T12:00:00Z'), NEW_YORK);

    expect(winter.hour).toBe(7);
    expect(summer.hour).toBe(8);
  });
});

describe('minuteOfDay', () => {
  it('counts minutes since local midnight', () => {
    expect(minuteOfDay({ hour: 7, minute: 30 })).toBe(450);
  });
});

describe('toInstant', () => {
  it('is the inverse of toLocalDateTime', () => {
    expect(toInstant('2026-03-02', 7 * 60 + 30, BOGOTA)).toEqual(bogota('2026-03-02T07:30'));
  });

  it('resolves wall-clock times across daylight saving offsets', () => {
    expect(toInstant('2026-01-15', 7 * 60, NEW_YORK)).toEqual(new Date('2026-01-15T12:00:00Z'));
    expect(toInstant('2026-07-15', 7 * 60, NEW_YORK)).toEqual(new Date('2026-07-15T11:00:00Z'));
  });
});

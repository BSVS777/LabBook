import { MILLIS_PER_MINUTE, MINUTES_PER_HOUR } from './time-units.js';

export const Weekday = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

export type Weekday = (typeof Weekday)[keyof typeof Weekday];

/** Wall-clock reading of an instant in a given time zone. `date` is `YYYY-MM-DD`. */
export interface LocalDateTime {
  readonly date: string;
  readonly weekday: Weekday;
  readonly hour: number;
  readonly minute: number;
}

const WEEKDAY_BY_SHORT_NAME: ReadonlyMap<string, Weekday> = new Map([
  ['Sun', Weekday.SUNDAY],
  ['Mon', Weekday.MONDAY],
  ['Tue', Weekday.TUESDAY],
  ['Wed', Weekday.WEDNESDAY],
  ['Thu', Weekday.THURSDAY],
  ['Fri', Weekday.FRIDAY],
  ['Sat', Weekday.SATURDAY],
]);

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  formatters.set(timeZone, created);
  return created;
}

export function minuteOfDay(local: Pick<LocalDateTime, 'hour' | 'minute'>): number {
  return local.hour * MINUTES_PER_HOUR + local.minute;
}

export function toLocalDateTime(instant: Date, timeZone: string): LocalDateTime {
  const parts = new Map<string, string>();
  for (const { type, value } of formatterFor(timeZone).formatToParts(instant)) {
    parts.set(type, value);
  }
  const read = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.get(type);
    if (value === undefined) throw new Error(`Missing "${type}" part for time zone ${timeZone}`);
    return value;
  };
  const weekday = WEEKDAY_BY_SHORT_NAME.get(read('weekday'));
  if (weekday === undefined) throw new Error(`Unknown weekday for time zone ${timeZone}`);
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    weekday,
    hour: Number(read('hour')),
    minute: Number(read('minute')),
  };
}

function wallClockAsUtcMillis(local: LocalDateTime): number {
  return Date.parse(`${local.date}T00:00:00Z`) + minuteOfDay(local) * MILLIS_PER_MINUTE;
}

function offsetMillis(utcMillis: number, timeZone: string): number {
  const local = toLocalDateTime(new Date(utcMillis), timeZone);
  return wallClockAsUtcMillis(local) - utcMillis;
}

/** Instant at which the wall clock of `timeZone` reads `date` + `minuteOfDayValue`. */
export function toInstant(date: string, minuteOfDayValue: number, timeZone: string): Date {
  const wallClock = Date.parse(`${date}T00:00:00Z`) + minuteOfDayValue * MILLIS_PER_MINUTE;
  const firstGuess = wallClock - offsetMillis(wallClock, timeZone);
  return new Date(wallClock - offsetMillis(firstGuess, timeZone));
}

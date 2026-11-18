import { minuteOfDay, toLocalDateTime } from '../../../shared/domain/business-calendar.js';
import {
  MILLIS_PER_MINUTE,
  MINUTES_PER_DAY,
  MINUTES_PER_HOUR,
} from '../../../shared/domain/time-units.js';
import {
  ClosedDayError,
  InsufficientLeadTimeError,
  OutsideOpeningHoursError,
  PastDateError,
  TooFarInAdvanceError,
} from './reservation-errors.js';
import {
  CLOSING_HOUR,
  MAX_ADVANCE_DAYS,
  MIN_LEAD_TIME_MINUTES,
  OPEN_WEEKDAYS,
  OPENING_HOUR,
} from './reservation-rules.js';
import type { TimeSlot } from './time-slot.js';

const OPENING_MINUTE = OPENING_HOUR * MINUTES_PER_HOUR;
const CLOSING_MINUTE = CLOSING_HOUR * MINUTES_PER_HOUR;
const MIN_LEAD_TIME_MILLIS = MIN_LEAD_TIME_MINUTES * MILLIS_PER_MINUTE;
const MAX_ADVANCE_MILLIS = MAX_ADVANCE_DAYS * MINUTES_PER_DAY * MILLIS_PER_MINUTE;

/** Pure booking rules 2-4 that depend on the calendar and on "now". */
export class BookingPolicy {
  constructor(private readonly timeZone: string) {}

  assertCanBook(slot: TimeSlot, now: Date): void {
    this.assertLeadTime(slot, now);
    this.assertOpeningHours(slot);
  }

  private assertLeadTime(slot: TimeSlot, now: Date): void {
    const untilStart = slot.start.getTime() - now.getTime();
    if (untilStart < 0) throw new PastDateError();
    if (untilStart < MIN_LEAD_TIME_MILLIS) throw new InsufficientLeadTimeError();
    if (untilStart > MAX_ADVANCE_MILLIS) throw new TooFarInAdvanceError();
  }

  private assertOpeningHours(slot: TimeSlot): void {
    const start = toLocalDateTime(slot.start, this.timeZone);
    const end = toLocalDateTime(slot.end, this.timeZone);
    if (!OPEN_WEEKDAYS.includes(start.weekday)) throw new ClosedDayError();
    const staysWithinDay = end.date === start.date;
    if (
      !staysWithinDay ||
      minuteOfDay(start) < OPENING_MINUTE ||
      minuteOfDay(end) > CLOSING_MINUTE
    ) {
      throw new OutsideOpeningHoursError();
    }
  }
}

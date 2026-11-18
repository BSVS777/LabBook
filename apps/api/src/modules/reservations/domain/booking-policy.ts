import {
  minuteOfDay,
  toInstant,
  toLocalDateTime,
} from '../../../shared/domain/business-calendar.js';
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
  SLOT_MINUTES,
} from './reservation-rules.js';
import { TimeSlot } from './time-slot.js';

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

  /** Whether labs open on the given local date (`YYYY-MM-DD`). */
  isOpenOn(date: string): boolean {
    const { weekday } = toLocalDateTime(
      toInstant(date, OPENING_MINUTE, this.timeZone),
      this.timeZone,
    );
    return OPEN_WEEKDAYS.includes(weekday);
  }

  /** Every bookable slot of the given local date, in order; empty when closed. */
  slotsOf(date: string): TimeSlot[] {
    if (!this.isOpenOn(date)) return [];
    const slots: TimeSlot[] = [];
    for (let minute = OPENING_MINUTE; minute < CLOSING_MINUTE; minute += SLOT_MINUTES) {
      slots.push(
        TimeSlot.create(
          toInstant(date, minute, this.timeZone),
          toInstant(date, minute + SLOT_MINUTES, this.timeZone),
        ),
      );
    }
    return slots;
  }

  /** Whether a slot starting at `start` respects the lead-time and maximum-advance limits. */
  isWithinBookingWindow(start: Date, now: Date): boolean {
    const untilStart = start.getTime() - now.getTime();
    return untilStart >= MIN_LEAD_TIME_MILLIS && untilStart <= MAX_ADVANCE_MILLIS;
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

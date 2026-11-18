import { MILLIS_PER_MINUTE } from '../../../shared/domain/time-units.js';
import {
  InvalidDurationError,
  InvalidTimeSlotError,
  SlotNotAlignedError,
} from './reservation-errors.js';
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES, SLOT_MINUTES } from './reservation-rules.js';

const SLOT_MILLIS = SLOT_MINUTES * MILLIS_PER_MINUTE;

function isAligned(instant: Date): boolean {
  return instant.getTime() % SLOT_MILLIS === 0;
}

/** Half-open interval `[start, end)` aligned to slot boundaries. */
export class TimeSlot {
  private constructor(
    readonly start: Date,
    readonly end: Date,
  ) {}

  static create(start: Date, end: Date): TimeSlot {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
      throw new InvalidTimeSlotError();
    }
    if (!isAligned(start) || !isAligned(end)) throw new SlotNotAlignedError();
    const slot = new TimeSlot(new Date(start), new Date(end));
    if (
      slot.durationMinutes < MIN_DURATION_MINUTES ||
      slot.durationMinutes > MAX_DURATION_MINUTES
    ) {
      throw new InvalidDurationError();
    }
    return slot;
  }

  get durationMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / MILLIS_PER_MINUTE;
  }

  /** Back-to-back slots do not overlap. */
  overlaps(other: TimeSlot): boolean {
    return this.start < other.end && other.start < this.end;
  }
}

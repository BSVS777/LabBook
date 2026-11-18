import { DomainError, ERROR_CODES } from '../../../shared/domain/domain-error.js';
import {
  MAX_ADVANCE_DAYS,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  MIN_LEAD_TIME_MINUTES,
  SLOT_MINUTES,
} from './reservation-rules.js';

export class InvalidTimeSlotError extends DomainError {
  constructor() {
    super(ERROR_CODES.INVALID_TIME_SLOT, 'The reservation must end after it starts');
  }
}

export class SlotNotAlignedError extends DomainError {
  constructor() {
    super(
      ERROR_CODES.SLOT_NOT_ALIGNED,
      `Reservations must start and end on ${String(SLOT_MINUTES)}-minute boundaries`,
    );
  }
}

export class InvalidDurationError extends DomainError {
  constructor() {
    super(
      ERROR_CODES.INVALID_DURATION,
      `Reservations last between ${String(MIN_DURATION_MINUTES)} and ${String(MAX_DURATION_MINUTES)} minutes`,
    );
  }
}

export class OutsideOpeningHoursError extends DomainError {
  constructor() {
    super(ERROR_CODES.OUTSIDE_OPENING_HOURS, 'The reservation must fit within opening hours');
  }
}

export class ClosedDayError extends DomainError {
  constructor() {
    super(ERROR_CODES.CLOSED_DAY, 'Labs are closed on the requested day');
  }
}

export class InsufficientLeadTimeError extends DomainError {
  constructor() {
    super(
      ERROR_CODES.INSUFFICIENT_LEAD_TIME,
      `Reservations must be made at least ${String(MIN_LEAD_TIME_MINUTES)} minutes in advance`,
    );
  }
}

export class PastDateError extends DomainError {
  constructor() {
    super(ERROR_CODES.PAST_DATE, 'The reservation cannot start in the past');
  }
}

export class TooFarInAdvanceError extends DomainError {
  constructor() {
    super(
      ERROR_CODES.TOO_FAR_IN_ADVANCE,
      `Reservations can be made at most ${String(MAX_ADVANCE_DAYS)} days in advance`,
    );
  }
}

export class ReservationOverlapError extends DomainError {
  constructor() {
    super(ERROR_CODES.RESERVATION_OVERLAP, 'The lab is already reserved during that time');
  }
}

export class ReservationNotFoundError extends DomainError {
  constructor() {
    super(ERROR_CODES.RESERVATION_NOT_FOUND, 'The reservation does not exist');
  }
}

export class ReservationAlreadyCancelledError extends DomainError {
  constructor() {
    super(ERROR_CODES.RESERVATION_ALREADY_CANCELLED, 'The reservation is already cancelled');
  }
}

export class ReservationAlreadyStartedError extends DomainError {
  constructor() {
    super(
      ERROR_CODES.RESERVATION_ALREADY_STARTED,
      'A reservation that has started cannot be cancelled',
    );
  }
}

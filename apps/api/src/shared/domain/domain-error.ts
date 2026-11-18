export const ERROR_CODES = {
  INVALID_TIME_SLOT: 'INVALID_TIME_SLOT',
  SLOT_NOT_ALIGNED: 'SLOT_NOT_ALIGNED',
  INVALID_DURATION: 'INVALID_DURATION',
  OUTSIDE_OPENING_HOURS: 'OUTSIDE_OPENING_HOURS',
  CLOSED_DAY: 'CLOSED_DAY',
  INSUFFICIENT_LEAD_TIME: 'INSUFFICIENT_LEAD_TIME',
  PAST_DATE: 'PAST_DATE',
  TOO_FAR_IN_ADVANCE: 'TOO_FAR_IN_ADVANCE',
  RESERVATION_OVERLAP: 'RESERVATION_OVERLAP',
  LAB_NOT_FOUND: 'LAB_NOT_FOUND',
  LAB_INACTIVE: 'LAB_INACTIVE',
  RESERVATION_NOT_FOUND: 'RESERVATION_NOT_FOUND',
  RESERVATION_ALREADY_CANCELLED: 'RESERVATION_ALREADY_CANCELLED',
  RESERVATION_ALREADY_STARTED: 'RESERVATION_ALREADY_STARTED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
} as const;

export type DomainErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Base class of every business-rule violation. The `code` is stable and is what
 * the HTTP layer maps to a status and a user-facing message.
 */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'The user is not allowed to perform this action') {
    super(ERROR_CODES.FORBIDDEN, message);
  }
}

/**
 * Client-facing copies of the reservation rules, used for UI hints only.
 * The API domain (`reservation-rules.ts`) is authoritative and enforces them.
 */
export const SLOT_MINUTES = 30;
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 120;
export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 21;
/** Weekday numbers as in Date.getDay: 0 is Sunday. */
export const WEEKDAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;
export const OPEN_WEEKDAYS = [
  WEEKDAYS.MONDAY,
  WEEKDAYS.TUESDAY,
  WEEKDAYS.WEDNESDAY,
  WEEKDAYS.THURSDAY,
  WEEKDAYS.FRIDAY,
  WEEKDAYS.SATURDAY,
] as const;
export const MIN_LEAD_TIME_MINUTES = 60;
export const MAX_ADVANCE_DAYS = 14;
export const DEFAULT_BUSINESS_TIME_ZONE = 'America/Bogota';

import { Weekday } from '../../../shared/domain/business-calendar.js';

/** Single source of truth for every reservation business rule. */
export const DEFAULT_BUSINESS_TIME_ZONE = 'America/Bogota';

export const SLOT_MINUTES = 30;
export const MIN_DURATION_MINUTES = 30;
export const MAX_DURATION_MINUTES = 120;

export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 21;
export const OPEN_WEEKDAYS: readonly Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export const MIN_LEAD_TIME_MINUTES = 60;
export const MAX_ADVANCE_DAYS = 14;

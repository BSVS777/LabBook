import { z } from 'zod';

export const ERROR_CODES = [
  'INVALID_TIME_SLOT',
  'SLOT_NOT_ALIGNED',
  'INVALID_DURATION',
  'OUTSIDE_OPENING_HOURS',
  'CLOSED_DAY',
  'INSUFFICIENT_LEAD_TIME',
  'PAST_DATE',
  'TOO_FAR_IN_ADVANCE',
  'RESERVATION_OVERLAP',
  'LAB_NOT_FOUND',
  'LAB_INACTIVE',
  'RESERVATION_NOT_FOUND',
  'RESERVATION_ALREADY_CANCELLED',
  'RESERVATION_ALREADY_STARTED',
  'FORBIDDEN',
  'INVALID_CREDENTIALS',
  'EMAIL_ALREADY_REGISTERED',
  'UNAUTHENTICATED',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
  }),
});

export type ErrorCode = z.infer<typeof errorCodeSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;

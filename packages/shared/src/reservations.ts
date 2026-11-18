import { z } from 'zod';

/** UTC instant as ISO-8601, e.g. `2026-03-02T15:00:00.000Z`. */
const instantSchema = z.iso.datetime();

export const reservationStatusSchema = z.enum(['active', 'cancelled']);
export const availabilityStatusSchema = z.enum(['free', 'taken', 'past']);

export const createReservationBodySchema = z.object({
  labId: z.string().min(1),
  start: instantSchema,
  end: instantSchema,
});

export const reservationDtoSchema = z.object({
  id: z.string(),
  labId: z.string(),
  userId: z.string(),
  start: instantSchema,
  end: instantSchema,
  status: reservationStatusSchema,
  createdAt: instantSchema,
});

export const reservationListResponseSchema = z.object({
  reservations: z.array(reservationDtoSchema),
});

/** Local calendar date in the business time zone, `YYYY-MM-DD`. */
export const availabilityQuerySchema = z.object({ date: z.iso.date() });

export const availabilitySlotSchema = z.object({
  start: instantSchema,
  end: instantSchema,
  status: availabilityStatusSchema,
});

export const availabilityResponseSchema = z.object({
  labId: z.string(),
  date: z.iso.date(),
  isOpen: z.boolean(),
  slots: z.array(availabilitySlotSchema),
});

export type ReservationStatus = z.infer<typeof reservationStatusSchema>;
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;
export type CreateReservationBody = z.infer<typeof createReservationBodySchema>;
export type ReservationDto = z.infer<typeof reservationDtoSchema>;
export type ReservationListResponse = z.infer<typeof reservationListResponseSchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>;
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;

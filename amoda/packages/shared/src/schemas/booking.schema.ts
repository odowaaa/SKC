import { z } from "zod";

export const createBookingSchema = z.object({
  propertyId: z.string().cuid(),
  scheduledAt: z.coerce.date(),
  note: z.string().max(1000).optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const rescheduleBookingSchema = z.object({
  scheduledAt: z.coerce.date(),
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

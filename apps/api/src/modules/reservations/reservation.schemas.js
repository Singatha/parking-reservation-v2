import { z } from "zod";

const id = z.coerce.number().int().positive();

export const createReservationSchema = z.object({
  body: z.object({
    parkingSpaceId: id,
    vehicleId: id,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date()
  }).refine((value) => value.endsAt > value.startsAt, {
    message: "End time must be after start time",
    path: ["endsAt"]
  }),
  params: z.object({}),
  query: z.object({})
});

export const reservationIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id }),
  query: z.object({})
});

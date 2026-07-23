import { z } from "zod";

const id = z.coerce.number().int().positive();

export const createVehicleSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    licensePlate: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase())
  }),
  params: z.object({}),
  query: z.object({})
});

export const vehicleIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id }),
  query: z.object({})
});

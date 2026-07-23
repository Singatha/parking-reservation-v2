import { z } from "zod";

export const listSpacesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    building: z.string().trim().optional(),
    type: z.enum(["standard", "accessible", "motorcycle", "ev", "oversized"]).optional()
  })
});

export const createSpaceSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1).max(40),
    type: z.enum(["standard", "accessible", "motorcycle", "ev", "oversized"]).default("standard"),
    buildingName: z.string().trim().min(1).max(160),
    address: z.string().trim().min(1).max(500),
    hourlyPrice: z.coerce.number().positive().max(100000)
  }),
  params: z.object({}),
  query: z.object({})
});

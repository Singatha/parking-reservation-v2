import { z } from "zod";

const id = z.coerce.number().int().positive();
const spaceBody = z.object({
  code: z.string().trim().min(1).max(40),
  type: z.enum(["standard", "accessible", "motorcycle", "ev", "oversized"]).default("standard"),
  buildingName: z.string().trim().min(1).max(160),
  address: z.string().trim().min(1).max(500),
  hourlyPrice: z.coerce.number().positive().max(100000)
});

export const listSpacesSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}),
  query: z.object({
    building: z.string().trim().optional(),
    type: z.enum(["standard", "accessible", "motorcycle", "ev", "oversized"]).optional(),
    includeInactive: z.enum(["true", "false"]).default("false").transform((value) => value === "true")
  })
});

export const createSpaceSchema = z.object({
  body: spaceBody,
  params: z.object({}),
  query: z.object({})
});

export const updateSpaceSchema = z.object({
  body: spaceBody,
  params: z.object({ id }),
  query: z.object({})
});

export const spaceStatusSchema = z.object({
  body: z.object({ active: z.boolean() }),
  params: z.object({ id }),
  query: z.object({})
});

export const spaceIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id }),
  query: z.object({})
});

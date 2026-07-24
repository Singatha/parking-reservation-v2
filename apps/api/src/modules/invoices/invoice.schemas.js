import { z } from "zod";

export const invoiceIdSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() }),
  query: z.object({})
});

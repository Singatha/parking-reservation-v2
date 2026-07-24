import { z } from "zod";

export const mockPaymentSchema = z.object({
  body: z.object({
    reservationId: z.coerce.number().int().positive(),
    outcome: z.enum(["approved", "declined"]),
    idempotencyKey: z.string().uuid()
  }),
  params: z.object({}),
  query: z.object({})
});

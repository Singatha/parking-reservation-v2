import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { mockPaymentSchema } from "./payment.schemas.js";
import { processMockPayment } from "./payment.service.js";

export const paymentRouter = Router();

paymentRouter.post("/mock", validate(mockPaymentSchema), async (req, res) => {
  const payment = await processMockPayment(req.user.id, req.validated.body);
  res.status(payment.status === "succeeded" ? 201 : 200).json({ data: payment });
});

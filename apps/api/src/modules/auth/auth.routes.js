import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { loginUser, registerUser } from "./auth.service.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res) => {
  const user = await registerUser(req.validated.body);
  res.status(201).json({ data: user });
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const session = await loginUser(req.validated.body);
  res.json({ data: session });
});

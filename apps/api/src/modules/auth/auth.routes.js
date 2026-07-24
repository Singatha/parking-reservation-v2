import { Router } from "express";
import { clearSessionCookies, parseCookies, SESSION_COOKIE, setSessionCookies } from "../../lib/cookies.js";
import { authenticate } from "../../middleware/auth.js";
import { protectCsrf } from "../../middleware/csrf.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { loginUser, registerUser } from "./auth.service.js";
import { createSession, revokeSession } from "./session.service.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res) => {
  const user = await registerUser(req.validated.body);
  res.status(201).json({ data: user });
});

authRouter.post("/login", validate(loginSchema), async (req, res) => {
  const result = await loginUser(req.validated.body);
  const session = await createSession(result.user.id);
  setSessionCookies(res, session);
  res.json({ data: { user: result.user } });
});

authRouter.get("/session", authenticate, (req, res) => {
  res.json({ data: { user: req.user } });
});

authRouter.post("/logout", authenticate, protectCsrf, async (req, res) => {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  await revokeSession(token);
  clearSessionCookies(res);
  res.status(204).end();
});

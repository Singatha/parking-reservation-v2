import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import pino from "pino";
import pinoHttp from "pino-http";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authenticate } from "./middleware/auth.js";
import { protectCsrf } from "./middleware/csrf.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { reservationRouter } from "./modules/reservations/reservation.routes.js";
import { spaceRouter } from "./modules/spaces/space.routes.js";
import { vehicleRouter } from "./modules/vehicles/vehicle.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(pinoHttp({
  logger: pino({
    level: config.NODE_ENV === "test" ? "silent" : "info",
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers.set-cookie"
    ]
  })
}));
app.use(helmet());
app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
app.use(express.json({ limit: "32kb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many authentication attempts; try again later" } }
}), authRouter);
app.use("/api/v1/vehicles", authenticate, protectCsrf, vehicleRouter);
app.use("/api/v1/spaces", authenticate, protectCsrf, spaceRouter);
app.use("/api/v1/reservations", authenticate, protectCsrf, reservationRouter);

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});
app.use(errorHandler);

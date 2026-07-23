import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { AppError } from "../lib/errors.js";

export function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return next(new AppError(401, "UNAUTHENTICATED", "A valid bearer token is required"));
  }

  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] });
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    next(new AppError(401, "UNAUTHENTICATED", "The access token is invalid or expired"));
  }
}

export function requireRole(role) {
  return (req, _res, next) => {
    if (req.user.role !== role) {
      return next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action"));
    }
    next();
  };
}

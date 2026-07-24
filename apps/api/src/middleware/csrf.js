import crypto from "node:crypto";
import { CSRF_COOKIE, parseCookies } from "../lib/cookies.js";
import { AppError } from "../lib/errors.js";
import { hashToken } from "../modules/auth/session.service.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function protectCsrf(req, _res, next) {
  if (safeMethods.has(req.method)) return next();

  const cookieToken = parseCookies(req.headers.cookie)[CSRF_COOKIE];
  const headerToken = req.headers["x-csrf-token"];
  if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length) {
    return next(new AppError(403, "INVALID_CSRF_TOKEN", "The CSRF token is missing or invalid"));
  }

  const tokensMatch = crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
  const storedHash = req.session?.csrfTokenHash;
  const storedTokenMatches = storedHash &&
    crypto.timingSafeEqual(Buffer.from(hashToken(headerToken)), Buffer.from(storedHash));

  if (!tokensMatch || !storedTokenMatches) {
    return next(new AppError(403, "INVALID_CSRF_TOKEN", "The CSRF token is missing or invalid"));
  }
  next();
}

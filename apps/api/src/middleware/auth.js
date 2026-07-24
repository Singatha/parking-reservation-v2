import { pool } from "../database/pool.js";
import { parseCookies, SESSION_COOKIE } from "../lib/cookies.js";
import { AppError } from "../lib/errors.js";
import { hashToken } from "../modules/auth/session.service.js";

export async function authenticate(req, _res, next) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) {
    return next(new AppError(401, "UNAUTHENTICATED", "An authenticated session is required"));
  }

  try {
    const [rows] = await pool.execute(
      `SELECT s.id AS session_id, s.csrf_token_hash, u.id, u.email, u.username,
              u.first_name, u.last_name, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > NOW()
       LIMIT 1`,
      [hashToken(token)]
    );
    const session = rows[0];
    if (!session) {
      return next(new AppError(401, "UNAUTHENTICATED", "The session is invalid or expired"));
    }
    req.session = {
      id: session.session_id,
      token,
      csrfTokenHash: session.csrf_token_hash
    };
    req.user = {
      id: session.id,
      email: session.email,
      username: session.username,
      firstName: session.first_name,
      lastName: session.last_name,
      role: session.role
    };
    next();
  } catch (error) {
    next(error);
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

import crypto from "node:crypto";
import { config } from "../../config.js";
import { pool } from "../../database/pool.js";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await pool.execute(
    `INSERT INTO sessions (user_id, token_hash, csrf_token_hash, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, hashToken(token), hashToken(csrfToken), expiresAt]
  );

  return { token, csrfToken, expiresAt };
}

export async function revokeSession(token) {
  if (!token) return;
  await pool.execute("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
}

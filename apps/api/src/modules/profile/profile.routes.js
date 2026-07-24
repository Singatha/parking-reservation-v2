import bcrypt from "bcryptjs";
import { Router } from "express";
import { pool } from "../../database/pool.js";
import { AppError } from "../../lib/errors.js";
import { validate } from "../../middleware/validate.js";
import { changePasswordSchema, updateProfileSchema } from "./profile.schemas.js";

export const profileRouter = Router();

profileRouter.get("/", (req, res) => {
  res.json({ data: { user: req.user } });
});

profileRouter.put("/", validate(updateProfileSchema), async (req, res) => {
  const { username, firstName, lastName } = req.validated.body;
  try {
    await pool.execute(
      `UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE id = ?`,
      [username, firstName, lastName, req.user.id]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "USERNAME_EXISTS", "That username is already in use");
    }
    throw error;
  }
  res.json({
    data: {
      user: {
        ...req.user,
        username,
        firstName,
        lastName
      }
    }
  });
});

profileRouter.post("/password", validate(changePasswordSchema), async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT password_hash FROM users WHERE id = ?",
    [req.user.id]
  );
  const valid = await bcrypt.compare(
    req.validated.body.currentPassword,
    rows[0].password_hash
  );
  if (!valid) {
    throw new AppError(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(req.validated.body.newPassword, 12);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, req.user.id]
    );
    await connection.execute(
      "DELETE FROM sessions WHERE user_id = ? AND id <> ?",
      [req.user.id, req.session.id]
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.status(204).end();
});

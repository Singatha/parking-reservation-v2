import bcrypt from "bcryptjs";
import { pool } from "../../database/pool.js";
import { AppError } from "../../lib/errors.js";

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (email, username, password_hash, first_name, last_name)
       VALUES (?, ?, ?, ?, ?)`,
      [input.email, input.username, passwordHash, input.firstName, input.lastName]
    );
    return { id: result.insertId, email: input.email, username: input.username };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "ACCOUNT_EXISTS", "An account with that email or username already exists");
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const [rows] = await pool.execute(
    `SELECT id, email, username, password_hash, first_name, last_name, role
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  const user = rows[0];
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  };
}

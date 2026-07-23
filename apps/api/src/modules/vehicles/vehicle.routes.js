import { Router } from "express";
import { pool } from "../../database/pool.js";
import { AppError, notFound } from "../../lib/errors.js";
import { validate } from "../../middleware/validate.js";
import { createVehicleSchema, vehicleIdSchema } from "./vehicle.schemas.js";

export const vehicleRouter = Router();

vehicleRouter.get("/", async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, name, license_plate AS licensePlate, created_at AS createdAt
     FROM vehicles WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

vehicleRouter.post("/", validate(createVehicleSchema), async (req, res) => {
  const { name, licensePlate } = req.validated.body;
  try {
    const [result] = await pool.execute(
      "INSERT INTO vehicles (user_id, name, license_plate) VALUES (?, ?, ?)",
      [req.user.id, name, licensePlate]
    );
    res.status(201).json({ data: { id: result.insertId, name, licensePlate } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "PLATE_EXISTS", "That license plate is already registered");
    }
    throw error;
  }
});

vehicleRouter.delete("/:id", validate(vehicleIdSchema), async (req, res) => {
  const [result] = await pool.execute(
    "DELETE FROM vehicles WHERE id = ? AND user_id = ?",
    [req.validated.params.id, req.user.id]
  );
  if (!result.affectedRows) throw notFound("Vehicle not found");
  res.status(204).end();
});

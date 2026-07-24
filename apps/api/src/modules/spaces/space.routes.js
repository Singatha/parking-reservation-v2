import { Router } from "express";
import { pool } from "../../database/pool.js";
import { AppError } from "../../lib/errors.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  createSpaceSchema,
  listSpacesSchema,
  spaceIdSchema,
  spaceStatusSchema,
  updateSpaceSchema
} from "./space.schemas.js";

export const spaceRouter = Router();

spaceRouter.get("/", validate(listSpacesSchema), async (req, res) => {
  const { building, type, includeInactive } = req.validated.query;
  const clauses = [];
  const values = [];
  if (!includeInactive || req.user.role !== "admin") {
    clauses.push("active = TRUE");
  }
  if (building) {
    clauses.push("building_name LIKE ?");
    values.push(`%${building}%`);
  }
  if (type) {
    clauses.push("type = ?");
    values.push(type);
  }
  const [rows] = await pool.execute(
    `SELECT id, code, type, building_name AS buildingName, address,
            hourly_price AS hourlyPrice, active
     FROM parking_spaces${clauses.length ? ` WHERE ${clauses.join(" AND ")}` : ""}
     ORDER BY building_name, code`,
    values
  );
  res.json({ data: rows });
});

spaceRouter.put("/:id", requireRole("admin"), validate(updateSpaceSchema), async (req, res) => {
  const { code, type, buildingName, address, hourlyPrice } = req.validated.body;
  try {
    const [result] = await pool.execute(
      `UPDATE parking_spaces
       SET code = ?, type = ?, building_name = ?, address = ?, hourly_price = ?
       WHERE id = ?`,
      [code, type, buildingName, address, hourlyPrice, req.validated.params.id]
    );
    if (!result.affectedRows) {
      throw new AppError(404, "NOT_FOUND", "Parking space not found");
    }
    res.json({ data: { id: req.validated.params.id, ...req.validated.body } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "SPACE_EXISTS", "A parking space with that code already exists");
    }
    throw error;
  }
});

spaceRouter.patch("/:id/status", requireRole("admin"), validate(spaceStatusSchema), async (req, res) => {
  const [result] = await pool.execute(
    "UPDATE parking_spaces SET active = ? WHERE id = ?",
    [req.validated.body.active, req.validated.params.id]
  );
  if (!result.affectedRows) {
    throw new AppError(404, "NOT_FOUND", "Parking space not found");
  }
  res.json({
    data: { id: req.validated.params.id, active: req.validated.body.active }
  });
});

spaceRouter.delete("/:id", requireRole("admin"), validate(spaceIdSchema), async (req, res) => {
  try {
    const [result] = await pool.execute(
      "DELETE FROM parking_spaces WHERE id = ?",
      [req.validated.params.id]
    );
    if (!result.affectedRows) {
      throw new AppError(404, "NOT_FOUND", "Parking space not found");
    }
    res.status(204).end();
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      throw new AppError(
        409,
        "SPACE_HAS_RESERVATIONS",
        "Deactivate this space instead because it has reservation history"
      );
    }
    throw error;
  }
});

spaceRouter.post("/", requireRole("admin"), validate(createSpaceSchema), async (req, res) => {
  const { code, type, buildingName, address, hourlyPrice } = req.validated.body;
  try {
    const [result] = await pool.execute(
      `INSERT INTO parking_spaces (code, type, building_name, address, hourly_price)
       VALUES (?, ?, ?, ?, ?)`,
      [code, type, buildingName, address, hourlyPrice]
    );
    res.status(201).json({ data: { id: result.insertId, ...req.validated.body } });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError(409, "SPACE_EXISTS", "A parking space with that code already exists");
    }
    throw error;
  }
});

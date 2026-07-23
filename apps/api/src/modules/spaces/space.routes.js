import { Router } from "express";
import { pool } from "../../database/pool.js";
import { AppError } from "../../lib/errors.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { createSpaceSchema, listSpacesSchema } from "./space.schemas.js";

export const spaceRouter = Router();

spaceRouter.get("/", validate(listSpacesSchema), async (req, res) => {
  const { building, type } = req.validated.query;
  const clauses = ["active = TRUE"];
  const values = [];
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
            hourly_price AS hourlyPrice
     FROM parking_spaces WHERE ${clauses.join(" AND ")} ORDER BY building_name, code`,
    values
  );
  res.json({ data: rows });
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

import { Router } from "express";
import { pool } from "../../database/pool.js";
import { notFound } from "../../lib/errors.js";
import { validate } from "../../middleware/validate.js";
import { createReservationSchema, reservationIdSchema } from "./reservation.schemas.js";
import { createReservation } from "./reservation.service.js";

export const reservationRouter = Router();

reservationRouter.get("/", async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT r.id, r.starts_at AS startsAt, r.ends_at AS endsAt, r.status,
            r.total_price AS totalPrice, s.code AS spaceCode,
            s.building_name AS buildingName, v.name AS vehicleName,
            v.license_plate AS licensePlate
     FROM reservations r
     JOIN parking_spaces s ON s.id = r.parking_space_id
     JOIN vehicles v ON v.id = r.vehicle_id
     WHERE r.user_id = ? ORDER BY r.starts_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

reservationRouter.post("/", validate(createReservationSchema), async (req, res) => {
  const reservation = await createReservation(req.user.id, req.validated.body);
  res.status(201).json({ data: reservation });
});

reservationRouter.post("/:id/cancel", validate(reservationIdSchema), async (req, res) => {
  const [result] = await pool.execute(
    `UPDATE reservations SET status = 'cancelled'
     WHERE id = ? AND user_id = ? AND status = 'confirmed'`,
    [req.validated.params.id, req.user.id]
  );
  if (!result.affectedRows) throw notFound("Active reservation not found");
  res.json({ data: { id: req.validated.params.id, status: "cancelled" } });
});

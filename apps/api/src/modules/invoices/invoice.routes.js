import { Router } from "express";
import { pool } from "../../database/pool.js";
import { notFound } from "../../lib/errors.js";
import { validate } from "../../middleware/validate.js";
import { invoiceIdSchema } from "./invoice.schemas.js";

const selectInvoice = `
  SELECT id, invoice_number AS invoiceNumber, reservation_id AS reservationId,
         customer_name AS customerName, customer_email AS customerEmail,
         vehicle_name AS vehicleName, license_plate AS licensePlate,
         space_code AS spaceCode, building_name AS buildingName,
         starts_at AS startsAt, ends_at AS endsAt, subtotal,
         tax_rate AS taxRate, tax_amount AS taxAmount, total, currency,
         issued_at AS issuedAt
  FROM invoices
`;

export const invoiceRouter = Router();

invoiceRouter.get("/", async (req, res) => {
  const [rows] = await pool.execute(
    `${selectInvoice} WHERE user_id = ? ORDER BY issued_at DESC`,
    [req.user.id]
  );
  res.json({ data: rows });
});

invoiceRouter.get("/:id", validate(invoiceIdSchema), async (req, res) => {
  const [rows] = await pool.execute(
    `${selectInvoice} WHERE id = ? AND user_id = ? LIMIT 1`,
    [req.validated.params.id, req.user.id]
  );
  if (!rows.length) throw notFound("Invoice not found");
  res.json({ data: rows[0] });
});

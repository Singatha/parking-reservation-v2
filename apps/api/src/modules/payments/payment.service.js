import { config } from "../../config.js";
import { pool } from "../../database/pool.js";
import { AppError, notFound } from "../../lib/errors.js";

function paymentResult(payment, invoiceId = null) {
  return {
    id: payment.id,
    reservationId: payment.reservation_id,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    failureReason: payment.failure_reason,
    invoiceId
  };
}

export async function processMockPayment(userId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [reservations] = await connection.execute(
      `SELECT r.*, u.email, u.first_name, u.last_name,
              v.name AS vehicle_name, v.license_plate,
              s.code AS space_code, s.building_name
       FROM reservations r
       JOIN users u ON u.id = r.user_id
       JOIN vehicles v ON v.id = r.vehicle_id
       JOIN parking_spaces s ON s.id = r.parking_space_id
       WHERE r.id = ? AND r.user_id = ?
       LIMIT 1 FOR UPDATE`,
      [input.reservationId, userId]
    );
    const reservation = reservations[0];
    if (!reservation) throw notFound("Reservation not found");

    const [existingPayments] = await connection.execute(
      `SELECT p.*, i.id AS invoice_id
       FROM payments p
       LEFT JOIN invoices i ON i.payment_id = p.id
       WHERE p.idempotency_key = ? LIMIT 1`,
      [input.idempotencyKey]
    );
    if (existingPayments.length) {
      const existing = existingPayments[0];
      if (existing.user_id !== userId || existing.reservation_id !== input.reservationId) {
        throw new AppError(409, "IDEMPOTENCY_CONFLICT", "That payment key is already in use");
      }
      await connection.commit();
      return paymentResult(existing, existing.invoice_id);
    }

    if (reservation.status !== "pending_payment") {
      throw new AppError(409, "RESERVATION_NOT_PAYABLE", "This reservation is not awaiting payment");
    }
    if (reservation.payment_expires_at < new Date()) {
      await connection.execute(
        "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
        [reservation.id]
      );
      await connection.commit();
      throw new AppError(409, "PAYMENT_EXPIRED", "The payment window has expired");
    }

    const approved = input.outcome === "approved";
    const subtotal = reservation.total_price;
    const taxAmount = Number((subtotal * config.INVOICE_TAX_RATE).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));
    const [paymentInsert] = await connection.execute(
      `INSERT INTO payments
       (reservation_id, user_id, idempotency_key, status, amount, currency, failure_reason, paid_at)
       VALUES (?, ?, ?, ?, ?, 'ZAR', ?, ?)`,
      [
        reservation.id,
        userId,
        input.idempotencyKey,
        approved ? "succeeded" : "failed",
        total,
        approved ? null : "Mock payment was declined",
        approved ? new Date() : null
      ]
    );

    if (!approved) {
      await connection.execute(
        "UPDATE reservations SET status = 'cancelled' WHERE id = ?",
        [reservation.id]
      );
      await connection.commit();
      return {
        id: paymentInsert.insertId,
        reservationId: reservation.id,
        status: "failed",
        amount: total,
        currency: "ZAR",
        failureReason: "Mock payment was declined",
        invoiceId: null
      };
    }

    await connection.execute(
      "UPDATE reservations SET status = 'confirmed' WHERE id = ?",
      [reservation.id]
    );
    const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${String(paymentInsert.insertId).padStart(6, "0")}`;
    const [invoiceInsert] = await connection.execute(
      `INSERT INTO invoices
       (invoice_number, reservation_id, payment_id, user_id, customer_name,
        customer_email, vehicle_name, license_plate, space_code, building_name,
        starts_at, ends_at, subtotal, tax_rate, tax_amount, total, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ZAR')`,
      [
        invoiceNumber,
        reservation.id,
        paymentInsert.insertId,
        userId,
        `${reservation.first_name} ${reservation.last_name}`,
        reservation.email,
        reservation.vehicle_name,
        reservation.license_plate,
        reservation.space_code,
        reservation.building_name,
        reservation.starts_at,
        reservation.ends_at,
        subtotal,
        config.INVOICE_TAX_RATE,
        taxAmount,
        total
      ]
    );
    await connection.commit();
    return {
      id: paymentInsert.insertId,
      reservationId: reservation.id,
      status: "succeeded",
      amount: total,
      currency: "ZAR",
      failureReason: null,
      invoiceId: invoiceInsert.insertId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

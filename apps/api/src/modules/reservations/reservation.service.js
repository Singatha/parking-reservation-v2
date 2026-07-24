import { pool } from "../../database/pool.js";
import { AppError, notFound } from "../../lib/errors.js";

export async function createReservation(userId, input) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [vehicles] = await connection.execute(
      "SELECT id FROM vehicles WHERE id = ? AND user_id = ?",
      [input.vehicleId, userId]
    );
    if (!vehicles.length) throw notFound("Vehicle not found");

    const [spaces] = await connection.execute(
      "SELECT id, hourly_price FROM parking_spaces WHERE id = ? AND active = TRUE FOR UPDATE",
      [input.parkingSpaceId]
    );
    if (!spaces.length) throw notFound("Parking space not found");

    const [conflicts] = await connection.execute(
      `SELECT id FROM reservations
       WHERE parking_space_id = ?
         AND (
           status = 'confirmed'
           OR (status = 'pending_payment' AND payment_expires_at > NOW())
         )
         AND starts_at < ? AND ends_at > ?
       LIMIT 1 FOR UPDATE`,
      [input.parkingSpaceId, input.endsAt, input.startsAt]
    );
    if (conflicts.length) {
      throw new AppError(409, "SPACE_UNAVAILABLE", "The parking space is unavailable for that time");
    }

    const hours = Math.ceil((input.endsAt.getTime() - input.startsAt.getTime()) / 3_600_000);
    const totalPrice = hours * spaces[0].hourly_price;
    const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const [result] = await connection.execute(
      `INSERT INTO reservations
       (parking_space_id, user_id, vehicle_id, starts_at, ends_at, payment_expires_at,
        status, total_price)
       VALUES (?, ?, ?, ?, ?, ?, 'pending_payment', ?)`,
      [
        input.parkingSpaceId,
        userId,
        input.vehicleId,
        input.startsAt,
        input.endsAt,
        paymentExpiresAt,
        totalPrice
      ]
    );
    await connection.commit();
    return {
      id: result.insertId,
      status: "pending_payment",
      totalPrice,
      paymentExpiresAt
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

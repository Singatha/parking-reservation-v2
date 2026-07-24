import { describe, expect, it } from "vitest";
import { registerSchema } from "../src/modules/auth/auth.schemas.js";
import { createReservationSchema } from "../src/modules/reservations/reservation.schemas.js";
import { mockPaymentSchema } from "../src/modules/payments/payment.schemas.js";
import { changePasswordSchema } from "../src/modules/profile/profile.schemas.js";

describe("request validation", () => {
  it("normalizes a valid registration email", () => {
    const result = registerSchema.parse({
      body: {
        email: "USER@Example.COM",
        username: "driver",
        password: "long-password",
        firstName: "Test",
        lastName: "Driver"
      },
      params: {},
      query: {}
    });
    expect(result.body.email).toBe("user@example.com");
  });

  it("rejects a reservation ending before it starts", () => {
    const result = createReservationSchema.safeParse({
      body: {
        parkingSpaceId: 1,
        vehicleId: 1,
        startsAt: "2026-01-01T12:00:00Z",
        endsAt: "2026-01-01T11:00:00Z"
      },
      params: {},
      query: {}
    });
    expect(result.success).toBe(false);
  });

  it("accepts only explicit mock payment outcomes and UUID idempotency keys", () => {
    const result = mockPaymentSchema.safeParse({
      body: {
        reservationId: 1,
        outcome: "approved",
        idempotencyKey: "e65f27d5-c5d8-49e0-b72c-d77e16b84105"
      },
      params: {},
      query: {}
    });
    expect(result.success).toBe(true);
  });

  it("rejects reusing the current password as the new password", () => {
    const result = changePasswordSchema.safeParse({
      body: {
        currentPassword: "same-password",
        newPassword: "same-password"
      },
      params: {},
      query: {}
    });
    expect(result.success).toBe(false);
  });
});

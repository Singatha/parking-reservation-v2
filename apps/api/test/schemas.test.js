import { describe, expect, it } from "vitest";
import { registerSchema } from "../src/modules/auth/auth.schemas.js";
import { createReservationSchema } from "../src/modules/reservations/reservation.schemas.js";

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
});

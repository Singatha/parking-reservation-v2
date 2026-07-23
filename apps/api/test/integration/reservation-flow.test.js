import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { app } from "../../src/app.js";
import { pool } from "../../src/database/pool.js";

const customer = {
  email: "driver@example.com",
  username: "test-driver",
  password: "correct-horse-battery-staple",
  firstName: "Test",
  lastName: "Driver"
};

const admin = {
  email: "admin@example.com",
  username: "test-admin",
  password: "another-secure-test-password",
  firstName: "Test",
  lastName: "Admin"
};

async function register(user) {
  return request(app).post("/api/v1/auth/register").send(user);
}

async function login(user) {
  return request(app)
    .post("/api/v1/auth/login")
    .send({ email: user.email, password: user.password });
}

describe("parking reservation workflow", () => {
  let customerToken;
  let adminToken;
  let vehicleId;
  let spaceId;
  let reservationId;

  afterAll(async () => {
    await pool.end();
  });

  it("registers and authenticates a customer", async () => {
    const registration = await register(customer);
    expect(registration.status).toBe(201);
    expect(registration.body.data).toMatchObject({
      email: customer.email,
      username: customer.username
    });
    expect(registration.body.data).not.toHaveProperty("passwordHash");

    const session = await login(customer);
    expect(session.status).toBe(200);
    expect(session.body.data.token).toEqual(expect.any(String));
    expect(session.body.data.user).toMatchObject({
      email: customer.email,
      role: "customer"
    });
    customerToken = session.body.data.token;
  });

  it("rejects invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: customer.email, password: "incorrect-password" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("creates a user-owned vehicle", async () => {
    const response = await request(app)
      .post("/api/v1/vehicles")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Blue hatchback", licensePlate: "CA 123-456" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: "Blue hatchback",
      licensePlate: "CA 123-456"
    });
    vehicleId = response.body.data.id;
  });

  it("prevents a customer from creating parking spaces", async () => {
    const response = await request(app)
      .post("/api/v1/spaces")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        code: "T-01",
        type: "standard",
        buildingName: "Test Parkade",
        address: "1 Test Street",
        hourlyPrice: 25
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("allows an administrator to create a parking space", async () => {
    expect((await register(admin)).status).toBe(201);
    await pool.execute("UPDATE users SET role = 'admin' WHERE email = ?", [admin.email]);

    const session = await login(admin);
    adminToken = session.body.data.token;

    const response = await request(app)
      .post("/api/v1/spaces")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "T-01",
        type: "standard",
        buildingName: "Test Parkade",
        address: "1 Test Street",
        hourlyPrice: 25
      });

    expect(response.status).toBe(201);
    expect(response.body.data.code).toBe("T-01");
    spaceId = response.body.data.id;
  });

  it("creates and lists a reservation", async () => {
    const response = await request(app)
      .post("/api/v1/reservations")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        parkingSpaceId: spaceId,
        vehicleId,
        startsAt: "2030-05-10T08:00:00.000Z",
        endsAt: "2030-05-10T10:00:00.000Z"
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      status: "confirmed",
      totalPrice: 50
    });
    reservationId = response.body.data.id;

    const list = await request(app)
      .get("/api/v1/reservations")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      id: reservationId,
      spaceCode: "T-01",
      licensePlate: "CA 123-456",
      status: "confirmed"
    });
  });

  it("rejects an overlapping reservation", async () => {
    const response = await request(app)
      .post("/api/v1/reservations")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        parkingSpaceId: spaceId,
        vehicleId,
        startsAt: "2030-05-10T09:00:00.000Z",
        endsAt: "2030-05-10T11:00:00.000Z"
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("SPACE_UNAVAILABLE");
  });

  it("cancels the reservation", async () => {
    const response = await request(app)
      .post(`/api/v1/reservations/${reservationId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      id: reservationId,
      status: "cancelled"
    });
  });
});

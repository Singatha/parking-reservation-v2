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

const customerAgent = request.agent(app);
const adminAgent = request.agent(app);

async function register(agent, user) {
  return agent.post("/api/v1/auth/register").send(user);
}

async function login(agent, user) {
  return agent
    .post("/api/v1/auth/login")
    .send({ email: user.email, password: user.password });
}

function csrfFrom(response) {
  const cookie = response.headers["set-cookie"]
    .find((value) => value.startsWith("parking_csrf="));
  return decodeURIComponent(cookie.split(";")[0].slice("parking_csrf=".length));
}

describe("parking reservation workflow", () => {
  let customerCsrf;
  let adminCsrf;
  let vehicleId;
  let spaceId;
  let reservationId;

  afterAll(async () => {
    await pool.end();
  });

  it("registers and authenticates a customer", async () => {
    const registration = await register(customerAgent, customer);
    expect(registration.status).toBe(201);
    expect(registration.body.data).toMatchObject({
      email: customer.email,
      username: customer.username
    });
    expect(registration.body.data).not.toHaveProperty("passwordHash");

    const session = await login(customerAgent, customer);
    expect(session.status).toBe(200);
    expect(session.body.data.user).toMatchObject({
      email: customer.email,
      role: "customer"
    });
    expect(session.headers["set-cookie"]).toEqual(expect.arrayContaining([
      expect.stringContaining("parking_session="),
      expect.stringContaining("HttpOnly"),
      expect.stringContaining("SameSite=Strict"),
      expect.stringContaining("parking_csrf=")
    ]));
    customerCsrf = csrfFrom(session);

    const restored = await customerAgent.get("/api/v1/auth/session");
    expect(restored.status).toBe(200);
    expect(restored.body.data.user.email).toBe(customer.email);
  });

  it("rejects invalid credentials", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: customer.email, password: "incorrect-password" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("creates a user-owned vehicle", async () => {
    const response = await customerAgent
      .post("/api/v1/vehicles")
      .set("X-CSRF-Token", customerCsrf)
      .send({ name: "Blue hatchback", licensePlate: "CA 123-456" });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      name: "Blue hatchback",
      licensePlate: "CA 123-456"
    });
    vehicleId = response.body.data.id;
  });

  it("prevents a customer from creating parking spaces", async () => {
    const response = await customerAgent
      .post("/api/v1/spaces")
      .set("X-CSRF-Token", customerCsrf)
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
    expect((await register(adminAgent, admin)).status).toBe(201);
    await pool.execute("UPDATE users SET role = 'admin' WHERE email = ?", [admin.email]);

    const session = await login(adminAgent, admin);
    adminCsrf = csrfFrom(session);

    const response = await adminAgent
      .post("/api/v1/spaces")
      .set("X-CSRF-Token", adminCsrf)
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
    const response = await customerAgent
      .post("/api/v1/reservations")
      .set("X-CSRF-Token", customerCsrf)
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

    const list = await customerAgent.get("/api/v1/reservations");

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
    const response = await customerAgent
      .post("/api/v1/reservations")
      .set("X-CSRF-Token", customerCsrf)
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
    const response = await customerAgent
      .post(`/api/v1/reservations/${reservationId}/cancel`)
      .set("X-CSRF-Token", customerCsrf);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      id: reservationId,
      status: "cancelled"
    });
  });

  it("rejects state changes without a CSRF token", async () => {
    const response = await customerAgent
      .post("/api/v1/vehicles")
      .send({ name: "Second car", licensePlate: "CA 999-999" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("revokes the server-side session on logout", async () => {
    const logout = await customerAgent
      .post("/api/v1/auth/logout")
      .set("X-CSRF-Token", customerCsrf);

    expect(logout.status).toBe(204);
    const restored = await customerAgent.get("/api/v1/auth/session");
    expect(restored.status).toBe(401);
  });
});

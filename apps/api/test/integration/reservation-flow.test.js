import { randomUUID } from "node:crypto";
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
  let invoiceId;
  const paymentKey = randomUUID();

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

  it("views and updates the customer profile", async () => {
    const profile = await customerAgent.get("/api/v1/profile");
    expect(profile.status).toBe(200);
    expect(profile.body.data.user.email).toBe(customer.email);

    const update = await customerAgent
      .put("/api/v1/profile")
      .set("X-CSRF-Token", customerCsrf)
      .send({
        username: "updated-driver",
        firstName: "Updated",
        lastName: "Driver"
      });
    expect(update.status).toBe(200);
    expect(update.body.data.user).toMatchObject({
      username: "updated-driver",
      firstName: "Updated",
      email: customer.email
    });
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

  it("allows an administrator to edit and deactivate a parking space", async () => {
    const update = await adminAgent
      .put(`/api/v1/spaces/${spaceId}`)
      .set("X-CSRF-Token", adminCsrf)
      .send({
        code: "T-02",
        type: "ev",
        buildingName: "Updated Test Parkade",
        address: "2 Test Street",
        hourlyPrice: 30
      });

    expect(update.status).toBe(200);
    expect(update.body.data).toMatchObject({
      code: "T-02",
      type: "ev",
      hourlyPrice: 30
    });

    const deactivate = await adminAgent
      .patch(`/api/v1/spaces/${spaceId}/status`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ active: false });
    expect(deactivate.status).toBe(200);
    expect(deactivate.body.data.active).toBe(false);

    const customerList = await customerAgent.get("/api/v1/spaces");
    expect(customerList.body.data).toHaveLength(0);

    const adminList = await adminAgent.get("/api/v1/spaces?includeInactive=true");
    expect(adminList.body.data).toEqual([
      expect.objectContaining({
        id: spaceId,
        code: "T-02",
        active: 0
      })
    ]);

    const activate = await adminAgent
      .patch(`/api/v1/spaces/${spaceId}/status`)
      .set("X-CSRF-Token", adminCsrf)
      .send({ active: true });
    expect(activate.status).toBe(200);
  });

  it("allows removal of a parking space without reservation history", async () => {
    const created = await adminAgent
      .post("/api/v1/spaces")
      .set("X-CSRF-Token", adminCsrf)
      .send({
        code: "DELETE-ME",
        type: "standard",
        buildingName: "Temporary Parkade",
        address: "3 Test Street",
        hourlyPrice: 10
      });

    const removed = await adminAgent
      .delete(`/api/v1/spaces/${created.body.data.id}`)
      .set("X-CSRF-Token", adminCsrf);
    expect(removed.status).toBe(204);
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
      status: "pending_payment",
      totalPrice: 60
    });
    reservationId = response.body.data.id;

    const list = await customerAgent.get("/api/v1/reservations");

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({
      id: reservationId,
      spaceCode: "T-02",
      licensePlate: "CA 123-456",
      status: "pending_payment"
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

  it("approves an idempotent mock payment and generates an invoice", async () => {
    const body = {
      reservationId,
      outcome: "approved",
      idempotencyKey: paymentKey
    };
    const payment = await customerAgent
      .post("/api/v1/payments/mock")
      .set("X-CSRF-Token", customerCsrf)
      .send(body);

    expect(payment.status).toBe(201);
    expect(payment.body.data).toMatchObject({
      reservationId,
      status: "succeeded",
      amount: 60,
      currency: "ZAR"
    });
    invoiceId = payment.body.data.invoiceId;

    const repeated = await customerAgent
      .post("/api/v1/payments/mock")
      .set("X-CSRF-Token", customerCsrf)
      .send(body);
    expect(repeated.status).toBe(201);
    expect(repeated.body.data.id).toBe(payment.body.data.id);
    expect(repeated.body.data.invoiceId).toBe(invoiceId);

    const invoice = await customerAgent.get(`/api/v1/invoices/${invoiceId}`);
    expect(invoice.status).toBe(200);
    expect(invoice.body.data).toMatchObject({
      invoiceNumber: expect.stringMatching(/^INV-\d{4}-\d{6}$/),
      reservationId,
      customerName: "Updated Driver",
      spaceCode: "T-02",
      subtotal: 60,
      total: 60,
      currency: "ZAR"
    });

    const invoices = await customerAgent.get("/api/v1/invoices");
    expect(invoices.body.data).toHaveLength(1);
  });

  it("records a declined mock payment and releases the space", async () => {
    const reservation = await customerAgent
      .post("/api/v1/reservations")
      .set("X-CSRF-Token", customerCsrf)
      .send({
        parkingSpaceId: spaceId,
        vehicleId,
        startsAt: "2030-05-11T08:00:00.000Z",
        endsAt: "2030-05-11T10:00:00.000Z"
      });

    const payment = await customerAgent
      .post("/api/v1/payments/mock")
      .set("X-CSRF-Token", customerCsrf)
      .send({
        reservationId: reservation.body.data.id,
        outcome: "declined",
        idempotencyKey: randomUUID()
      });
    expect(payment.status).toBe(200);
    expect(payment.body.data).toMatchObject({
      status: "failed",
      failureReason: "Mock payment was declined",
      invoiceId: null
    });
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

  it("protects parking spaces with reservation history from removal", async () => {
    const response = await adminAgent
      .delete(`/api/v1/spaces/${spaceId}`)
      .set("X-CSRF-Token", adminCsrf);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("SPACE_HAS_RESERVATIONS");
  });

  it("rejects state changes without a CSRF token", async () => {
    const response = await customerAgent
      .post("/api/v1/vehicles")
      .send({ name: "Second car", licensePlate: "CA 999-999" });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("INVALID_CSRF_TOKEN");
  });

  it("changes the password after validating the current password", async () => {
    const invalid = await customerAgent
      .post("/api/v1/profile/password")
      .set("X-CSRF-Token", customerCsrf)
      .send({
        currentPassword: "wrong-password",
        newPassword: "new-secure-password"
      });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("INVALID_CURRENT_PASSWORD");

    const changed = await customerAgent
      .post("/api/v1/profile/password")
      .set("X-CSRF-Token", customerCsrf)
      .send({
        currentPassword: customer.password,
        newPassword: "new-secure-password"
      });
    expect(changed.status).toBe(204);
  });

  it("revokes the server-side session on logout", async () => {
    const logout = await customerAgent
      .post("/api/v1/auth/logout")
      .set("X-CSRF-Token", customerCsrf);

    expect(logout.status).toBe(204);
    const restored = await customerAgent.get("/api/v1/auth/session");
    expect(restored.status).toBe(401);

    expect((await login(customerAgent, customer)).status).toBe(401);
    const newSession = await login(customerAgent, {
      ...customer,
      password: "new-secure-password"
    });
    expect(newSession.status).toBe(200);
  });
});

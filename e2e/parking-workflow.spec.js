import { expect, test } from "@playwright/test";
import mysql from "mysql2/promise";

const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const customer = {
  email: `e2e-customer-${runId}@example.com`,
  username: `customer-${runId}`.slice(0, 80),
  password: "customer-e2e-password",
  firstName: "E2E",
  lastName: "Customer"
};
const admin = {
  email: `e2e-admin-${runId}@example.com`,
  username: `admin-${runId}`.slice(0, 80),
  password: "administrator-e2e-password",
  firstName: "E2E",
  lastName: "Admin"
};
const bookingSpaceCode = `BOOK-${runId}`.slice(0, 40);
const managedSpaceCode = `ADMIN-${runId}`.slice(0, 40);
const editedSpaceCode = `EDIT-${runId}`.slice(0, 40);
const licensePlate = `E2E-${runId}`.slice(0, 40).toUpperCase();

function databaseConfig() {
  return {
    host: process.env.DATABASE_HOST ?? "127.0.0.1",
    port: Number(process.env.DATABASE_PORT ?? 3306),
    database: process.env.DATABASE_NAME ?? "parking_reservation",
    user: process.env.DATABASE_USER ?? "parking_app",
    password: process.env.DATABASE_PASSWORD ?? "local-parking-password"
  };
}

async function cleanupE2EData(database) {
  const testUsers = "u.email LIKE 'e2e-%@example.com'";
  await database.query(
    `DELETE i FROM invoices i JOIN users u ON u.id = i.user_id WHERE ${testUsers}`
  );
  await database.query(
    `DELETE p FROM payments p JOIN users u ON u.id = p.user_id WHERE ${testUsers}`
  );
  await database.query(
    `DELETE r FROM reservations r JOIN users u ON u.id = r.user_id WHERE ${testUsers}`
  );
  await database.query("DELETE FROM users WHERE email LIKE 'e2e-%@example.com'");
  await database.query(
    `DELETE FROM parking_spaces
     WHERE code LIKE 'BOOK-%' OR code LIKE 'ADMIN-%' OR code LIKE 'EDIT-%'`
  );
}

async function register(page, user) {
  await page.getByRole("button", { name: "New here? Create an account" }).click();
  await page.getByLabel("First name").fill(user.firstName);
  await page.getByLabel("Last name").fill(user.lastName);
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Find your space" })).toBeVisible();
}

async function login(page, user) {
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Find your space" })).toBeVisible();
}

test.describe.serial("browser parking workflow", () => {
  test.beforeAll(async () => {
    const database = await mysql.createConnection(databaseConfig());
    try {
      await cleanupE2EData(database);
      await database.execute(
        `INSERT INTO parking_spaces (code, type, building_name, address, hourly_price)
         VALUES (?, 'standard', 'E2E Parkade', '1 Browser Test Road', 20)`,
        [bookingSpaceCode]
      );
    } finally {
      await database.end();
    }
  });

  test.afterAll(async () => {
    const database = await mysql.createConnection(databaseConfig());
    try {
      await cleanupE2EData(database);
    } finally {
      await database.end();
    }
  });

  test("customer completes a reservation and restores the session", async ({ page }) => {
    await page.goto("/");
    await register(page, customer);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Find your space" })).toBeVisible();

    await page.getByLabel("Theme").selectOption("dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "profile" }).click();
    await page.getByLabel("First name").fill("Browser");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();

    await page.getByRole("button", { name: "vehicles" }).click();
    await page.getByLabel("Vehicle name").fill("Browser test car");
    await page.getByLabel("License plate").fill(licensePlate);
    await page.getByRole("button", { name: "Add vehicle" }).click();
    await expect(page.getByText(licensePlate)).toBeVisible();

    await page.getByRole("button", { name: "spaces" }).click();
    const spaceOption = page.getByLabel("Parking space").locator("option", { hasText: bookingSpaceCode });
    await page.getByLabel("Parking space").selectOption(await spaceOption.getAttribute("value"));
    await page.getByLabel("Vehicle").selectOption({ label: `Browser test car · ${licensePlate}` });
    await page.getByLabel("From").fill("2042-05-10T08:00");
    await page.getByLabel("Until").fill("2042-05-10T10:00");
    await page.getByRole("button", { name: "Reserve space" }).click();

    await expect(page.getByRole("heading", { name: "Your reservations" })).toBeVisible();
    await expect(page.getByText(bookingSpaceCode)).toBeVisible();
    await page.getByRole("button", { name: "Pay now" }).click();
    await expect(page.getByRole("heading", { name: "Your invoices" })).toBeVisible();
    await page.locator(".invoice-list button").first().click();
    await expect(page.getByRole("button", { name: "Print / save PDF" })).toBeVisible();
    await expect(page.getByText("Total paid")).toBeVisible();

    await page.getByRole("button", { name: "reservations" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Reservation cancelled.")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("heading", { name: "Sign in to Parkwise" })).toBeVisible();
  });

  test("administrator manages spaces and customers cannot see admin controls", async ({ page }) => {
    await page.goto("/");
    await register(page, admin);
    await page.getByRole("button", { name: "Sign out" }).click();

    const database = await mysql.createConnection(databaseConfig());
    try {
      await database.execute("UPDATE users SET role = 'admin' WHERE email = ?", [admin.email]);
    } finally {
      await database.end();
    }

    await login(page, admin);
    await page.getByRole("button", { name: "manage" }).click();
    await expect(page.getByRole("heading", { name: "Manage spaces" })).toBeVisible();

    await page.getByLabel("Space code").fill(managedSpaceCode);
    await page.getByLabel("Type").selectOption("ev");
    await page.getByLabel("Building name").fill("Admin Test Parkade");
    await page.getByLabel("Address").fill("2 Browser Test Road");
    await page.getByLabel("Hourly price (R)").fill("35");
    await page.getByRole("button", { name: "Save parking space" }).click();
    await expect(page.getByText(managedSpaceCode)).toBeVisible();

    let row = page.locator(".admin-space-row", { hasText: managedSpaceCode });
    await row.getByRole("button", { name: "Edit" }).click();
    await page.getByLabel("Space code").fill(editedSpaceCode);
    await page.getByLabel("Hourly price (R)").fill("40");
    await page.getByRole("button", { name: "Save parking space" }).click();
    await expect(page.getByText(editedSpaceCode)).toBeVisible();

    row = page.locator(".admin-space-row", { hasText: editedSpaceCode });
    await row.getByRole("button", { name: "Deactivate" }).click();
    await expect(row.getByText("inactive")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await login(page, customer);
    await expect(page.getByRole("button", { name: "manage" })).toHaveCount(0);
  });
});

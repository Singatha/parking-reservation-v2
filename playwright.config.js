import { defineConfig, devices } from "@playwright/test";

const apiEnvironment = {
  NODE_ENV: "test",
  API_PORT: "3000",
  WEB_ORIGIN: "http://localhost:5173",
  DATABASE_HOST: process.env.DATABASE_HOST ?? "127.0.0.1",
  DATABASE_PORT: process.env.DATABASE_PORT ?? "3306",
  DATABASE_NAME: process.env.DATABASE_NAME ?? "parking_reservation",
  DATABASE_USER: process.env.DATABASE_USER ?? "parking_app",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? "local-parking-password",
  SESSION_TTL_DAYS: "1",
  COOKIE_SECURE: "false"
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: [
    {
      command: "npm run start -w @parking/api",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      env: apiEnvironment,
      timeout: 120_000
    },
    {
      command: "npm run dev -w @parking/web -- --host 127.0.0.1",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    }
  ]
});

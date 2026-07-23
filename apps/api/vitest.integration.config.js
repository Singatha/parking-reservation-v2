import { defineConfig } from "vitest/config";

const integrationEnvironment = {
  NODE_ENV: "test",
  API_PORT: "3001",
  WEB_ORIGIN: "http://localhost:5173",
  DATABASE_HOST: process.env.DATABASE_HOST ?? "127.0.0.1",
  DATABASE_PORT: process.env.DATABASE_PORT ?? "3306",
  DATABASE_NAME: process.env.DATABASE_TEST_NAME ?? "parking_reservation_test",
  DATABASE_USER: process.env.DATABASE_USER ?? "parking_app",
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ?? "local-parking-password",
  DATABASE_ROOT_PASSWORD: process.env.DATABASE_ROOT_PASSWORD ?? "local-root-password",
  JWT_SECRET: "integration-test-secret-at-least-32-characters-long",
  JWT_EXPIRES_IN: "15m"
};

Object.assign(process.env, integrationEnvironment);

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.js"],
    globalSetup: ["./test/integration/global-setup.js"],
    fileParallelism: false,
    sequence: {
      concurrent: false
    },
    env: integrationEnvironment
  }
});

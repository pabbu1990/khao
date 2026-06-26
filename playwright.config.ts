import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Loads the TEST project's URL + keys. NEVER point this at production.
dotenv.config({ path: "tests/.env.test" });

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1,            // seeded data + single dev server — keep it serial
  retries: 0,
  reporter: [["list"]],
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: process.env.SMOKE_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

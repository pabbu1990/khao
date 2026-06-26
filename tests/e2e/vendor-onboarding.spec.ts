import { test, expect } from "@playwright/test";
import { createUser, login } from "./lib";

// New confirmed user with NO vendor → full first-run: create kitchen → menu → dish.
test("new vendor onboarding flow", async ({ page }) => {
  const u = await createUser();
  await login(page, u.email);

  // Step 0 — create the kitchen (OnboardingForm)
  await expect(page.getByText(/Set up your kitchen/i)).toBeVisible();
  await page.getByPlaceholder(/Kitchen name/i).fill("Smoke Onboard Kitchen");
  await page.getByRole("button", { name: /Create my kitchen/i }).click();

  // Step 1 — getting-started wizard
  await expect(page.getByText(/Create your first menu|Welcome/i)).toBeVisible();

  // Step 2 — add a menu
  await page.goto("/dashboard/menu");
  await page.getByPlaceholder("e.g. Weekday Lunch").fill("Weekend Specials");
  await page.getByRole("button", { name: "Add menu" }).click();

  // Step 3 — add a dish
  await page.getByPlaceholder("e.g. Chicken Curry").fill("Chicken");
  await page.getByPlaceholder("0.00").fill("3");
  await page.getByRole("button", { name: "Add dish" }).click();
  await expect(page.getByText("Chicken")).toBeVisible();
});

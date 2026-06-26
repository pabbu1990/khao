import { test, expect } from "@playwright/test";
import { createUser, seedVendor, login } from "./lib";

test.describe("authentication", () => {
  test("returning vendor signs in and reaches the dashboard", async ({ page }) => {
    const u = await createUser();
    await seedVendor(u.id, { name: "Returning Kitchen" });
    await login(page, u.email);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Live orders|RETURNING KITCHEN/i })).toBeVisible();
  });

  test("wrong password is rejected and stays on /login", async ({ page }) => {
    const u = await createUser();
    await page.goto("/login");
    await page.getByPlaceholder("you@email.com").fill(u.email);
    await page.getByPlaceholder("Password").fill("definitely-wrong-pw");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});

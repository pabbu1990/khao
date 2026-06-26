import { test, expect } from "@playwright/test";
import { createUser, seedVendor, seedMenu, seedDish, login } from "./lib";

test("paused kitchen blocks ordering on the storefront", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Paused Kitchen", accepting: false });
  const m = await seedMenu(v.id, "Lunch");
  await seedDish(v.id, m.id, { name: "PauseDish", price: 4 });

  await page.goto(`/${v.slug}`);
  await expect(page.getByText(/Not accepting orders/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Add" }).first()).toBeDisabled();
});

test("vendor cannot add a dish priced at $0", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Price Kitchen" });
  await seedMenu(v.id, "Lunch");

  await login(page, u.email);
  await page.goto("/dashboard/menu");
  await page.getByPlaceholder("e.g. Chicken Curry").fill("Free Dish");
  await page.getByPlaceholder("0.00").fill("0");
  await page.getByRole("button", { name: "Add dish" }).click();
  await expect(page.getByText(/greater than \$0/i)).toBeVisible();
});

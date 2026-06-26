import { test, expect } from "@playwright/test";
import { createUser, seedVendor, seedMenu, seedDish, seedBigMenu, login } from "./lib";

test("multi-menu vendor: all menus and dishes show on the Menu page", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Multi Kitchen" });
  const m1 = await seedMenu(v.id, "Weekend Specials");
  await seedDish(v.id, m1.id, { name: "Chicken", price: 3, veg: false });
  const m2 = await seedMenu(v.id, "Weekday Lunch");
  await seedDish(v.id, m2.id, { name: "Avakaya", price: 3 });

  await login(page, u.email);
  await page.goto("/dashboard/menu");
  await expect(page.getByText("Weekend Specials")).toBeVisible();
  await expect(page.getByText("Weekday Lunch")).toBeVisible();
  await expect(page.getByText("Chicken")).toBeVisible();
  await expect(page.getByText("Avakaya")).toBeVisible();
});

test("single small menu renders on the storefront", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Small Kitchen" });
  const m = await seedMenu(v.id, "Lunch");
  await seedDish(v.id, m.id, { name: "Solo Dish", price: 6 });
  await page.goto(`/${v.slug}`);
  await expect(page.getByText("Solo Dish")).toBeVisible();
  await expect(page.getByText("$6.00")).toBeVisible();
});

test("big menu (12 dishes) renders on the storefront", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Big Kitchen" });
  await seedBigMenu(v.id, "Mega Menu", 12);
  await page.goto(`/${v.slug}`);
  await expect(page.getByText("Mega Menu")).toBeVisible();
  await expect(page.getByText("Dish 1", { exact: true })).toBeVisible();
  await expect(page.getByText("Dish 12", { exact: true })).toBeVisible();
});

test("sold-out dish shows 'Sold out' on the storefront", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "SoldOut Kitchen" });
  const m = await seedMenu(v.id, "Lunch");
  await seedDish(v.id, m.id, { name: "GoneDish", price: 4, soldOut: true });
  await page.goto(`/${v.slug}`);
  await expect(page.getByText("GoneDish")).toBeVisible();
  await expect(page.getByText(/Sold out/i)).toBeVisible();
});

test("settings save shows a confirmation", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Settings Kitchen" });
  await login(page, u.email);
  await page.goto("/dashboard/settings");
  await page.locator('textarea[name="bio"]').fill("We cook smoke-test food.");
  await page.getByRole("button", { name: /Save changes/i }).click();
  await expect(page.getByText(/Settings saved|Saved/i)).toBeVisible();
});

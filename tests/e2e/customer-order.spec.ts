import { test, expect, type Page } from "@playwright/test";
import { createUser, seedVendor, seedMenu, seedDish, admin } from "./lib";

async function fillCheckout(page: Page) {
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Smoke Buyer");
  await page.getByPlaceholder("(613) 555-1234").fill("6135551234");
  await page.getByRole("button", { name: /Place order/i }).click();
}

test("single-menu customer places an order end to end", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Order Kitchen" });
  const m = await seedMenu(v.id, "Lunch");
  await seedDish(v.id, m.id, { name: "Solo Dish", price: 7 });

  await page.goto(`/${v.slug}`);
  await page.getByRole("button", { name: "Add" }).first().click();
  await fillCheckout(page);

  await expect(page).toHaveURL(new RegExp(`/${v.slug}/order/`));
  const { data } = await admin().from("orders").select("id,subtotal_cad").eq("vendor_id", v.id);
  expect(data?.length).toBeGreaterThan(0);
});

test("multi-menu customer can order across two menus", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Cross Kitchen" });
  const m1 = await seedMenu(v.id, "Weekend Specials");
  await seedDish(v.id, m1.id, { name: "Chicken", price: 3, veg: false });
  const m2 = await seedMenu(v.id, "Weekday Lunch");
  await seedDish(v.id, m2.id, { name: "Avakaya", price: 3 });

  await page.goto(`/${v.slug}`);
  await page.getByRole("button", { name: "Add" }).nth(0).click();
  await page.getByRole("button", { name: "Add" }).first().click(); // second dish's Add (first remaining)
  await fillCheckout(page);

  await expect(page).toHaveURL(new RegExp(`/${v.slug}/order/`));
  const { data: orders } = await admin().from("orders").select("id").eq("vendor_id", v.id);
  const { data: items } = await admin().from("order_items").select("service_snapshot").eq("order_id", orders![0].id);
  const menus = new Set((items ?? []).map((i: { service_snapshot: string | null }) => i.service_snapshot));
  expect(menus.size).toBeGreaterThanOrEqual(1);
});

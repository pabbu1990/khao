import { test, expect } from "@playwright/test";
import { createUser, seedVendor, seedMenu, seedDish, seedOrder, login } from "./lib";

test("completing a live order removes it from Live orders", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Lifecycle Kitchen" });
  const m = await seedMenu(v.id, "Lunch");
  const dish = await seedDish(v.id, m.id, { name: "LifeDish", price: 5 });
  await seedOrder(v.id, dish, { status: "placed", name: "Live Buyer" });

  await login(page, u.email);
  await page.goto("/dashboard");
  await expect(page.getByText("Live Buyer")).toBeVisible();
  await page.getByRole("button", { name: "Complete" }).first().click();
  await expect(page.getByText(/No open orders|Recent/i)).toBeVisible();
});

test("a declined order can be reopened back into Live orders", async ({ page }) => {
  const u = await createUser();
  const v = await seedVendor(u.id, { name: "Reopen Kitchen" });
  const m = await seedMenu(v.id, "Lunch");
  const dish = await seedDish(v.id, m.id, { name: "ReopenDish", price: 5 });
  await seedOrder(v.id, dish, { status: "declined", name: "Reopen Buyer" });

  await login(page, u.email);
  await page.goto("/dashboard");
  await page.getByText("Reopen Buyer").click();                 // expand the recent row
  await page.getByRole("button", { name: /Reopen order/i }).click();
  await expect(page.getByText("Reopen Buyer")).toBeVisible();   // now back in Live orders
});

// Seed/login/cleanup helpers for the smoke suite. All test data is namespaced
// (slug "smoke-*", email "*@smoke.test") and removed in global teardown.
// Uses the service-role key — ONLY ever point tests/.env.test at a TEST project.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type Page } from "@playwright/test";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const SLUG_PREFIX = "smoke-";
export const EMAIL_DOMAIN = "@smoke.test";
export const PASSWORD = "Smoke-test-123!";

let _admin: SupabaseClient | null = null;
export function admin(): SupabaseClient {
  if (!URL || !SERVICE) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in tests/.env.test (use a TEST project, not prod!)");
  }
  if (!_admin) _admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
  return _admin;
}

const rnd = () => Math.random().toString(36).slice(2, 8);
export const testEmail = () => `smoke_${Date.now()}_${rnd()}${EMAIL_DOMAIN}`;
export const testSlug = (label = "kitchen") => `${SLUG_PREFIX}${label}-${rnd()}`;

export async function createUser(email = testEmail()) {
  const { data, error } = await admin().auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  return { id: data.user!.id, email };
}

export async function seedVendor(ownerId: string, opts: Partial<{ name: string; slug: string; accepting: boolean; area: string }> = {}) {
  const slug = opts.slug ?? testSlug();
  const { data, error } = await admin().from("vendors").insert({
    owner_id: ownerId,
    slug,
    name: opts.name ?? "Smoke Kitchen",
    area: opts.area ?? "Testville",
    status: "active",
    accepting_orders: opts.accepting ?? true,
    accept_cash: true,
    accept_interac: true,
  }).select("id,slug").single();
  if (error) throw error;
  return data as { id: string; slug: string };
}

export async function seedMenu(vendorId: string, name: string, dates: string[] = []) {
  const { data, error } = await admin().from("services").insert({
    vendor_id: vendorId, name, service_dates: dates, is_active: true, sort_order: 0,
  }).select("id,name").single();
  if (error) throw error;
  return data as { id: string; name: string };
}

export async function seedDish(vendorId: string, serviceId: string, opts: Partial<{ name: string; price: number; veg: boolean; soldOut: boolean }> = {}) {
  const { data, error } = await admin().from("dishes").insert({
    vendor_id: vendorId, service_id: serviceId,
    name: opts.name ?? "Test Dish",
    price_cad: opts.price ?? 5,
    veg: opts.veg ?? true,
    is_sold_out: opts.soldOut ?? false,
    is_active: true,
  }).select("id,name,price_cad").single();
  if (error) throw error;
  return data as { id: string; name: string; price_cad: number };
}

export async function seedBigMenu(vendorId: string, name: string, count = 12) {
  const menu = await seedMenu(vendorId, name);
  for (let i = 1; i <= count; i++) await seedDish(vendorId, menu.id, { name: `Dish ${i}`, price: i });
  return menu;
}

export async function seedOrder(vendorId: string, dish: { id: string; name: string; price_cad: number }, opts: Partial<{ status: string; name: string }> = {}) {
  const { data: order, error } = await admin().from("orders").insert({
    vendor_id: vendorId,
    customer_name: opts.name ?? "Smoke Customer",
    customer_phone: "+1 (555) 555-5555",
    fulfilment: "pickup",
    payment_method: "offline",
    payment_label: "Cash on pickup",
    payment_status: "unpaid",
    status: opts.status ?? "placed",
    subtotal_cad: dish.price_cad,
  }).select("id").single();
  if (error) throw error;
  await admin().from("order_items").insert({
    order_id: order!.id, dish_id: dish.id, name_snapshot: dish.name, service_snapshot: null, price_snapshot: dish.price_cad, qty: 1,
  });
  return order as { id: string };
}

export async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByPlaceholder("you@email.com").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
}

export async function cleanupAll() {
  const a = admin();
  const { data: vendors } = await a.from("vendors").select("id").like("slug", `${SLUG_PREFIX}%`);
  const ids = (vendors ?? []).map((v: { id: string }) => v.id);
  if (ids.length) {
    const { data: orders } = await a.from("orders").select("id").in("vendor_id", ids);
    const orderIds = (orders ?? []).map((o: { id: string }) => o.id);
    if (orderIds.length) await a.from("order_items").delete().in("order_id", orderIds);
    await a.from("orders").delete().in("vendor_id", ids);
    await a.from("dishes").delete().in("vendor_id", ids);
    await a.from("services").delete().in("vendor_id", ids);
    await a.from("vendors").delete().in("id", ids);
  }
  try {
    const { data } = await a.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data.users) if (u.email?.endsWith(EMAIL_DOMAIN)) await a.auth.admin.deleteUser(u.id);
  } catch { /* ignore */ }
}

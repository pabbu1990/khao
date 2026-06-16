"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus, Fulfilment, PayMethod } from "@/lib/types";

// ---------- helpers ----------
async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function getMyVendor() {
  const { supabase, user } = await requireUser();
  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return { supabase, user, vendor };
}

// ---------- vendor onboarding / settings ----------
// Slugs that collide with real app routes (or are otherwise unsafe as a public
// storefront address). A storefront can never take one of these exactly.
const RESERVED_SLUGS = new Set([
  "admin", "dashboard", "login", "logout", "reset", "auth", "post-login",
  "api", "privacy", "terms", "settings", "menu", "services", "report",
  "order", "orders", "vendor", "vendors", "signup", "signin", "_next",
]);

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Produce a slug that's safe to route on — never an exact reserved word.
function safeSlug(s: string, fallback = "kitchen") {
  const base = slugify(s) || fallback;
  return RESERVED_SLUGS.has(base) ? `${base}-kitchen` : base;
}

export async function createVendor(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Enter a kitchen name." };

  const area = String(formData.get("area") || "").trim();
  const base = safeSlug(name);
  const rand = () => Math.random().toString(36).slice(2, 6);
  const admin = createAdminClient();

  // If this owner already has a kitchen, don't create another.
  const { data: existing } = await admin.from("vendors").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (existing) { revalidatePath("/dashboard"); return { ok: true }; }

  // Reject a kitchen with the same name in the same area (case-insensitive).
  let dq = admin.from("vendors").select("id").ilike("name", name);
  if (area) dq = dq.ilike("area", area);
  const { data: dupe } = await dq.limit(1).maybeSingle();
  if (dupe) return { ok: false, error: `A kitchen named "${name}"${area ? ` in ${area}` : ""} already exists. Please pick a different name${area ? "" : " or add your area"}.` };

  // Ensure a profile row exists (vendors.owner_id references it). Don't overwrite an existing role.
  await admin.from("profiles").upsert({ id: user.id, role: "vendor" }, { onConflict: "id", ignoreDuplicates: true });

  const { data: taken } = await admin.from("vendors").select("id").eq("slug", base).maybeSingle();
  let slug = taken ? `${base}-${rand()}` : base;

  let { error } = await admin.from("vendors").insert({ owner_id: user.id, name, slug, area });
  if (error) {
    slug = `${base}-${rand()}`;
    ({ error } = await admin.from("vendors").insert({ owner_id: user.id, name, slug, area }));
  }
  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateVendorSettings(formData: FormData): Promise<{ ok: boolean; error?: string; note?: string }> {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return { ok: false, error: "No kitchen found." };

  let acceptCash = formData.get("accept_cash") === "on";
  const acceptInterac = formData.get("accept_interac") === "on";
  // Never let a kitchen turn off every payment method — fall back to cash.
  let paymentNote: string | undefined;
  if (!acceptCash && !acceptInterac) { acceptCash = true; paymentNote = "You need at least one payment method, so we kept Cash on."; }

  // Link name (slug) — keep unique; ignore the change if it's taken.
  const desiredSlug = safeSlug(String(formData.get("slug") || vendor.slug), vendor.slug);
  let slug = vendor.slug;
  if (desiredSlug !== vendor.slug) {
    const admin = createAdminClient();
    const { data: taken } = await admin.from("vendors").select("id").eq("slug", desiredSlug).neq("id", vendor.id).maybeSingle();
    if (!taken) slug = desiredSlug;
  }

  const { error } = await supabase
    .from("vendors")
    .update({
      name: String(formData.get("name") || vendor.name),
      slug,
      bio: String(formData.get("bio") || ""),
      area: String(formData.get("area") || ""),
      hours: String(formData.get("hours") || ""),
      accept_cash: acceptCash,
      accept_interac: acceptInterac,
      offline_instructions: String(formData.get("offline_instructions") || ""),
    })
    .eq("id", vendor.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { ok: true, note: paymentNote };
}

// ---------- services (meal-time menus) ----------
export async function addService(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return { ok: false, error: "No kitchen found." };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Enter a service name." };
  const { error } = await supabase.from("services").insert({
    vendor_id: vendor.id,
    name,
    description: String(formData.get("description") || "") || null,
    service_dates: formData.getAll("service_dates").map(String),
    is_active: true,
  });
  if (error) return { ok: false, error: "Couldn't add the service. Please try again." };
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function updateService(formData: FormData) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  const id = String(formData.get("service_id") || "");
  if (!id) return;
  await supabase.from("services").update({
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
    service_dates: formData.getAll("service_dates").map(String),
  }).eq("id", id).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/menu");
}

export async function toggleServiceActive(serviceId: string, active: boolean) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("services").update({ is_active: active }).eq("id", serviceId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/services");
}

export async function deleteService(serviceId: string) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("services").delete().eq("id", serviceId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/menu");
}

// ---------- menu (dish) CRUD ----------
export async function addDish(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return { ok: false, error: "No kitchen found." };
  const name = String(formData.get("name") || "").trim();
  if (!name) return { ok: false, error: "Enter a dish name." };
  const { error } = await supabase.from("dishes").insert({
    vendor_id: vendor.id,
    service_id: String(formData.get("service_id") || "") || null,
    name,
    description: String(formData.get("description") || ""),
    price_cad: Number(formData.get("price_cad") || 0),
    veg: formData.get("veg") === "on",
    photo_url: String(formData.get("photo_url") || "") || null,
  });
  if (error) return { ok: false, error: "Couldn't add the dish. Please try again." };
  revalidatePath("/dashboard/menu");
  return { ok: true };
}

export async function updateDish(formData: FormData) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  const id = String(formData.get("dish_id") || "");
  if (!id) return;
  await supabase.from("dishes").update({
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
    price_cad: Number(formData.get("price_cad") || 0),
  }).eq("id", id).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/menu");
}

export async function setDishService(dishId: string, serviceId: string) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("dishes").update({ service_id: serviceId || null }).eq("id", dishId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/menu");
}

export async function toggleSoldOut(dishId: string, soldOut: boolean) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("dishes").update({ is_sold_out: soldOut }).eq("id", dishId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/menu");
}

export async function deleteDish(dishId: string) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("dishes").delete().eq("id", dishId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/menu");
}

// ---------- orders ----------
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("orders").update({ status }).eq("id", orderId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard");
}

export async function setPaymentStatus(orderId: string, status: "paid" | "unpaid") {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("orders").update({ payment_status: status }).eq("id", orderId).eq("vendor_id", vendor.id);
  revalidatePath("/dashboard/report");
}

export interface PlaceOrderInput {
  vendorId: string;
  slug: string;
  customer: { name: string; phone: string; email: string; address: string };
  fulfilment: Fulfilment;
  requestedTime: string;
  note: string;
  paymentMethod: PayMethod;
  paymentLabel: string;
  items: { dishId: string; qty: number }[];
}

// Public: placed by a guest. Uses service role to insert + read back the id.
export async function placeOrder(input: PlaceOrderInput): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  const admin = createAdminClient();
  const ids = input.items.map((i) => i.dishId);
  if (ids.length === 0) return { ok: false, error: "Your cart is empty." };

  const { data: dishes } = await admin
    .from("dishes")
    .select("id,name,price_cad,is_sold_out,is_active,vendor_id,services(name)")
    .in("id", ids)
    .eq("vendor_id", input.vendorId);

  if (!dishes || dishes.length === 0) return { ok: false, error: "Items not found." };

  let subtotal = 0;
  const items = input.items.map((line) => {
    const d = dishes.find((x) => x.id === line.dishId) as
      | { id: string; name: string; price_cad: number; is_sold_out: boolean; is_active: boolean; services: { name: string } | null }
      | undefined;
    if (!d || d.is_sold_out || !d.is_active) return null;
    const qty = Math.max(1, Math.floor(line.qty));
    subtotal += Number(d.price_cad) * qty;
    return {
      dish_id: d.id,
      name_snapshot: d.name,
      service_snapshot: d.services?.name ?? null,
      price_snapshot: d.price_cad,
      qty,
    };
  }).filter(Boolean) as { dish_id: string; name_snapshot: string; service_snapshot: string | null; price_snapshot: number; qty: number }[];

  if (items.length === 0) return { ok: false, error: "All selected items are unavailable." };

  const { data: order, error } = await admin
    .from("orders")
    .insert({
      vendor_id: input.vendorId,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email || null,
      customer_address: input.customer.address || null,
      fulfilment: input.fulfilment,
      requested_time: input.requestedTime || null,
      customer_note: input.note || null,
      payment_method: input.paymentMethod,
      payment_label: input.paymentLabel,
      payment_status: "unpaid",
      status: "placed",
      subtotal_cad: subtotal,
    })
    .select("id")
    .single();

  if (error || !order) return { ok: false, error: error?.message || "Could not place order." };

  await admin.from("order_items").insert(items.map((it) => ({ ...it, order_id: order.id })));
  return { ok: true, orderId: order.id };
}

export async function setVendorLogo(url: string) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("vendors").update({ logo_url: url || null }).eq("id", vendor.id);
  revalidatePath("/dashboard/settings");
}

export async function toggleAcceptingOrders(next: boolean) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("vendors").update({ accepting_orders: next }).eq("id", vendor.id);
  revalidatePath("/dashboard");
}

// ---------- admin (account controls; RLS enforces admin-only) ----------
export async function setVendorStatus(vendorId: string, status: "active" | "suspended") {
  const { supabase } = await requireUser();
  await supabase.from("vendors").update({ status }).eq("id", vendorId);
  revalidatePath("/admin");
  revalidatePath(`/admin/vendor/${vendorId}`);
}

// ---------- public contact form ----------
export async function sendContactMessage(input: { name: string; email: string; phone: string; reason: string }): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  const email = input.email.trim();
  const reason = input.reason.trim();
  if (!name || !email || !reason) return { ok: false, error: "Please fill in your name, email and message." };

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  if (!key || !to) return { ok: false, error: "Contact isn't set up yet — please try again later." };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM || "Khao <onboarding@resend.dev>",
      to: [to],
      reply_to: email,
      subject: `New Khao contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${input.phone.trim() || "-"}\n\nMessage:\n${reason}`,
    }),
  });

  if (!res.ok) return { ok: false, error: "Couldn't send your message. Please try again." };
  return { ok: true };
}

// ---------- auth ----------
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

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
    .maybeSingle();
  return { supabase, user, vendor };
}

// ---------- vendor onboarding / settings ----------
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createVendor(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  // Auto-generate the storefront link from the kitchen name; ensure it's unique.
  const base = slugify(name) || "kitchen";
  const admin = createAdminClient();
  const { data: taken } = await admin.from("vendors").select("id").eq("slug", base).maybeSingle();
  const slug = taken ? `${base}-${Math.random().toString(36).slice(2, 6)}` : base;

  await supabase.from("vendors").insert({
    owner_id: user.id,
    name,
    slug,
    area: String(formData.get("area") || ""),
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateVendorSettings(formData: FormData) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;

  let acceptCash = formData.get("accept_cash") === "on";
  const acceptInterac = formData.get("accept_interac") === "on";
  // Never let a kitchen turn off every payment method — fall back to cash.
  if (!acceptCash && !acceptInterac) acceptCash = true;

  // Link name (slug) — keep unique; ignore the change if it's taken.
  const desiredSlug = slugify(String(formData.get("slug") || vendor.slug)) || vendor.slug;
  let slug = vendor.slug;
  if (desiredSlug !== vendor.slug) {
    const admin = createAdminClient();
    const { data: taken } = await admin.from("vendors").select("id").eq("slug", desiredSlug).neq("id", vendor.id).maybeSingle();
    if (!taken) slug = desiredSlug;
  }

  await supabase
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
      accepting_orders: formData.get("accepting_orders") === "on",
    })
    .eq("id", vendor.id);
  revalidatePath("/dashboard/settings");
}

// ---------- services (meal-time menus) ----------
export async function addService(formData: FormData) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("services").insert({
    vendor_id: vendor.id,
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "") || null,
    available_days: formData.getAll("days").map(String),
    is_active: true,
  });
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
export async function addDish(formData: FormData) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("dishes").insert({
    vendor_id: vendor.id,
    service_id: String(formData.get("service_id") || "") || null,
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || ""),
    price_cad: Number(formData.get("price_cad") || 0),
    veg: formData.get("veg") === "on",
    photo_url: String(formData.get("photo_url") || "") || null,
  });
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

// ---------- admin (account controls; RLS enforces admin-only) ----------
export async function setVendorStatus(vendorId: string, status: "active" | "suspended") {
  const { supabase } = await requireUser();
  await supabase.from("vendors").update({ status }).eq("id", vendorId);
  revalidatePath("/admin");
  revalidatePath(`/admin/vendor/${vendorId}`);
}

// ---------- auth ----------
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

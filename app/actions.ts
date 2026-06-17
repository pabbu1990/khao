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

// Notify the Khao team when a new kitchen signs up. Best-effort: never blocks
// or fails vendor creation if email isn't configured or sending errors.
async function notifyNewVendor(v: { email: string; name: string; area: string; slug: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFY_EMAIL || "kiranpabbu.90@gmail.com";
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || "Khao <noreply@thekhao.com>",
        to: [to],
        reply_to: v.email,
        subject: `New Khao kitchen: ${v.name}`,
        text: `A new kitchen just signed up on Khao.\n\nKitchen: ${v.name}\nArea: ${v.area || "-"}\nOwner email: ${v.email}\nPage: https://thekhao.com/${v.slug}`,
      }),
    });
  } catch { /* ignore — notification is non-critical */ }
}

// Welcome the vendor when their kitchen goes live. Best-effort.
async function sendVendorWelcome(v: { email: string; name: string; slug: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !v.email) return;
  const link = `https://thekhao.com/${v.slug}`;
  const dash = "https://thekhao.com/dashboard";

  const text = [
    `Welcome to Khao!`,
    ``,
    `Your kitchen "${v.name}" is now set up. Here's how to start taking orders:`,
    `1. Add your dishes (with prices and photos), grouped by service`,
    `2. Share your link with customers on WhatsApp`,
    `3. Watch orders land live on your dashboard`,
    ``,
    `Your ordering page: ${link}`,
    `Your dashboard: ${dash}`,
    ``,
    `Khao never takes a commission — every order is yours.`,
    `Questions? Just reply to this email.`,
    ``,
    `— The Khao team`,
  ].join("\n");

  const btn = (href: string, label: string, bg: string, color: string) =>
    `<a href="${href}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:12px;">${label}</a>`;

  const step = (n: string, t: string, d: string) =>
    `<tr>
      <td valign="top" style="width:34px;padding:6px 0;">
        <div style="width:26px;height:26px;border-radius:50%;background:#FBEFDD;color:#B06D1A;font-weight:700;font-size:13px;line-height:26px;text-align:center;">${n}</div>
      </td>
      <td valign="top" style="padding:6px 0;">
        <div style="font-weight:700;color:#2A1810;font-size:15px;">${t}</div>
        <div style="color:#6f6457;font-size:14px;line-height:1.5;">${d}</div>
      </td>
    </tr>`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#FBF6EE;">
  <div style="display:none;max-height:0;overflow:hidden;">Your kitchen is live on Khao — here's how to start taking orders.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF6EE;padding:28px 14px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #EADFCD;border-radius:18px;overflow:hidden;">
        <tr><td style="padding:26px 32px 0 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;"><img src="https://thekhao.com/khao-email-logo.png" width="40" height="40" alt="Khao" style="display:block;border-radius:10px;"></td>
            <td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:24px;font-weight:800;color:#E0922F;letter-spacing:-0.5px;">Khao</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:22px 32px 0 32px;">
          <h1 style="margin:0;font-size:26px;line-height:1.25;color:#2A1810;font-weight:800;">Welcome to Khao 🎉</h1>
          <p style="margin:10px 0 0 0;font-size:16px;line-height:1.6;color:#6f6457;">
            Your kitchen <strong style="color:#2A1810;">${v.name}</strong> is set up and ready. You're moments away from taking your first order — here's all that's left:
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px 0 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${step("1", "Add your dishes", "Add what you're cooking — prices, photos, grouped by service.")}
            ${step("2", "Share your link", "Drop it in your WhatsApp groups, status, or chats.")}
            ${step("3", "Orders land live", "Every order appears instantly on your dashboard.")}
          </table>
        </td></tr>
        <tr><td style="padding:22px 32px 0 32px;">
          <div style="background:#F4EBDD;border-radius:12px;padding:14px 16px;">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#9b8e7d;font-weight:700;">Your ordering page</div>
            <div style="font-size:15px;color:#2A1810;font-weight:700;margin-top:3px;word-break:break-all;">${link}</div>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px 4px 32px;">
          ${btn(dash, "Open my dashboard", "#E0922F", "#2A1810")}
          &nbsp;
          ${btn(link, "View my page", "#ffffff", "#2A1810")}
        </td></tr>
        <tr><td style="padding:18px 32px 0 32px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#6f6457;">
            And the best part — <strong style="color:#3E7A4E;">Khao never takes a commission.</strong> Every order is yours, and you handle payment and delivery your way.
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px 26px 32px;border-top:1px solid #EADFCD;margin-top:8px;">
          <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#9b8e7d;">
            Questions or need a hand getting set up? Just reply to this email — a real person will help.
          </p>
          <p style="margin:10px 0 0 0;font-size:13px;color:#9b8e7d;">— The Khao team</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:12px;color:#b3a692;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Khao · Online ordering for home kitchens · thekhao.com</p>
    </td></tr>
  </table></body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.WELCOME_FROM || "Khao <hello@thekhao.com>",
        to: [v.email],
        reply_to: process.env.ADMIN_NOTIFY_EMAIL || "kiranpabbu.90@gmail.com",
        subject: `Welcome to Khao — ${v.name} is live`,
        text,
        html,
      }),
    });
  } catch { /* ignore — welcome email is non-critical */ }
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

  await notifyNewVendor({ email: user.email ?? "", name, area, slug });
  await sendVendorWelcome({ email: user.email ?? "", name, slug });

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

// Duplicate a service together with its dishes — lets a vendor reuse last week's
// menu without rebuilding it. New copy resets dates and marks dishes available.
export async function duplicateService(serviceId: string) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  const { data: svc } = await supabase.from("services").select("*").eq("id", serviceId).eq("vendor_id", vendor.id).maybeSingle();
  if (!svc) return;
  const { data: newSvc } = await supabase.from("services").insert({
    vendor_id: vendor.id,
    name: `${svc.name} (copy)`,
    description: svc.description ?? null,
    available_days: svc.available_days ?? [],
    is_active: svc.is_active,
  }).select("id").single();
  if (!newSvc) return;
  const { data: dishes } = await supabase.from("dishes").select("*").eq("service_id", serviceId).eq("vendor_id", vendor.id);
  if (dishes && dishes.length) {
    await supabase.from("dishes").insert(dishes.map((d) => ({
      vendor_id: vendor.id,
      service_id: newSvc.id,
      name: d.name,
      description: d.description ?? null,
      price_cad: d.price_cad,
      veg: d.veg,
      photo_url: d.photo_url ?? null,
      is_active: d.is_active,
      is_sold_out: false,
    })));
  }
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/menu");
}

// Bulk mark every dish sold out (end of service) or available again (start of day).
export async function setAllSoldOut(soldOut: boolean) {
  const { supabase, vendor } = await getMyVendor();
  if (!vendor) return;
  await supabase.from("dishes").update({ is_sold_out: soldOut }).eq("vendor_id", vendor.id);
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
      from: process.env.CONTACT_FROM || "Khao <noreply@thekhao.com>",
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

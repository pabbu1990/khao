import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/lib/types";

type Row = Order & { order_items: OrderItem[] };

const torontoDate = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date(iso));

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { data: vendor } = await supabase.from("vendors").select("id").eq("owner_id", user.id).maybeSingle();
  if (!vendor) return new Response("No kitchen", { status: 404 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "7d";
  const status = searchParams.get("status") ?? "all";

  let q = supabase.from("orders").select("*, order_items(*)").eq("vendor_id", vendor.id).order("created_at", { ascending: false });
  if (status !== "all") q = q.eq("status", status);
  if (range === "7d") q = q.gte("created_at", new Date(Date.now() - 7 * 864e5).toISOString());
  const { data } = await q;

  let rows = (data ?? []) as Row[];
  if (range === "today") {
    const t = torontoDate(new Date());
    rows = rows.filter((o) => torontoDate(o.created_at) === t);
  }

  const header = ["Time", "Name", "Phone", "Email", "Fulfilment", "Address", "Items", "Amount (CAD)", "Order status", "Payment method", "Payment status"];
  const lines = [header.join(",")];
  for (const o of rows) {
    const items = o.order_items.map((it) => `${it.qty}x ${it.name_snapshot}${it.service_snapshot ? ` (${it.service_snapshot})` : ""}`).join("; ");
    lines.push([
      new Date(o.created_at).toISOString(),
      o.customer_name,
      o.customer_phone,
      o.customer_email ?? "",
      o.fulfilment,
      o.customer_address ?? "",
      items,
      Number(o.subtotal_cad).toFixed(2),
      o.status,
      o.payment_label ?? o.payment_method,
      o.payment_status,
    ].map(cell).join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="khao-orders-${range}.csv"`,
    },
  });
}

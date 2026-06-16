import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmation({ params }: { params: { slug: string; id: string } }) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, vendors!inner(slug,name,offline_instructions), order_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!order || order.vendors.slug !== params.slug) notFound();

  return (
    <main className="min-h-screen bg-cream px-5 py-10">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-curry font-semibold">Order placed ✓</p>
        <h1 className="font-display text-2xl font-bold text-ink mt-1">Thanks, {order.customer_name}!</h1>
        <p className="text-ink/60 mt-1">{order.vendors.name} has received your order.</p>

        <div className="mt-5 rounded-lg bg-panel p-3 text-sm">
          <p className="font-semibold text-ink">Status: {ORDER_STATUS_LABEL[order.status] ?? order.status}</p>
          <p className="text-ink/60 capitalize">{order.fulfilment}{order.requested_time ? ` · ${order.requested_time}` : ""}</p>
        </div>

        <ul className="mt-4 divide-y divide-ink/10">
          {order.order_items.map((it: { id: string; qty: number; name_snapshot: string; price_snapshot: number }) => (
            <li key={it.id} className="flex justify-between py-2 text-ink">
              <span>{it.qty} × {it.name_snapshot}</span>
              <span>{money(Number(it.price_snapshot) * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-ink/10 pt-3 font-semibold text-ink">
          <span>Total</span><span>{money(Number(order.subtotal_cad))}</span>
        </div>

        {order.payment_label && (
          <div className="mt-5 rounded-lg border border-spice/40 bg-spice/10 p-3 text-sm text-ink">
            <p className="font-semibold">Payment · {order.payment_label}</p>
            {order.payment_label === "Interac e-transfer" && order.vendors.offline_instructions && (
              <p className="text-ink/70 mt-1">{order.vendors.offline_instructions}</p>
            )}
          </div>
        )}

        <Link href={`/${params.slug}`} className="mt-6 inline-block rounded-lg bg-spice px-5 py-2.5 font-semibold text-ink">
          Order again
        </Link>
      </div>
    </main>
  );
}

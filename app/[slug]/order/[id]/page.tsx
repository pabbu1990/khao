import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { money, ORDER_STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderConfirmation({ params }: { params: { slug: string; id: string } }) {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("orders")
    .select("*, vendors!inner(slug,name,offline_instructions,pickup_location), order_items(*)")
    .eq("id", params.id)
    .maybeSingle();

  if (!order || order.vendors.slug !== params.slug) notFound();

  return (
    <main className="min-h-screen bg-cream px-5 py-12">
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-7 shadow-card ring-1 ring-ink/[0.04]">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-curry/10 px-3 py-1 text-sm font-semibold text-curry"><span className="grid h-4 w-4 place-items-center rounded-full bg-curry text-[10px] text-white">✓</span> Order placed</div>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Thanks, {order.customer_name}!</h1>
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

        {order.fulfilment === "pickup" && (
          <div className="mt-5 rounded-lg border border-curry/30 bg-curry/[0.06] p-3 text-sm text-ink">
            <p className="flex items-center gap-1.5 font-semibold">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-curry" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              Pickup location
            </p>
            {order.vendors.pickup_location
              ? <p className="mt-1 whitespace-pre-line text-ink/70">{order.vendors.pickup_location}</p>
              : <p className="mt-1 text-ink/70">{order.vendors.name} will reach out with pickup instructions.</p>}
          </div>
        )}

        {order.payment_label && (
          <div className="mt-5 rounded-lg border border-spice/40 bg-spice/10 p-3 text-sm text-ink">
            <p className="font-semibold">Payment · {order.payment_label}</p>
            {order.payment_label === "Interac e-transfer" && order.vendors.offline_instructions && (
              <p className="text-ink/70 mt-1">{order.vendors.offline_instructions}</p>
            )}
          </div>
        )}

        <Link href={`/${params.slug}`} className="mt-6 inline-block rounded-xl bg-spice px-5 py-2.5 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">
          Order again
        </Link>
      </div>
      <p className="mx-auto mt-6 max-w-lg text-center"><Link href="/" className="text-xs text-ink/30 hover:text-ink/50">Powered by Khao</Link></p>
    </main>
  );
}

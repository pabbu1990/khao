"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dish, Vendor, Fulfilment } from "@/lib/types";
import { money } from "@/lib/format";
import { placeOrder } from "@/app/actions";

type Group = { service: { id: string; name: string; description: string | null }; dishes: Dish[] };

export default function Storefront({ vendor, groups }: { vendor: Vendor; groups: Group[] }) {
  const router = useRouter();
  const allDishes = useMemo(() => groups.flatMap((g) => g.dishes), [groups]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "",
    fulfilment: "pickup" as Fulfilment,
    requestedTime: "", note: "",
    payChoice: (vendor.accept_cash ? "cash" : "interac") as "cash" | "interac",
  });

  const lines = useMemo(
    () => allDishes.filter((d) => cart[d.id] > 0).map((d) => ({ dish: d, qty: cart[d.id] })),
    [cart, allDishes]
  );
  const subtotal = lines.reduce((s, l) => s + Number(l.dish.price_cad) * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  function set(id: string, delta: number) {
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + delta);
      const next = { ...c, [id]: q };
      if (q === 0) delete next[id];
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    const res = await placeOrder({
      vendorId: vendor.id,
      slug: vendor.slug,
      customer: { name: form.name, phone: form.phone, email: form.email, address: form.address },
      fulfilment: form.fulfilment,
      requestedTime: form.requestedTime,
      note: form.note,
      paymentMethod: "offline",
      paymentLabel:
        form.payChoice === "interac"
          ? "Interac e-transfer"
          : form.fulfilment === "delivery" ? "Cash on delivery" : "Cash on pickup",
      items: lines.map((l) => ({ dishId: l.dish.id, qty: l.qty })),
    });
    setSubmitting(false);
    if (!res.ok) { setErr(res.error || "Something went wrong."); return; }
    router.push(`/${vendor.slug}/order/${res.orderId}`);
  }

  const closed = !vendor.accepting_orders;

  return (
    <main className="min-h-screen bg-cream pb-28">
      <header className="bg-ink text-cream px-5 pt-8 pb-6">
        <h1 className="font-display text-3xl font-bold">{vendor.name}</h1>
        {vendor.area && <p className="text-cream/70 mt-1">{vendor.area}</p>}
        {vendor.bio && <p className="text-cream/80 mt-3 max-w-xl">{vendor.bio}</p>}
        {vendor.hours && <p className="text-spice text-sm mt-2">{vendor.hours}</p>}
        {closed && (
          <p className="mt-3 inline-block rounded bg-chili px-3 py-1 text-sm font-semibold">
            Not accepting orders right now
          </p>
        )}
      </header>

      <div className="mx-auto max-w-2xl px-4">
        {!checkout ? (
          <section className="mt-5 space-y-6">
            {allDishes.length === 0 && <p className="text-ink/60 py-10 text-center">No dishes available right now.</p>}
            {groups.map((g) => (
              <div key={g.service.id}>
                <h2 className="font-display text-xl font-bold text-ink">{g.service.name}</h2>
                {g.service.description && <p className="text-sm text-ink/50">{g.service.description}</p>}
                <div className="mt-2 space-y-3">
                  {g.dishes.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                {d.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.photo_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 16 16" width="16" height="16" className="shrink-0" aria-label={d.veg ? "Vegetarian" : "Non-vegetarian"}>
                      <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke={d.veg ? "#3E7A4E" : "#C0392B"} strokeWidth="1.8" />
                      <circle cx="8" cy="8" r="3" fill={d.veg ? "#3E7A4E" : "#C0392B"} />
                    </svg>
                    <h3 className="font-semibold text-ink">{d.name}</h3>
                  </div>
                  {d.description && <p className="text-sm text-ink/60 mt-0.5">{d.description}</p>}
                  <p className="mt-1 font-semibold text-ink">{money(Number(d.price_cad))}</p>
                </div>
                {d.is_sold_out ? (
                  <span className="text-sm text-chili font-medium">Sold out</span>
                ) : cart[d.id] ? (
                  <div className="flex items-center gap-3 rounded-lg bg-spice/15 px-2 py-1">
                    <button onClick={() => set(d.id, -1)} className="text-xl text-spice font-bold w-6">−</button>
                    <span className="w-4 text-center font-semibold">{cart[d.id]}</span>
                    <button onClick={() => set(d.id, +1)} className="text-xl text-spice font-bold w-6">+</button>
                  </div>
                ) : (
                  <button
                    disabled={closed}
                    onClick={() => set(d.id, +1)}
                    className="rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40"
                  >
                    Add
                  </button>
                )}
              </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-display text-xl font-bold text-ink">Your details</h2>
            <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Phone" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

            <div className="flex gap-2">
              {(["pickup", "delivery"] as Fulfilment[]).map((f) => (
                <button type="button" key={f}
                  onClick={() => setForm({ ...form, fulfilment: f })}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize ${form.fulfilment === f ? "border-spice bg-spice/10 text-ink" : "border-ink/15 text-ink/60"}`}>
                  {f}
                </button>
              ))}
            </div>
            {form.fulfilment === "delivery" && (
              <Field label="Delivery address" required value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            )}
            <Field label="Preferred time (optional)" value={form.requestedTime} onChange={(v) => setForm({ ...form, requestedTime: v })} />
            <Field label="Notes (optional)" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />

            <div>
              <p className="text-sm font-semibold text-ink mb-1">Payment</p>
              <div className="space-y-2">
                {vendor.accept_cash && (
                  <PayRadio
                    active={form.payChoice === "cash"}
                    onClick={() => setForm({ ...form, payChoice: "cash" })}
                    label={form.fulfilment === "delivery" ? "Cash on delivery" : "Cash on pickup"}
                  />
                )}
                {vendor.accept_interac && (
                  <PayRadio
                    active={form.payChoice === "interac"}
                    onClick={() => setForm({ ...form, payChoice: "interac" })}
                    label="Interac e-transfer"
                  />
                )}
              </div>
              {form.payChoice === "interac" && (
                <p className="mt-2 rounded-lg border border-spice/30 bg-spice/10 px-3 py-2 text-sm text-ink">
                  {vendor.offline_instructions
                    ? vendor.offline_instructions
                    : "The kitchen will share Interac e-transfer details — please confirm with them."}
                </p>
              )}
            </div>

            {err && <p className="text-chili text-sm">{err}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCheckout(false)} className="rounded-lg border border-ink/15 px-4 py-3 font-semibold text-ink/70">Back</button>
              <button disabled={submitting} className="flex-1 rounded-lg bg-spice px-4 py-3 font-semibold text-ink disabled:opacity-60">
                {submitting ? "Placing…" : `Place order · ${money(subtotal)}`}
              </button>
            </div>
          </form>
        )}
      </div>

      {count > 0 && !checkout && (
        <div className="fixed bottom-0 inset-x-0 border-t border-ink/10 bg-white p-4">
          <div className="mx-auto max-w-2xl flex items-center justify-between">
            <span className="font-semibold text-ink">{count} item{count > 1 ? "s" : ""} · {money(subtotal)}</span>
            <button onClick={() => setCheckout(true)} className="rounded-lg bg-spice px-6 py-3 font-semibold text-ink">Checkout</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <input
        type={type} required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-spice"
      />
    </label>
  );
}

function PayRadio({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold ${active ? "border-spice bg-spice/10 text-ink" : "border-ink/15 text-ink/60"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full border ${active ? "border-spice" : "border-ink/30"}`}>
        {active && <span className="h-2 w-2 rounded-full bg-spice" />}
      </span>
      {label}
    </button>
  );
}

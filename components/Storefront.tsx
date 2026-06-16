"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dish, Vendor, Fulfilment } from "@/lib/types";
import { money } from "@/lib/format";
import { placeOrder } from "@/app/actions";
import RealtimeRefresh from "@/components/RealtimeRefresh";

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
    <main className="min-h-screen bg-cream pb-32">
      <RealtimeRefresh vendorId={vendor.id} tables={["dishes", "services"]} pollMs={20000} />

      <header className="relative overflow-hidden rounded-b-[2rem] bg-ink px-6 pt-12 pb-9 text-cream shadow-pop">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-spice/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-chili/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-spice">Menu</span>
          <h1 className="mt-1.5 font-display text-[2.6rem] font-semibold leading-[1.05]">{vendor.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cream/70">
            {vendor.area && <span>{vendor.area}</span>}
            {vendor.area && vendor.hours && <span className="text-cream/30">•</span>}
            {vendor.hours && <span className="text-spice/90">{vendor.hours}</span>}
          </div>
          {vendor.bio && <p className="mt-3 max-w-xl leading-relaxed text-cream/80">{vendor.bio}</p>}
          <div className="mt-4">
            {closed ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-chili/90 px-3 py-1 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-cream" /> Not accepting orders
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream/90 ring-1 ring-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-curry" /> Taking orders now
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4">
        {!checkout ? (
          <section className="mt-7 space-y-8">
            {allDishes.length === 0 && (
              <p className="rounded-2xl bg-white py-12 text-center text-ink/50 shadow-card">No dishes available right now.</p>
            )}
            {groups.map((g) => (
              <div key={g.service.id}>
                <div className="flex items-center gap-3">
                  <h2 className="font-display text-2xl font-semibold text-ink">{g.service.name}</h2>
                  <span className="h-px flex-1 bg-line" />
                </div>
                {g.service.description && <p className="mt-1 text-sm text-ink/50">{g.service.description}</p>}
                <div className="mt-3 space-y-3">
                  {g.dishes.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-ink/[0.04] transition duration-200 hover:shadow-pop">
                      {d.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.photo_url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-ink/5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 16 16" width="15" height="15" className="shrink-0" aria-label={d.veg ? "Vegetarian" : "Non-vegetarian"}>
                            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke={d.veg ? "#3E7A4E" : "#C0392B"} strokeWidth="1.8" />
                            <circle cx="8" cy="8" r="3" fill={d.veg ? "#3E7A4E" : "#C0392B"} />
                          </svg>
                          <h3 className="truncate font-semibold text-ink">{d.name}</h3>
                        </div>
                        {d.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink/55">{d.description}</p>}
                        <p className="mt-1.5 font-semibold text-ink">{money(Number(d.price_cad))}</p>
                      </div>
                      {d.is_sold_out ? (
                        <span className="shrink-0 rounded-full bg-chili/10 px-3 py-1 text-xs font-semibold text-chili">Sold out</span>
                      ) : cart[d.id] ? (
                        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-spice/12 p-1 ring-1 ring-spice/20">
                          <button onClick={() => set(d.id, -1)} className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-spice transition hover:bg-spice/15">−</button>
                          <span className="w-5 text-center font-semibold tabular-nums">{cart[d.id]}</span>
                          <button onClick={() => set(d.id, +1)} className="grid h-8 w-8 place-items-center rounded-lg text-lg font-bold text-spice transition hover:bg-spice/15">+</button>
                        </div>
                      ) : (
                        <button
                          disabled={closed}
                          onClick={() => set(d.id, +1)}
                          className="shrink-0 rounded-xl bg-spice px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-95 disabled:opacity-40"
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
          <form onSubmit={submit} className="mt-7 space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink/[0.04]">
            <h2 className="font-display text-2xl font-semibold text-ink">Your details</h2>
            <Field label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Phone" required value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

            <div>
              <span className="text-sm font-medium text-ink/70">Pickup or delivery</span>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["pickup", "delivery"] as Fulfilment[]).map((f) => (
                  <button type="button" key={f}
                    onClick={() => setForm({ ...form, fulfilment: f })}
                    className={`rounded-xl border px-3 py-2.5 text-sm font-semibold capitalize transition ${form.fulfilment === f ? "border-spice bg-spice/10 text-ink" : "border-line text-ink/55 hover:border-ink/20"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {form.fulfilment === "delivery" && (
              <Field label="Delivery address" required value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            )}
            <Field label="Preferred time (optional)" value={form.requestedTime} onChange={(v) => setForm({ ...form, requestedTime: v })} />
            <Field label="Notes (optional)" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />

            <div>
              <p className="mb-1.5 text-sm font-medium text-ink/70">Payment</p>
              <div className="space-y-2">
                {vendor.accept_cash && (
                  <PayRadio active={form.payChoice === "cash"} onClick={() => setForm({ ...form, payChoice: "cash" })}
                    label={form.fulfilment === "delivery" ? "Cash on delivery" : "Cash on pickup"} />
                )}
                {vendor.accept_interac && (
                  <PayRadio active={form.payChoice === "interac"} onClick={() => setForm({ ...form, payChoice: "interac" })} label="Interac e-transfer" />
                )}
              </div>
              {form.payChoice === "interac" && (
                <p className="mt-2 rounded-xl border border-spice/30 bg-spice/10 px-3.5 py-2.5 text-sm text-ink">
                  {vendor.offline_instructions || "The kitchen will share Interac e-transfer details — please confirm with them."}
                </p>
              )}
            </div>

            {err && <p className="text-sm font-medium text-chili">{err}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setCheckout(false)} className="rounded-xl border border-line px-5 py-3 font-semibold text-ink/60 transition hover:border-ink/20">Back</button>
              <button disabled={submitting} className="flex-1 rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
                {submitting ? "Placing…" : `Place order · ${money(subtotal)}`}
              </button>
            </div>
          </form>
        )}
      </div>

      <footer className="mt-12 pb-6 text-center">
        <a href="/" className="text-xs font-medium tracking-wide text-ink/30 transition hover:text-ink/50">Powered by Khao</a>
      </footer>

      {count > 0 && !checkout && (
        <div className="fixed inset-x-0 bottom-0 p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-cream shadow-pop">
            <span className="font-semibold">{count} item{count > 1 ? "s" : ""} <span className="text-cream/50">·</span> {money(subtotal)}</span>
            <button onClick={() => setCheckout(true)} className="rounded-xl bg-spice px-6 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] active:scale-95">Checkout →</button>
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
        className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:border-spice focus:ring-4 focus:ring-spice/15"
      />
    </label>
  );
}

function PayRadio({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${active ? "border-spice bg-spice/10 text-ink" : "border-line text-ink/55 hover:border-ink/20"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full border-2 ${active ? "border-spice" : "border-ink/25"}`}>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-spice" />}
      </span>
      {label}
    </button>
  );
}

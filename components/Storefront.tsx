"use client";

import { useMemo, useState } from "react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import type { Dish, Vendor, Fulfilment } from "@/lib/types";
import { money, formatServiceDates } from "@/lib/format";
import { placeOrder } from "@/app/actions";
import MenuRefresher from "@/components/MenuRefresher";
import Logo from "@/components/Logo";

const COUNTRY_CODES: { name: string; code: string }[] = [
  { name: "CA/US", code: "+1" },
  { name: "India", code: "+91" },
  { name: "UK", code: "+44" },
  { name: "Australia", code: "+61" },
  { name: "UAE", code: "+971" },
  { name: "France", code: "+33" },
  { name: "Singapore", code: "+65" },
];

function formatPhoneFor(country: string, input: string): string {
  const d = input.replace(/\D/g, "");
  if (country === "+1") {
    const t = d.slice(0, 10);
    if (t.length <= 3) return t;
    if (t.length <= 6) return `(${t.slice(0, 3)}) ${t.slice(3)}`;
    return `(${t.slice(0, 3)}) ${t.slice(3, 6)}-${t.slice(6)}`;
  }
  return d.slice(0, 15);
}

function validatePhone(country: string, phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (country === "+1") return d.length === 10 ? "" : "Enter a 10-digit phone number.";
  return d.length >= 6 ? "" : "Enter a valid phone number.";
}

function validateEmail(email: string): string {
  if (!email) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address.";
}

type Group = { service: { id: string; name: string; description: string | null; dates: string[] }; dishes: Dish[] };

export default function Storefront({ vendor, groups }: { vendor: Vendor; groups: Group[] }) {
  const router = useRouter();
  const allDishes = useMemo(() => groups.flatMap((g) => g.dishes), [groups]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", country: "+1",
    fulfilment: "pickup" as Fulfilment,
    requestedTime: "", note: "",
    payChoice: (vendor.accept_cash ? "cash" : "interac") as "cash" | "interac",
  });
  const [errors, setErrors] = useState({ phone: "", email: "" });
  const [touched, setTouched] = useState({ phone: false, email: false });

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
    const phoneErr = validatePhone(form.country, form.phone);
    const emailErr = validateEmail(form.email);
    if (phoneErr || emailErr) {
      setTouched({ phone: true, email: true });
      setErrors({ phone: phoneErr, email: emailErr });
      return;
    }
    setSubmitting(true);
    const res = await placeOrder({
      vendorId: vendor.id,
      slug: vendor.slug,
      customer: { name: form.name, phone: `${form.country} ${form.phone}`, email: form.email, address: form.address },
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
      <MenuRefresher vendorId={vendor.id} intervalMs={15000} />

      <header className="relative overflow-hidden rounded-b-[2rem] bg-ink px-6 pt-12 pb-9 text-cream shadow-pop">
        <div className="pointer-events-none absolute -right-12 -top-20 h-56 w-56 rounded-full bg-spice/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-chili/20 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          {vendor.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.logo_url} alt="" className="mb-4 h-16 w-16 rounded-2xl object-cover ring-1 ring-white/15" />
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-spice">Menu</span>
          <h1 className="mt-1.5 font-display text-[2.6rem] font-semibold uppercase leading-[1.05]">{vendor.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cream/70">
            {vendor.area && <span className="uppercase">{vendor.area}</span>}
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
                  <h2 className="font-display text-2xl font-semibold uppercase text-ink">{g.service.name}</h2>
                  {g.service.dates.length > 0 && <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-semibold text-ink/60">{formatServiceDates(g.service.dates)}</span>}
                  <span className="h-px flex-1 bg-line" />
                </div>
                {g.service.description && <p className="mt-1 text-sm text-ink/50">{g.service.description}</p>}
                <div className="mt-3 space-y-3">
                  {g.dishes.map((d) => (
                    <div key={d.id} className="flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-card ring-1 ring-ink/[0.04] transition duration-200 hover:shadow-pop">
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-panel ring-1 ring-ink/5">
                        {(d.photo_url || vendor.logo_url) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.photo_url || vendor.logo_url || ""} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center"><Logo size={40} /></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <svg viewBox="0 0 16 16" width="15" height="15" className="shrink-0" aria-label={d.veg ? "Vegetarian" : "Non-vegetarian"}>
                            <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke={d.veg ? "#3E7A4E" : "#C0392B"} strokeWidth="1.8" />
                            <circle cx="8" cy="8" r="3" fill={d.veg ? "#3E7A4E" : "#C0392B"} />
                          </svg>
                          <h3 className="truncate font-semibold uppercase text-ink">{d.name}</h3>
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
            <div>
              <span className="text-sm font-medium text-ink/70">Phone</span>
              <div className={`mt-1.5 flex items-center rounded-xl border bg-white transition focus-within:ring-4 ${touched.phone && errors.phone ? "border-chili focus-within:ring-chili/15" : "border-line focus-within:border-spice focus-within:ring-spice/15"}`}>
                <input list="country-codes" value={form.country} aria-label="Country code" placeholder="+1"
                  onChange={(e) => setForm({ ...form, country: e.target.value, phone: formatPhoneFor(e.target.value, form.phone) })}
                  className="w-[4.5rem] rounded-l-xl bg-transparent py-3 pl-3.5 pr-1 text-sm font-medium text-ink/80 outline-none placeholder:text-ink/30" />
                <datalist id="country-codes">
                  {COUNTRY_CODES.map((c) => <option key={c.name} value={c.code}>{c.name}</option>)}
                </datalist>
                <span className="h-6 w-px shrink-0 bg-line" />
                <input type="tel" inputMode="numeric" placeholder="(613) 555-1234" value={form.phone}
                  onChange={(e) => { const v = formatPhoneFor(form.country, e.target.value); setForm({ ...form, phone: v }); if (touched.phone) setErrors((x) => ({ ...x, phone: validatePhone(form.country, v) })); }}
                  onBlur={() => { setTouched((t) => ({ ...t, phone: true })); setErrors((x) => ({ ...x, phone: validatePhone(form.country, form.phone) })); }}
                  className="flex-1 rounded-r-xl bg-transparent px-3.5 py-3 text-ink placeholder:text-ink/30 outline-none" />
              </div>
              {touched.phone && errors.phone && <p className="mt-1 text-sm text-chili">{errors.phone}</p>}
            </div>
            <div>
              <span className="text-sm font-medium text-ink/70">Email <span className="text-ink/35">(optional)</span></span>
              <input type="email" placeholder="you@email.com" value={form.email}
                onChange={(e) => { const v = e.target.value; setForm({ ...form, email: v }); if (touched.email) setErrors((x) => ({ ...x, email: validateEmail(v) })); }}
                onBlur={() => { setTouched((t) => ({ ...t, email: true })); setErrors((x) => ({ ...x, email: validateEmail(form.email) })); }}
                className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-ink placeholder:text-ink/30 outline-none transition focus:ring-4 ${touched.email && errors.email ? "border-chili focus:border-chili focus:ring-chili/15" : "border-line focus:border-spice focus:ring-spice/15"}`} />
              {touched.email && errors.email && <p className="mt-1 text-sm text-chili">{errors.email}</p>}
            </div>

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
                {submitting ? <span className="inline-flex items-center gap-2"><Spinner />Placing…</span> : `Place order · ${money(subtotal)}`}
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

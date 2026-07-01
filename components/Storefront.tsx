"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import type { Dish, Vendor, Fulfilment } from "@/lib/types";
import { money, formatServiceDates } from "@/lib/format";
import { placeOrder } from "@/app/actions";
import DishOptionsSheet from "@/components/DishOptionsSheet";
import { parseOptions, applySelections, hasOptions, snapshotText, selectionKey, type Selection, type SelectedOption } from "@/lib/options";
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
  type Line = { key: string; dish: Dish; qty: number; selections: Selection[]; snapshot: SelectedOption[]; unit: number };
  const [cart, setCart] = useState<Line[]>([]);
  const [sheetDish, setSheetDish] = useState<Dish | null>(null);
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
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(groups[0]?.service.id ?? "");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const subtotal = cart.reduce((s, l) => s + l.unit * l.qty, 0);
  const count = cart.reduce((s, l) => s + l.qty, 0);

  const q = query.trim().toLowerCase();
  const showNav = groups.length > 1 || allDishes.length >= 8;
  const visibleGroups = useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, dishes: g.dishes.filter((d) => d.name.toLowerCase().includes(q) || (d.description ?? "").toLowerCase().includes(q)) }))
      .filter((g) => g.dishes.length > 0);
  }, [groups, q]);
  // Briefly ignore scrollspy right after a tab click so the programmatic scroll
  // doesn't flicker the active tab through intermediate sections.
  const navLock = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const scrollToSection = (id: string) => {
    setActiveId(id);
    navLock.current = Date.now() + 800;
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    // Land the section header just under the sticky bar (measured, so it's exact).
    const barH = barRef.current?.offsetHeight ?? 96;
    const y = window.scrollY + el.getBoundingClientRect().top - barH - 4;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  useEffect(() => {
    if (q || !showNav || checkout) return;
    const els = groups.map((g) => document.getElementById(`sec-${g.service.id}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const seen = new Set<string>();   // all currently-intersecting sections (kept across callbacks)
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const id = e.target.id.replace("sec-", "");
        if (e.isIntersecting) seen.add(id); else seen.delete(id);
      }
      if (Date.now() < navLock.current) return;
      const first = groups.find((g) => seen.has(g.service.id)); // topmost visible, in menu order
      if (first) setActiveId(first.service.id);
    }, { rootMargin: "-120px 0px -68% 0px" });
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [groups, q, showNav, checkout]);

  function addConfigured(dish: Dish, selections: Selection[], qty = 1) {
    const { delta, snapshot } = applySelections(parseOptions(dish.options), selections);
    const unit = Number(dish.price_cad) + delta;
    const key = selectionKey(dish.id, selections);
    setCart((c) => {
      const i = c.findIndex((l) => l.key === key);
      if (i >= 0) { const n = [...c]; n[i] = { ...n[i], qty: n[i].qty + qty }; return n; }
      return [...c, { key, dish, qty, selections, snapshot, unit }];
    });
  }
  function adjust(key: string, delta: number) {
    setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(0, l.qty + delta) } : l)).filter((l) => l.qty > 0));
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
      items: cart.map((l) => ({ dishId: l.dish.id, qty: l.qty, selections: l.selections })),
    });
    setSubmitting(false);
    if (!res.ok) { setErr(res.error || "Something went wrong."); return; }
    router.push(`/${vendor.slug}/order/${res.orderId}`);
  }

  const closed = !vendor.accepting_orders;

  return (
    <main className="min-h-screen bg-white pb-32">
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
          <>
            {showNav && (
              <div ref={barRef} className="sticky top-0 z-30 -mx-4 border-b border-line bg-white px-4 pt-3 shadow-[0_4px_10px_-7px_rgba(42,24,16,0.25)]">
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the menu…" className="w-full rounded-xl bg-panel py-2.5 pl-9 pr-8 text-sm text-ink placeholder:text-ink/40 outline-none focus:ring-2 focus:ring-spice/25" />
                  {query && <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink/40 transition hover:text-ink">✕</button>}
                </div>
                <div className="mt-2 flex gap-5 overflow-x-auto text-sm font-semibold">
                  {groups.map((g) => (
                    <button key={g.service.id} onClick={() => scrollToSection(g.service.id)} className={`whitespace-nowrap border-b-2 pb-2 pt-1 uppercase tracking-wide transition ${activeId === g.service.id ? "border-spice text-ink" : "border-transparent text-ink/45"}`}>{g.service.name}</button>
                  ))}
                </div>
              </div>
            )}

            <section className={showNav ? "mt-4" : "mt-7"}>
              {allDishes.length === 0 && (
                <p className="rounded-2xl bg-white py-12 text-center text-ink/50 shadow-card">No dishes available right now.</p>
              )}
              {allDishes.length > 0 && (
                <div className="flex items-center gap-4 text-xs font-medium text-ink/50">
                  <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke="#3E7A4E" strokeWidth="1.8" /><circle cx="8" cy="8" r="3" fill="#3E7A4E" /></svg> Veg</span>
                  <span className="inline-flex items-center gap-1.5"><svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke="#C0392B" strokeWidth="1.8" /><circle cx="8" cy="8" r="3" fill="#C0392B" /></svg> Non-veg</span>
                </div>
              )}
              {q && visibleGroups.length === 0 && (
                <p className="py-10 text-center text-sm text-ink/45">No dishes match &ldquo;{query}&rdquo;.</p>
              )}
              {visibleGroups.map((g, gi) => (
                <div key={g.service.id} id={`sec-${g.service.id}`} className={`scroll-mt-28 ${gi === 0 ? "pt-3" : "mt-7 border-t-[1.5px] border-[#E6D9C2] pt-6"}`}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-xl font-bold uppercase tracking-wide text-ink">{g.service.name}</h2>
                    {g.service.dates.length > 0 && <span className="rounded-full bg-panel px-2.5 py-0.5 text-xs font-semibold text-ink/60">{formatServiceDates(g.service.dates)}</span>}
                  </div>
                  {g.service.description && <p className="mt-1 text-sm text-ink/50">{g.service.description}</p>}
                  <div className="mt-2">
                    {g.dishes.map((d) => (
                      <div key={d.id} className={`relative flex items-center gap-3 py-3 before:absolute before:left-[4.75rem] before:right-0 before:top-0 before:h-px before:bg-[#F1E9DA] first:before:hidden ${d.is_sold_out ? "opacity-55" : ""}`}>
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-panel ring-1 ring-ink/5">
                          {(d.photo_url || vendor.logo_url) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={d.photo_url || vendor.logo_url || ""} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center"><Logo size={30} /></span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <svg viewBox="0 0 16 16" width="14" height="14" className="shrink-0" aria-label={d.veg ? "Vegetarian" : "Non-vegetarian"}>
                              <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" fill="none" stroke={d.veg ? "#3E7A4E" : "#C0392B"} strokeWidth="1.8" />
                              <circle cx="8" cy="8" r="3" fill={d.veg ? "#3E7A4E" : "#C0392B"} />
                            </svg>
                            <h3 className="truncate font-semibold capitalize text-ink">{d.name}</h3>
                          </div>
                          {d.description && <p className="truncate text-xs text-ink/50">{d.description}</p>}
                          <p className="mt-0.5 text-sm font-semibold text-ink">{hasOptions(d.options) ? "from " : ""}{money(Number(d.price_cad))}</p>
                        </div>
                        {(() => {
                          if (d.is_sold_out) return <span className="shrink-0 rounded-full bg-chili/10 px-3 py-1 text-xs font-semibold text-chili">Sold out</span>;
                          const plain = cart.find((l) => l.key === d.id);
                          const rowQty = cart.filter((l) => l.dish.id === d.id).reduce((s, l) => s + l.qty, 0);
                          if (hasOptions(d.options)) return (
                            <div className="flex shrink-0 items-center gap-2">
                              {rowQty > 0 && <span className="rounded-full bg-spice/15 px-2 py-0.5 text-xs font-semibold text-[#9a5a14]">{rowQty} added</span>}
                              <button disabled={closed} onClick={() => setSheetDish(d)} aria-label={`Add ${d.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-spice text-xl font-bold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-95 disabled:opacity-40">+</button>
                            </div>
                          );
                          return plain ? (
                            <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-spice/12 p-1 ring-1 ring-spice/25">
                              <button onClick={() => adjust(d.id, -1)} aria-label="Remove one" className="grid h-7 w-7 place-items-center rounded-full text-lg font-bold text-spice transition hover:bg-spice/15">−</button>
                              <span className="w-5 text-center text-sm font-semibold tabular-nums">{plain.qty}</span>
                              <button onClick={() => adjust(d.id, +1)} aria-label="Add one" className="grid h-7 w-7 place-items-center rounded-full text-lg font-bold text-spice transition hover:bg-spice/15">+</button>
                            </div>
                          ) : (
                            <button disabled={closed} onClick={() => addConfigured(d, [])} aria-label={`Add ${d.name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-spice text-xl font-bold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-95 disabled:opacity-40">+</button>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          <div className="mt-7 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
              <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-panel/30">
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">Your order</span>
                  <span className="block text-xs text-ink/50">{count} item{count === 1 ? "" : "s"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-lg font-semibold text-ink">{money(subtotal)}</span>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 text-ink/40 transition-transform ${summaryOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </span>
              </button>
              {summaryOpen && (
                <div className="border-t border-line px-4 pb-4 pt-3">
                  {cart.length === 0 ? (
                    <p className="text-sm text-ink/50">Your cart is empty — go back and add a dish.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {cart.map((l) => (
                        <div key={l.key} className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{l.dish.name}</p>
                            {l.snapshot.length > 0 && <p className="truncate text-xs text-ink/55">{snapshotText(l.snapshot)}</p>}
                            <p className="truncate text-xs text-ink/45">{money(l.unit)} each</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 rounded-lg bg-spice/12 p-0.5 ring-1 ring-spice/20">
                            <button type="button" aria-label="Remove one" onClick={() => adjust(l.key, -1)} className="grid h-7 w-7 place-items-center rounded-md text-lg font-bold text-spice transition hover:bg-spice/15">−</button>
                            <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                            <button type="button" aria-label="Add one" onClick={() => adjust(l.key, +1)} className="grid h-7 w-7 place-items-center rounded-md text-lg font-bold text-spice transition hover:bg-spice/15">+</button>
                          </div>
                          <span className="min-w-[4.5rem] shrink-0 whitespace-nowrap text-right text-sm font-semibold text-ink tabular-nums">{money(l.unit * l.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form id="checkout-form" onSubmit={submit} className="space-y-5 rounded-2xl border border-line bg-white p-5 shadow-card">
              <div>
                <SectionLabel>Contact</SectionLabel>
                <div className="space-y-2.5">
                  <IconInput icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>} ariaLabel="Your name" required placeholder="Your name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <div>
                    <div className={`flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 transition focus-within:ring-4 ${touched.phone && errors.phone ? "border-chili focus-within:ring-chili/15" : "border-line focus-within:border-spice focus-within:ring-spice/15"}`}>
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-ink/40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      <input list="country-codes" value={form.country} aria-label="Country code" placeholder="+1" onChange={(e) => setForm({ ...form, country: e.target.value, phone: formatPhoneFor(e.target.value, form.phone) })} className="w-11 shrink-0 bg-transparent text-sm font-medium text-ink/80 outline-none placeholder:text-ink/30" />
                      <datalist id="country-codes">{COUNTRY_CODES.map((c) => <option key={c.name} value={c.code}>{c.name}</option>)}</datalist>
                      <span className="h-5 w-px shrink-0 bg-line" />
                      <input type="tel" inputMode="numeric" placeholder="(613) 555-1234" value={form.phone} onChange={(e) => { const v = formatPhoneFor(form.country, e.target.value); setForm({ ...form, phone: v }); if (touched.phone) setErrors((x) => ({ ...x, phone: validatePhone(form.country, v) })); }} onBlur={() => { setTouched((t) => ({ ...t, phone: true })); setErrors((x) => ({ ...x, phone: validatePhone(form.country, form.phone) })); }} className="w-full bg-transparent text-ink outline-none placeholder:text-ink/40" />
                    </div>
                    {touched.phone && errors.phone && <p className="mt-1 text-sm text-chili">{errors.phone}</p>}
                  </div>
                  <IconInput icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>} ariaLabel="Email (optional)" type="email" placeholder="Email (optional)" value={form.email} onChange={(v) => { setForm({ ...form, email: v }); if (touched.email) setErrors((x) => ({ ...x, email: validateEmail(v) })); }} onBlur={() => { setTouched((t) => ({ ...t, email: true })); setErrors((x) => ({ ...x, email: validateEmail(form.email) })); }} error={touched.email ? errors.email : ""} />
                </div>
              </div>

              <div>
                <SectionLabel>How would you like it?</SectionLabel>
                <div className="flex gap-1 rounded-xl bg-panel p-1">
                  {(["pickup", "delivery"] as Fulfilment[]).map((f) => {
                    const active = form.fulfilment === f;
                    return (
                      <button type="button" key={f} onClick={() => setForm({ ...form, fulfilment: f })} className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold capitalize transition ${active ? "bg-white text-ink shadow-sm" : "text-ink/50 hover:text-ink/70"}`}>
                        {f === "pickup" ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="1.5" /><circle cx="18.5" cy="18.5" r="1.5" /></svg>
                        )}
                        {f}
                      </button>
                    );
                  })}
                </div>
                {form.fulfilment === "delivery" && (
                  <div className="mt-2.5">
                    <IconInput icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>} ariaLabel="Delivery address" required placeholder="Delivery address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                  </div>
                )}
                {noteOpen || form.note ? (
                  <div className="mt-2.5">
                    <IconInput icon={<svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>} ariaLabel="Note for the kitchen" placeholder="Note for the kitchen (optional)" value={form.note} onChange={(v) => setForm({ ...form, note: v })} />
                  </div>
                ) : (
                  <button type="button" onClick={() => setNoteOpen(true)} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#9a5a14] transition hover:brightness-110">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add a note for the kitchen
                  </button>
                )}
              </div>

              <div>
                <SectionLabel>Payment</SectionLabel>
                <div className="space-y-2">
                  {vendor.accept_cash && (
                    <PayRadio active={form.payChoice === "cash"} onClick={() => setForm({ ...form, payChoice: "cash" })} label={form.fulfilment === "delivery" ? "Cash on delivery" : "Cash on pickup"} />
                  )}
                  {vendor.accept_interac && (
                    <PayRadio active={form.payChoice === "interac"} onClick={() => setForm({ ...form, payChoice: "interac" })} label="Interac e-transfer" />
                  )}
                </div>
                {form.payChoice === "interac" && (
                  <p className="mt-2 rounded-xl border border-spice/30 bg-spice/10 px-3.5 py-2.5 text-sm text-ink">{vendor.offline_instructions || "The kitchen will share Interac e-transfer details — please confirm with them."}</p>
                )}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/50">
                  <svg viewBox="0 0 24 24" className="h-[15px] w-[15px] shrink-0 text-curry" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                  You pay the kitchen directly — no card needed.
                </p>
              </div>

              {err && <p className="text-sm font-medium text-chili">{err}</p>}
            </form>
          </div>
        )}
      </div>

      {sheetDish && (
        <DishOptionsSheet dish={sheetDish} onClose={() => setSheetDish(null)} onAdd={(selections, qty) => { addConfigured(sheetDish, selections, qty); setSheetDish(null); }} />
      )}

      <footer className="mt-12 pb-6 text-center">
        <a href="/" className="text-xs font-medium tracking-wide text-ink/30 transition hover:text-ink/50">Powered by Khao</a>
      </footer>

      {count > 0 && !checkout && (
        <div className="fixed inset-x-0 bottom-0 p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-ink px-5 py-3.5 text-cream shadow-pop">
            <span className="font-semibold">{count} item{count > 1 ? "s" : ""} <span className="text-cream/50">·</span> {money(subtotal)}</span>
            <button onClick={() => { setCheckout(true); window.scrollTo({ top: 0 }); }} className="rounded-xl bg-spice px-6 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] active:scale-95">Checkout →</button>
          </div>
        </div>
      )}
      {checkout && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-3">
          <div className="mx-auto flex max-w-2xl items-center gap-2.5 px-1">
            <button type="button" onClick={() => { setCheckout(false); window.scrollTo({ top: 0 }); setActiveId(groups[0]?.service.id ?? ""); }} className="rounded-xl border border-line bg-white px-5 py-3 font-semibold text-ink/60 transition hover:border-ink/25">Back</button>
            <button type="submit" form="checkout-form" disabled={submitting || count === 0} className="flex-1 rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99] disabled:opacity-60">
              {submitting ? <span className="inline-flex items-center justify-center gap-2"><Spinner />Placing…</span> : `Place order · ${money(subtotal)}`}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink/40">{children}</p>;
}

function IconInput({ icon, value, onChange, placeholder, type = "text", required, ariaLabel, error, onBlur }: { icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; ariaLabel?: string; error?: string; onBlur?: () => void }) {
  return (
    <div>
      <div className={`flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-3 transition focus-within:ring-4 ${error ? "border-chili focus-within:ring-chili/15" : "border-line focus-within:border-spice focus-within:ring-spice/15"}`}>
        <span className="shrink-0 text-ink/40">{icon}</span>
        <input type={type} required={required} aria-label={ariaLabel} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} className="w-full bg-transparent text-ink outline-none placeholder:text-ink/40" />
      </div>
      {error && <p className="mt-1 text-sm text-chili">{error}</p>}
    </div>
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

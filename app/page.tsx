import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import HomeNav from "@/components/HomeNav";
import { CustomerMockup, DashboardMockup } from "@/components/ProductMockups";

const STEPS = [
  { n: "1", t: "Build your menu", d: "Add dishes, photos and prices, grouped by service." },
  { n: "2", t: "Share your link", d: "Post it wherever your customers are — a text, social, a group chat." },
  { n: "3", t: "Orders land live", d: "Every order arrives on your dashboard in real time." },
];

const FEATURES = [
  { t: "Your own ordering page", d: "A clean menu page at your own link — no app for customers to install." },
  { t: "Live order dashboard", d: "Orders appear the moment they're placed, with an auto prep list and daily totals." },
  { t: "Menus by service", d: "Run weekday lunch, weekend specials and evening snacks — each with its own menu and days." },
  { t: "You keep payment & delivery", d: "Cash or Interac, pickup or delivery — handled your way. Khao never touches the money." },
  { t: "Sold-out in one tap", d: "Mark a dish sold out and it updates on every customer's screen instantly." },
  { t: "Reports you can export", d: "Every order with customer details, totals and payment status — filter and download as CSV." },
];

const PRO_PERKS: [string, string][] = [
  ["Weekly plans & subscriptions", "Let customers subscribe to recurring weekly meal plans — orders on autopilot."],
  ["SMS confirmations", "Auto-text customers the moment their order is confirmed."],
  ["Email receipts", "Branded order confirmations sent automatically."],
  ["“Order ready” alerts", "Ping customers by text when it’s ready for pickup."],
  ["Custom branding", "Your logo and colors — remove “Powered by Khao.”"],
  ["Promo codes", "Run discounts and repeat-customer offers."],
  ["Priority support", "Fast, hands-on help whenever you need it."],
];

const FAQ = [
  { q: "How do customers pay?", a: "Directly to you — cash on pickup/delivery or Interac e-transfer. You choose which methods to accept. Card payments are available on Pro." },
  { q: "Do you handle delivery?", a: "No. You arrange pickup or delivery yourself, exactly as you do today. Khao just organises the orders." },
  { q: "What do customers need to do?", a: "Just open your link and order — no account, no app. They enter their name and contact details and you're notified." },
  { q: "How do I get started?", a: "Create your kitchen account, add your menu, and share your link. It takes a few minutes." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <HomeNav />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-[-140px] h-[440px] w-[620px] -translate-x-1/2 rounded-full bg-spice/[0.07]" />
        <div className="relative mx-auto max-w-3xl px-6 pt-9 text-center sm:pt-11">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-spice">Online ordering for home &amp; cloud kitchens</p>
          <h1 className="mx-auto mt-3.5 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl">
            Orders lost in the <span className="text-spice">chat</span> again?
          </h1>
          <p className="mx-auto mt-3.5 max-w-lg text-base leading-relaxed text-cream/75 sm:text-lg">
            One ordering link for your kitchen — customers order, and every order lands on your live dashboard.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/login?mode=signup" className="rounded-xl bg-spice px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">Get your kitchen online</Link>
            <a href="#how" className="rounded-xl border border-white/25 px-5 py-3.5 text-sm font-semibold text-cream/90 transition hover:border-white/40 hover:bg-white/5">See how it works</a>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-cream/60">
            <span className="inline-flex items-center gap-1.5"><Tick /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><Tick /> No commission</span>
            <span className="inline-flex items-center gap-1.5"><Tick /> No app for customers</span>
          </div>
        </div>

        {/* device duo */}
        <div className="relative mx-auto mt-12 w-full max-w-xl px-6 pb-16 sm:mt-16 sm:pb-20">
          <div className="relative">
            <div className="ml-auto w-[85%]">
              <DashboardMockup className="w-full" />
            </div>
            <div className="absolute bottom-0 left-0 w-[21%] max-w-[124px] drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)]">
              <CustomerMockup className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="bg-cream text-ink">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B06D1A]">How it works</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Up and running in minutes</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-line bg-white p-6 shadow-card">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-spice/15 font-display text-lg font-bold text-[#B06D1A]">{s.n}</div>
                <h3 className="mt-4 font-semibold text-ink">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/55">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DASHBOARD SHOWCASE ===== */}
      <section className="bg-panel text-ink">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B06D1A]">Your dashboard</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Every order in one place, live</h2>
            <p className="mt-3 leading-relaxed text-ink/60">Orders appear the moment they&rsquo;re placed — with totals, payment status and one-tap actions. Run the rush from your laptop or your phone.</p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl">
            <DashboardMockup className="w-full" />
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="bg-ink">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-spice">Built for kitchens</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to take orders</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold text-cream">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING (Free vs Pro) ===== */}
      <section id="pricing" className="bg-ink">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-spice">Pricing</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Start free. Grow with Pro.</h2>
            <p className="mx-auto mt-3 max-w-lg leading-relaxed text-cream/65">Free already solves the daily grind — your ordering page and live dashboard, with no commission. Pro adds the tools to take your kitchen to the next level.</p>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-5 md:grid-cols-2 md:items-stretch">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-7">
              <span className="inline-flex w-fit rounded-full bg-spice/15 px-3 py-1 text-xs font-semibold text-spice">Free during early access</span>
              <p className="mt-4 font-display text-4xl font-bold">Free <span className="text-base font-semibold text-cream/45">to use</span></p>
              <p className="mt-2 text-sm leading-relaxed text-cream/60">Everything you need to take orders — and it already solves your biggest headaches.</p>
              <ul className="mt-5 space-y-2.5 text-sm text-cream/80">
                {["Your own ordering page", "Live order dashboard", "Menus by service", "Unlimited orders", "No commission, ever"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><Tick /> {t}</li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <Link href="/login?mode=signup" className="block rounded-xl bg-spice px-5 py-3 text-center font-semibold text-ink transition hover:brightness-[1.04] active:scale-[.99]">Start free</Link>
                <p className="mt-3 text-center text-xs text-cream/40">No card required.</p>
              </div>
            </div>
            {/* Pro */}
            <div className="relative flex flex-col rounded-2xl border-2 border-spice/55 bg-spice/[0.06] p-7">
              <span className="absolute -top-3 left-7 rounded-full bg-spice px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">For growth</span>
              <span className="inline-flex w-fit rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-spice">Khao Pro</span>
              <p className="mt-4 font-display text-4xl font-bold">Pro</p>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">Everything in Free, plus the tools to take your business to the next level.</p>
              <ul className="mt-5 space-y-2.5 text-sm text-cream/85">
                {["Analytics & insights", "Card payments at checkout", "Weekly plans & subscriptions", "SMS & email confirmations", "Custom branding", "Priority support"].map((t) => (
                  <li key={t} className="flex items-center gap-2.5"><Tick /> {t}</li>
                ))}
              </ul>
              <div className="mt-auto pt-7">
                <a href="#contact" className="block rounded-xl border border-spice/60 px-5 py-3 text-center font-semibold text-cream transition hover:bg-spice/10">I&rsquo;m interested</a>
                <p className="mt-3 text-center text-xs text-cream/40">Pricing announced soon.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== A CLOSER LOOK AT PRO ===== */}
      <section className="border-t border-line bg-cream text-ink">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B06D1A]">A closer look at Pro</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Tools to take it to the next level</h2>
            <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink/60">Your free tier runs the day. Pro helps you understand and grow it.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-spice/15"><IconChart /></span>
                <span className="font-semibold text-ink">Analytics</span>
                <span className="ml-auto rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-spice">Pro</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">Best sellers, busy days, repeat customers and revenue trends — know what&rsquo;s working and double down.</p>
              <div className="mt-4 flex h-10 items-end gap-1.5">
                {[42, 60, 50, 78, 100].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i >= 3 ? "#E0922F" : "#EAC58C" }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-spice/15"><IconCard /></span>
                <span className="font-semibold text-ink">Card payments</span>
                <span className="ml-auto rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-spice">Pro</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">Let customers pay by card at checkout — funds go straight to you via Stripe. Fewer no-shows, faster pickups.</p>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-xs text-ink/60">
                <IconCard /> Pay by card · •••• 4242 <span className="ml-auto font-bold text-curry">Paid</span>
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-ink/40">And more with Pro</span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_PERKS.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-spice/15 text-[#B06D1A]"><Tick /></span>
                  <span className="text-sm font-semibold text-ink">{t}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink/55">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="bg-ink">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight">Questions</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="font-semibold text-cream">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CONTACT ===== */}
      <section id="contact" className="bg-ink">
        <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight">Get in touch</h2>
          <p className="mt-2 max-w-xl text-cream/70">Questions, or want your kitchen on Khao? Send us a note and we&rsquo;ll get back to you.</p>
          <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <ContactForm />
          </div>
          <p className="mt-10 text-sm text-cream/45">Are you a customer? Open the link your kitchen shared with you to order.</p>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-ink">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-sm text-cream/50">
          <span className="font-display text-lg font-bold tracking-tight text-spice">Khao</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
            <Link href="/terms" className="transition hover:text-cream">Terms</Link>
          </div>
          <span className="text-cream/35">© {new Date().getFullYear()} Khao</span>
        </div>
      </footer>
    </main>
  );
}

function Tick() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-spice" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}
function IconChart() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#E0922F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m7 14 3-3 3 2 4-5" /></svg>;
}
function IconCard() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#E0922F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>;
}

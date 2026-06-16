import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import HomeNav from "@/components/HomeNav";

const STEPS = [
  { n: "01", t: "Build your menu", d: "Add dishes, photos and prices, grouped by service." },
  { n: "02", t: "Share your link", d: "Drop your Khao link in your WhatsApp channel." },
  { n: "03", t: "Orders land live", d: "Every order arrives on your dashboard in real time." },
];

const FEATURES = [
  { t: "Your own ordering page", d: "A clean menu page at your own link — no app for customers to install." },
  { t: "Live order dashboard", d: "Orders appear the moment they're placed, with an auto prep list and daily totals." },
  { t: "Menus by service", d: "Run weekday lunch, weekend specials and evening snacks — each with its own menu and days." },
  { t: "You keep payment & delivery", d: "Cash or Interac, pickup or delivery — handled your way. Khao never touches the money." },
  { t: "Sold-out in one tap", d: "Mark a dish sold out and it updates on every customer's screen instantly." },
  { t: "Reports you can export", d: "Every order with customer details, totals and payment status — filter and download as CSV." },
];

const FAQ = [
  { q: "How do customers pay?", a: "Directly to you — cash on pickup/delivery or Interac e-transfer. You choose which methods to accept." },
  { q: "Do you handle delivery?", a: "No. You arrange pickup or delivery yourself, exactly as you do today. Khao just organises the orders." },
  { q: "What do customers need to do?", a: "Just open your link and order — no account, no app. They enter their name and contact details and you're notified." },
  { q: "How do I get started?", a: "Create your kitchen account, add your menu, and share your link. It takes a few minutes." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-clip bg-ink text-cream">
      <HomeNav />
      <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-spice/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-chili/12 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 pb-20 pt-14">
        <h1 className="mt-8 max-w-2xl font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
          Take food orders without the WhatsApp chaos.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
          Khao gives your home kitchen its own ordering page. Share the link in your WhatsApp
          channel — customers pick what they want, fill in their details, and every order lands
          on your live dashboard. No more counting messages.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Link href="/login?mode=signup" className="rounded-xl bg-spice px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">
            Get your kitchen online
          </Link>
          <Link href="/login" className="text-sm font-medium text-cream/70 transition hover:text-cream">
            Already a vendor? Sign in →
          </Link>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="font-display text-2xl font-bold text-spice">{s.n}</span>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-cream/60">{s.d}</p>
            </div>
          ))}
        </div>

        <section id="features" className="mt-24 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Everything your kitchen needs</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="font-semibold text-cream">{f.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-cream/60">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mt-24 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Simple, honest pricing</h2>
          <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-spice/40 bg-white/[0.03] p-6">
              <span className="inline-block rounded-full bg-spice/15 px-3 py-1 text-xs font-semibold text-spice">Early access</span>
              <p className="mt-4 font-display text-4xl font-bold">Free <span className="text-lg font-semibold text-cream/50">to start</span></p>
              <p className="mt-3 text-sm leading-relaxed text-cream/70">
                We're onboarding our first Ottawa kitchens free while we get going. No commission on
                orders — ever. A simple flat monthly fee per kitchen comes at launch.
              </p>
              <Link href="/login?mode=signup" className="mt-5 inline-block rounded-xl bg-spice px-5 py-2.5 font-semibold text-ink transition hover:brightness-[1.04] active:scale-[.99]">
                Start free
              </Link>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cream/60">Coming soon</span>
              <p className="mt-4 font-display text-4xl font-bold text-cream/90">Pro</p>
              <p className="mt-3 text-sm leading-relaxed text-cream/60">
                More power as you grow. Everything in the free plan, plus:
              </p>
              <ul className="mt-3 space-y-1.5 text-sm text-cream/70">
                <li>Online card payments</li>
                <li>Multiple kitchens &amp; locations</li>
                <li>Featured placement &amp; promotions</li>
                <li>Advanced analytics</li>
                <li>Your own custom domain</li>
              </ul>
              <a href="#contact" className="mt-5 inline-block rounded-xl border border-white/20 px-5 py-2.5 font-semibold text-cream/80 transition hover:bg-white/5">
                Get notified
              </a>
            </div>
          </div>
        </section>

        <section id="faq" className="mt-24 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Questions</h2>
          <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
            {FAQ.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="font-semibold text-cream">{f.q}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-24 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Get in touch</h2>
          <p className="mt-2 max-w-xl text-cream/70">Questions, or want your kitchen on Khao? Send us a note and we&rsquo;ll get back to you.</p>
          <div className="mt-6 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <ContactForm />
          </div>
        </section>

        <p className="mt-16 text-sm text-cream/45">
          Are you a customer? Open the link your kitchen shared with you to order.
        </p>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-cream/50">
          <span className="font-display text-lg font-bold tracking-tight text-spice">Khao</span>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/privacy" className="transition hover:text-cream">Privacy</Link>
            <Link href="/terms" className="transition hover:text-cream">Terms</Link>
          </div>
          <span className="text-cream/35">© {new Date().getFullYear()} Khao</span>
        </footer>
      </div>
    </main>
  );
}

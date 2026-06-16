import Link from "next/link";

const STEPS = [
  { n: "01", t: "Build your menu", d: "Add dishes, photos and prices, grouped by service." },
  { n: "02", t: "Share your link", d: "Drop your Khao link in your WhatsApp channel." },
  { n: "03", t: "Orders land live", d: "Every order arrives on your dashboard in real time." },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-cream">
      <div className="pointer-events-none absolute -right-24 -top-28 h-96 w-96 rounded-full bg-spice/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-chili/12 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 py-24">
        <span className="font-display text-3xl font-bold tracking-tight text-spice">Khao</span>

        <h1 className="mt-8 max-w-2xl font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
          Take food orders without the WhatsApp chaos.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream/75">
          Khao gives your home kitchen its own ordering page. Share the link in your WhatsApp
          channel — customers pick what they want, fill in their details, and every order lands
          on your live dashboard. No more counting messages.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Link href="/login" className="rounded-xl bg-spice px-6 py-3.5 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">
            Get your kitchen online
          </Link>
          <Link href="/login" className="text-sm font-medium text-cream/70 transition hover:text-cream">
            Already a vendor? Sign in →
          </Link>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <span className="font-display text-2xl font-semibold text-spice">{s.n}</span>
              <h3 className="mt-2 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm leading-relaxed text-cream/60">{s.d}</p>
            </div>
          ))}
        </div>

        <p className="mt-16 text-sm text-cream/45">
          Are you a customer? Open the link your kitchen shared with you to order.
        </p>
      </div>
    </main>
  );
}

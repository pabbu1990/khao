import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink text-cream">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-spice font-semibold tracking-[0.3em] text-xs">KHAO</p>
        <h1 className="mt-4 font-display text-5xl font-bold">
          Take food orders without the WhatsApp chaos.
        </h1>
        <p className="mt-5 text-lg text-cream/80 leading-relaxed">
          Khao gives your home kitchen its own ordering page. Share the link in your
          WhatsApp channel — customers pick what they want, fill in their details,
          and every order lands on your live dashboard. No more counting messages.
        </p>
        <div className="mt-10 flex items-center gap-5">
          <Link
            href="/login"
            className="rounded-lg bg-spice px-6 py-3 font-semibold text-ink hover:opacity-90"
          >
            Get your kitchen online
          </Link>
          <Link href="/login" className="text-sm font-medium text-cream/70 hover:text-cream">
            Already a vendor? Sign in →
          </Link>
        </div>
        <p className="mt-16 text-sm text-cream/50">
          Are you a customer? Open the link your kitchen shared with you to order.
        </p>
      </div>
    </main>
  );
}

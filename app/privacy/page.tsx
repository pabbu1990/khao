import Link from "next/link";

export const metadata = { title: "Privacy Policy — Khao" };

export default function Privacy() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-line px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-spice">Khao</Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 leading-relaxed text-ink/80">
          <p>Khao (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides software that lets home kitchens publish a menu and receive orders. This policy explains what information we collect and how we use it.</p>

          <Section title="Information we collect">
            <p><strong>Vendor accounts.</strong> When you create a kitchen account we collect your email address, name, and the kitchen details you enter (name, area, hours, menu, payment instructions). If you sign in with Google, we receive your name and email from Google.</p>
            <p className="mt-3"><strong>Customer orders.</strong> Customers do not create accounts. When someone places an order we collect the details they enter — name, phone number, email (optional), delivery address (for delivery), and the items ordered — so the order can be passed to the kitchen.</p>
            <p className="mt-3"><strong>Technical data.</strong> Basic logs and session cookies needed to keep you signed in and to operate the service.</p>
          </Section>

          <Section title="How we use information">
            <p>We use it to operate Khao: to create your kitchen&rsquo;s ordering page, to route each order to the correct kitchen, to show vendors their orders, and to provide support. We do not sell your information.</p>
          </Section>

          <Section title="Who we share it with">
            <p>An order&rsquo;s details are shared with the kitchen you ordered from, so it can prepare and fulfil the order. We use trusted service providers to run Khao — including Supabase (database and authentication), Vercel (hosting), and Google (sign-in) — who process data on our behalf.</p>
          </Section>

          <Section title="Payments">
            <p>Payments are made directly between the customer and the kitchen (for example cash or Interac e-transfer). Khao does not process or store card or banking details.</p>
          </Section>

          <Section title="Data retention">
            <p>We keep account and order information for as long as your account is active or as needed to operate the service and meet legal obligations. You can ask us to delete your account and associated data.</p>
          </Section>

          <Section title="Your choices">
            <p>You may request access to, correction of, or deletion of your personal information by contacting us. Customers who want an order record removed can contact the kitchen or us.</p>
          </Section>

          <Section title="Children">
            <p>Khao is not directed to children and is intended for use by adults operating or ordering from home kitchens.</p>
          </Section>

          <Section title="Changes">
            <p>We may update this policy from time to time. Material changes will be reflected by updating the date above.</p>
          </Section>

          <Section title="Contact">
            <p>Questions about this policy? reach out to us and we&rsquo;ll respond as soon as we can.</p>
          </Section>
        </div>

        <p className="mt-12 text-sm text-ink/40">
          <Link href="/terms" className="underline">Terms of Service</Link> · <Link href="/" className="underline">Home</Link>
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

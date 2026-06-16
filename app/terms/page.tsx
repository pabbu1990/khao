import Link from "next/link";

export const metadata = { title: "Terms of Service — Khao" };

export default function Terms() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="border-b border-line px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-spice">Khao</Link>
      </header>
      <article className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 leading-relaxed text-ink/80">
          <p>These terms govern your use of Khao. By creating an account or using the service, you agree to them.</p>

          <Section title="What Khao is">
            <p>Khao is a software tool that lets independent home kitchens publish a menu and receive orders online. Khao is <strong>not</strong> a restaurant, food provider, courier, or payment processor. We do not prepare food, deliver orders, or handle payments.</p>
          </Section>

          <Section title="Vendor accounts and responsibilities">
            <p>If you operate a kitchen on Khao, you are an independent business and you are responsible for: complying with all applicable food-safety laws, licensing and local regulations; the quality and safety of your food; providing accurate menu, pricing and allergen information; fulfilling orders; collecting payment; and arranging pickup or delivery. You are responsible for keeping your account secure.</p>
          </Section>

          <Section title="Orders and customers">
            <p>An order placed through Khao is an agreement between the customer and the kitchen — not with Khao. Any issues with an order, including food quality, payment, or delivery, are between the customer and the kitchen.</p>
          </Section>

          <Section title="Payments">
            <p>Payments are arranged directly between customer and kitchen. Khao does not collect, hold, or process payment on anyone&rsquo;s behalf.</p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to misuse the service, including by posting unlawful content, infringing others&rsquo; rights, or attempting to disrupt or gain unauthorised access to the platform.</p>
          </Section>

          <Section title="Disclaimers">
            <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind. Khao does not guarantee uninterrupted or error-free operation and is not responsible for food, orders, payments, or delivery arranged through it.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>To the maximum extent permitted by law, Khao is not liable for any indirect, incidental, or consequential damages, or for any matter relating to food, orders, payments, or delivery between customers and kitchens.</p>
          </Section>

          <Section title="Termination">
            <p>We may suspend or terminate accounts that violate these terms. You may stop using the service at any time.</p>
          </Section>

          <Section title="Governing law">
            <p>These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable there.</p>
          </Section>

          <Section title="Changes">
            <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>
          </Section>

          <Section title="Contact">
            <p>Questions? reach out to us and we&rsquo;ll respond as soon as we can.</p>
          </Section>
        </div>

        <p className="mt-12 text-sm text-ink/40">
          <Link href="/privacy" className="underline">Privacy Policy</Link> · <Link href="/" className="underline">Home</Link>
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

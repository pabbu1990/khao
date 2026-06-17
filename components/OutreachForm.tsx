"use client";

import { useState } from "react";
import Spinner from "@/components/Spinner";
import { sendOutreach } from "@/app/actions";

type Result = { ok: boolean; sent?: number; failed?: number; invalid?: string[]; error?: string };

export default function OutreachForm() {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("Quick idea for your kitchen's orders");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run(mode: "test" | "send") {
    if (mode === "send") {
      const n = recipients.split(/\n+/).map((l) => l.trim()).filter(Boolean).length;
      if (!confirm(`Send this email from hello@thekhao.com to ${n} recipient(s)? Send one-at-a-time to people who'd reasonably expect to hear from you (CASL).`)) return;
    }
    setBusy(mode);
    setResult(null);
    const fd = new FormData();
    fd.set("recipients", recipients);
    fd.set("subject", subject);
    fd.set("mode", mode);
    const res = await sendOutreach(fd);
    setBusy(null);
    setResult(res);
  }

  return (
    <div className="text-ink">
      <p className="text-sm text-ink/55">Sends the Khao intro email (one message per recipient) from hello@thekhao.com. Send a test to yourself first.</p>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm" />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-semibold uppercase tracking-[0.06em] text-ink/45">Recipients — one per line</span>
        <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} rows={5} placeholder={"Spice Divine <owner@example.com>\nanother@example.com"} className="mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 font-mono text-sm" />
        <span className="mt-1 block text-xs text-ink/40">Accepts &ldquo;Name &lt;email&gt;&rdquo; or just an email. If a name is given, the email greets them by name.</span>
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => run("test")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-ink/5 disabled:opacity-60">
          {busy === "test" ? <><Spinner />Sending test…</> : "Send test to me"}
        </button>
        <button onClick={() => run("send")} disabled={busy !== null || !recipients.trim()} className="inline-flex items-center gap-2 rounded-lg bg-spice px-4 py-2 text-sm font-semibold text-ink transition hover:brightness-[1.04] disabled:opacity-60">
          {busy === "send" ? <><Spinner />Sending…</> : "Send to list"}
        </button>
      </div>

      {result && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-curry/10 text-curry" : "bg-chili/10 text-chili"}`}>
          {result.ok
            ? `Sent ${result.sent ?? 0}${result.failed ? `, ${result.failed} failed` : ""}.${result.invalid && result.invalid.length ? ` Skipped invalid: ${result.invalid.join(", ")}` : ""}`
            : result.error}
        </div>
      )}

      <p className="mt-3 text-xs text-ink/40">Heads up: only email people who&rsquo;d reasonably expect to hear from you, keep volume low, and the email already includes an unsubscribe line + mailing address (CASL). Cold blasting can hurt thekhao.com deliverability.</p>
    </div>
  );
}

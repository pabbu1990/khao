"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = { id: string; name: string; total: number };

// Subscribes to this vendor's orders: refreshes the server component on any change,
// and fires a subtle chime + highlight toast when a NEW order lands.
export default function RealtimeRefresher({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [toast, setToast] = useState<Toast | null>(null);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore mute preference.
  useEffect(() => {
    setMuted(typeof window !== "undefined" && localStorage.getItem("khao_sound_muted") === "1");
  }, []);

  // Unlock audio on the first user interaction (browser autoplay policy).
  useEffect(() => {
    const unlock = () => {
      if (!audioRef.current) {
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioRef.current = new Ctx();
        } catch { /* no audio available */ }
      }
      audioRef.current?.resume().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const chime = useCallback(() => {
    const ctx = audioRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    // Two gentle ascending notes (A5 -> E6) with a soft bell-like decay.
    [
      { f: 880, t: 0 },
      { f: 1318.5, t: 0.16 },
    ].forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.18, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.55);
    });
  }, []);

  const flashTitle = useCallback((name: string) => {
    if (typeof document === "undefined" || !document.hidden) return;
    const original = document.title;
    let on = true;
    const iv = setInterval(() => {
      document.title = on ? `🔔 New order — ${name}` : original;
      on = !on;
    }, 1000);
    const stop = () => {
      clearInterval(iv);
      document.title = original;
      document.removeEventListener("visibilitychange", stop);
    };
    document.addEventListener("visibilitychange", stop);
    setTimeout(stop, 20000);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`orders-${vendorId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` },
        (payload) => {
          const row = payload.new as { id: string; customer_name?: string; subtotal_cad?: number };
          const t: Toast = { id: row.id, name: row.customer_name || "New customer", total: Number(row.subtotal_cad || 0) };
          setToast(t);
          if (!(typeof window !== "undefined" && localStorage.getItem("khao_sound_muted") === "1")) chime();
          flashTitle(t.name);
          if (dismissRef.current) clearTimeout(dismissRef.current);
          dismissRef.current = setTimeout(() => setToast(null), 8000);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `vendor_id=eq.${vendorId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, [vendorId, router, chime, flashTitle]);

  function toggleMute() {
    setMuted((m) => {
      const next = !m;
      localStorage.setItem("khao_sound_muted", next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      {/* Sound toggle — always available, top-right of the dashboard area */}
      <button
        onClick={toggleMute}
        title={muted ? "New-order sound is off" : "New-order sound is on"}
        className="fixed right-4 top-20 z-40 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink/60 shadow-card transition hover:text-ink"
        aria-label={muted ? "Unmute new-order sound" : "Mute new-order sound"}
      >
        {muted ? "🔕" : "🔔"}
      </button>

      {toast && (
        <button
          onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setToast(null); }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border-2 border-spice bg-white px-5 py-4 text-left shadow-pop khao-toast-in"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-spice/15 text-xl">🔔</span>
          <span>
            <span className="block font-display text-base font-bold text-ink">New order</span>
            <span className="block text-sm text-ink/60">
              {toast.name}
              {toast.total > 0 && <> · ${toast.total.toFixed(2)}</>}
            </span>
          </span>
        </button>
      )}

      <style>{`
        @keyframes khaoToastIn {
          0% { opacity: 0; transform: translateY(12px) scale(.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .khao-toast-in { animation: khaoToastIn .28s cubic-bezier(.16,1,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .khao-toast-in { animation: none; } }
      `}</style>
    </>
  );
}

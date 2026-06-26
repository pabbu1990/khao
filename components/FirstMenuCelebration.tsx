"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Celebration modal shown once, right after a vendor creates their FIRST menu.
// URL-driven (rendered by the menu page when ?firstmenu=... is present), so it
// survives the re-render when onboarding leaves first-run mode. Self-cleans the
// URL on close. Confetti is hand-rolled on a canvas — no dependency.
export default function FirstMenuCelebration({ menuName }: { menuName: string }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const close = () => router.replace("/dashboard/menu");
  const addDishes = () => {
    router.replace("/dashboard/menu");
    setTimeout(() => document.getElementById("add-dish")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };

  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") router.replace("/dashboard/menu"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => { canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const colors = ["#E0922F", "#3E7A4E", "#C0392B", "#2A1810"];
    const cx = innerWidth / 2, cy = innerHeight / 2 - 70;
    const parts = Array.from({ length: 100 }, () => {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 7.5;
      return { x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4, g: 0.16 + Math.random() * 0.14, w: 5 + Math.random() * 5, h: 8 + Math.random() * 7, rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.32, c: colors[(Math.random() * colors.length) | 0] };
    });
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const el = t - start;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      const life = Math.max(0, 1 - el / 1700);
      for (const p of parts) {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = life; ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (el < 1800) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, innerWidth, innerHeight);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-labelledby="fmc-title">
      <button aria-label="Close" tabIndex={-1} onClick={close} className="absolute inset-0 cursor-default bg-ink/50" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-pop">
        <button onClick={close} aria-label="Close" className="absolute right-4 top-4 text-lg text-ink/30 transition hover:text-ink">✕</button>

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-curry/12">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-curry text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </span>
        </div>

        <h2 id="fmc-title" className="mt-4 font-display text-2xl font-bold text-ink">Your first menu is ready!</h2>
        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-panel px-3 py-1 text-sm font-semibold text-ink/70">
          <span className="h-1.5 w-1.5 rounded-full bg-spice" /> {menuName}
        </span>
        <p className="mt-3.5 text-sm leading-relaxed text-ink/60">Now add the dishes customers can order from it — add as many as you like. You can change prices, photos, and availability anytime.</p>

        <button ref={btnRef} onClick={addDishes} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-spice px-4 py-3 font-semibold text-ink shadow-sm transition hover:brightness-[1.04] active:scale-[.99]">
          Add dishes
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
        <button onClick={close} className="mt-3 text-sm font-medium text-ink/45 transition hover:text-ink">I&rsquo;ll do it later</button>
      </div>
    </div>
  );
}

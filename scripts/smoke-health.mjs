#!/usr/bin/env node
// Read-only health smoke test. Safe to run against production (thekhao.com).
// Makes NO writes. Verifies the site, Supabase connectivity, RLS safety, and a
// known storefront render. Exits non-zero if any critical check fails.
//
//   SMOKE_BASE_URL=https://thekhao.com \
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
//   SMOKE_VENDOR_SLUG=sams-kitchen \
//   npm run smoke:health
//
// Env is also auto-loaded from .env.local if present.

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- tiny .env loader (no dependency) ---
for (const f of [".env.local", ".env"]) {
  if (existsSync(f)) {
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

const BASE = (process.env.SMOKE_BASE_URL || "https://thekhao.com").replace(/\/+$/, "");
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SLUG = process.env.SMOKE_VENDOR_SLUG; // optional

let pass = 0, fail = 0, warn = 0;
const ok = (m) => { console.log(`  \x1b[32m✓\x1b[0m ${m}`); pass++; };
const bad = (m) => { console.log(`  \x1b[31m✗ ${m}\x1b[0m`); fail++; };
const wrn = (m) => { console.log(`  \x1b[33m! ${m}\x1b[0m`); warn++; };
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

async function get(path) {
  try {
    const r = await fetch(BASE + path, { redirect: "follow" });
    const body = await r.text();
    return { status: r.status, body };
  } catch (e) {
    return { status: 0, body: String(e) };
  }
}

(async () => {
  console.log(`\nKhao health smoke · ${BASE}`);

  section("Site");
  const home = await get("/");
  home.status === 200 ? ok(`GET / → 200`) : bad(`GET / → ${home.status}`);

  const robots = await get("/robots.txt");
  robots.status === 200 && /Sitemap/i.test(robots.body) ? ok("robots.txt served with Sitemap") : bad(`robots.txt → ${robots.status}`);

  const sitemap = await get("/sitemap.xml");
  sitemap.status === 200 ? ok("sitemap.xml served") : bad(`sitemap.xml → ${sitemap.status}`);

  const notFound = await get("/this-slug-should-not-exist-zzz");
  notFound.status === 404 ? ok("unknown storefront → 404") : wrn(`unknown storefront → ${notFound.status} (expected 404)`);

  if (SLUG) {
    const store = await get(`/${SLUG}`);
    if (store.status === 200 && /Powered by Khao/i.test(store.body)) ok(`storefront /${SLUG} renders`);
    else bad(`storefront /${SLUG} → ${store.status}`);
  } else {
    wrn("SMOKE_VENDOR_SLUG not set — skipping storefront render check");
  }

  section("Supabase");
  if (!SB_URL || !SB_ANON) {
    bad("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY not set — cannot test Supabase");
  } else {
    const sb = createClient(SB_URL, SB_ANON, { auth: { persistSession: false } });

    // anon can read active vendors (public storefront data)
    const v = await sb.from("vendors").select("id,slug,status").eq("status", "active").limit(5);
    if (v.error) bad(`anon read vendors errored: ${v.error.message}`);
    else { ok(`anon can read active vendors (${v.data.length} found)`); if (v.data.length === 0) wrn("no active vendors yet"); }

    // anon can read active dishes
    const d = await sb.from("dishes").select("id").eq("is_active", true).limit(1);
    d.error ? bad(`anon read dishes errored: ${d.error.message}`) : ok("anon can read active dishes");

    // RLS safety: anon must NOT be able to read orders (customer PII)
    const o = await sb.from("orders").select("id").limit(1);
    if (o.error) ok(`orders protected from anon (RLS: ${o.error.code || "blocked"})`);
    else if ((o.data?.length ?? 0) === 0) ok("orders return no rows to anon (RLS ok)");
    else bad(`RLS LEAK: anon read ${o.data.length} order row(s) — orders must be private!`);
  }

  section("Result");
  console.log(`  ${pass} passed · ${warn} warnings · ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
})();

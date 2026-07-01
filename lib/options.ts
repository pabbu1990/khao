// Dish options / modifiers — shared model + helpers.
// Stored on dishes.options (jsonb) and frozen onto order_items.options_snapshot (jsonb).

export interface OptionChoice {
  id: string;
  label: string;
  price: number; // CAD delta, can be 0
}

export interface OptionGroup {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  max: number | null; // for multi; null = unlimited
  choices: OptionChoice[];
}

// What the customer sends per cart line.
export interface Selection {
  groupId: string;
  choiceIds: string[];
}

// Frozen onto the order item for display + records.
export interface SelectedOption {
  group: string;
  label: string;
  price: number;
}

export function genId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Safely parse dishes.options (unknown jsonb) into a clean OptionGroup[].
export function parseOptions(raw: unknown): OptionGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: OptionGroup[] = [];
  for (const g of raw) {
    if (!g || typeof g !== "object") continue;
    const gg = g as Record<string, unknown>;
    const choicesRaw = Array.isArray(gg.choices) ? gg.choices : [];
    const choices: OptionChoice[] = [];
    for (const c of choicesRaw) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const label = String(cc.label ?? "").trim();
      if (!label) continue;
      choices.push({ id: String(cc.id ?? genId()), label, price: num(cc.price) });
    }
    const name = String(gg.name ?? "").trim();
    if (!name || choices.length === 0) continue;
    out.push({
      id: String(gg.id ?? genId()),
      name,
      type: gg.type === "multi" ? "multi" : "single",
      required: gg.required === true,
      max: gg.max == null ? null : Math.max(1, Math.floor(num(gg.max))),
      choices,
    });
  }
  return out;
}

// Clean groups before saving (drop empties, ensure ids). Returns plain JSON-able array.
export function normalizeForSave(groups: OptionGroup[]): OptionGroup[] {
  return parseOptions(groups);
}

export function hasOptions(raw: unknown): boolean {
  return parseOptions(raw).length > 0;
}

// Compute price delta + frozen snapshot from selections against authoritative groups.
export function applySelections(groups: OptionGroup[], selections: Selection[]): { delta: number; snapshot: SelectedOption[] } {
  let delta = 0;
  const snapshot: SelectedOption[] = [];
  for (const sel of selections) {
    const g = groups.find((x) => x.id === sel.groupId);
    if (!g) continue;
    for (const cid of sel.choiceIds) {
      const c = g.choices.find((x) => x.id === cid);
      if (!c) continue;
      delta += Number(c.price) || 0;
      snapshot.push({ group: g.name, label: c.label, price: Number(c.price) || 0 });
    }
  }
  return { delta, snapshot };
}

// Client-side validation; returns an error string or null.
export function validateSelections(groups: OptionGroup[], selections: Selection[]): string | null {
  for (const g of groups) {
    const sel = selections.find((s) => s.groupId === g.id);
    const n = sel ? sel.choiceIds.length : 0;
    if (g.required && n < 1) return `Choose ${g.name.toLowerCase()}.`;
    if (g.type === "single" && n > 1) return `Pick one ${g.name.toLowerCase()}.`;
    if (g.type === "multi" && g.max != null && n > g.max) return `Pick up to ${g.max} for ${g.name.toLowerCase()}.`;
  }
  return null;
}

// Parse options_snapshot for display.
export function parseSnapshot(raw: unknown): SelectedOption[] {
  if (!Array.isArray(raw)) return [];
  const out: SelectedOption[] = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const ss = s as Record<string, unknown>;
    const label = String(ss.label ?? "").trim();
    if (!label) continue;
    out.push({ group: String(ss.group ?? ""), label, price: num(ss.price) });
  }
  return out;
}

export function snapshotText(snap: SelectedOption[]): string {
  return snap.map((s) => s.label).join(" · ");
}

// A stable key for a cart line = dish + chosen choice ids (so same dish with
// different options are distinct lines).
export function selectionKey(dishId: string, selections: Selection[]): string {
  const parts = selections
    .map((s) => `${s.groupId}:${[...s.choiceIds].sort().join(",")}`)
    .sort()
    .join("|");
  return parts ? `${dishId}#${parts}` : dishId;
}

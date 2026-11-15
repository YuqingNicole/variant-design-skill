// The reference pack: which references a visitor saved, with their own "use" and "avoid" notes.
// Before accounts it lived only in this browser (localStorage, `packKey`); with accounts on it lives in the signed-in
// user's row (supabase/migrations/*_reference_packs.sql) and the browser copy is imported once, then cleared.
export type Intent = { use: string; avoid: string };
export type Pack = Record<string, Intent>;
export const packKey = 'variant-inspiration-pack-v1';

// Accepts only an object of known ids mapping to { use, avoid } strings; anything else is rejected whole, as before.
export function parsePack(value: unknown, known: (id: string) => boolean): Pack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('not a pack');
  const pack: Pack = {};
  for (const [id, intent] of Object.entries(value as Record<string, unknown>)) {
    const i = intent as Partial<Intent> | null;
    if (!known(id) || !i || typeof i !== 'object' || typeof i.use !== 'string' || typeof i.avoid !== 'string') throw new Error('not a pack');
    pack[id] = { use: i.use, avoid: i.avoid };
  }
  return pack;
}

// First sign-in on a browser that saved references before: nothing the visitor wrote is lost.
// A reference only in the browser is added; for one in both, each note keeps the account's text unless that is empty.
export function mergePacks(account: Pack, local: Pack): { pack: Pack; changed: boolean } {
  const pack: Pack = { ...account };
  let changed = false;
  for (const [id, intent] of Object.entries(local)) {
    const mine = pack[id];
    if (!mine) { pack[id] = { ...intent }; changed = true; continue; }
    const use = mine.use || intent.use, avoid = mine.avoid || intent.avoid;
    if (use !== mine.use || avoid !== mine.avoid) { pack[id] = { use, avoid }; changed = true; }
  }
  return { pack, changed };
}

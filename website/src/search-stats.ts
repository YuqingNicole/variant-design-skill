// Counts submitted searches and reads the trending terms (supabase/migrations/20261123000000_search_terms.sql). Plain fetches to
// the RPC endpoints with the public key, so the page does not load the Supabase library. Only the term, the time and the language
// are stored. Without a project configured at build time, or before the migration runs, nothing is sent and no list is shown.
declare const __SUPABASE__: { url: string; key: string } | undefined;
const raw = typeof __SUPABASE__ === 'undefined' ? undefined : __SUPABASE__;
// A build without a project injects empty strings, so both values must be present.
const config = raw?.url && raw?.key ? raw : undefined;
const rpc = (name: string, body: unknown, keepalive = false) => fetch(`${config!.url}/rest/v1/rpc/${name}`, {
  method: 'POST', keepalive, headers: { apikey: config!.key, 'content-type': 'application/json' }, body: JSON.stringify(body),
});
export function logSearch(term: string, language: 'zh' | 'en') {
  if (!config || term.trim().length < 2) return;
  // keepalive: the sheet closes and the feed re-renders right after; the count must not be cut off.
  rpc('log_search', { p_term: term, p_language: language }, true).catch(error => console.warn('search not counted', error));
}
export type Trending = { term: string; searches: number };
export async function topSearches(): Promise<Trending[]> {
  if (!config) return [];
  try {
    const response = await rpc('top_searches', {});
    if (!response.ok) { console.warn('trending searches unavailable', response.status); return []; }
    const rows = await response.json();
    return Array.isArray(rows) ? rows.filter(r => typeof r?.term === 'string' && Number(r?.searches) > 0).map(r => ({ term: r.term, searches: Number(r.searches) })) : [];
  } catch (error) { console.warn('trending searches unavailable', error); return []; }
}

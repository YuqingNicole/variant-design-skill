// Pure helpers for the search sheet (SearchSheet.tsx): what to suggest from this browser's own history, and which trending
// terms are worth showing. No network, no JSX, so the tests import it directly.
type Copy = { zh: string; en: string };
export type SuggestCollection = { slug: string; short: Copy; title: Copy; where: Record<string, string> };
export type SuggestTopic = { id: string; title: Copy };
const lower = (v: string) => v.trim().toLowerCase();
// Two strings relate when one contains the other (at least two characters), so "dark" finds "深色网站 / Dark sites" through
// its English name and "深色" finds it through its Chinese one.
const related = (a: string, b: string) => { const x = lower(a), y = lower(b); return x.length >= 2 && y.length >= 2 && (x.includes(y) || y.includes(x)); };
const labelsOf = (c: SuggestCollection, vocab: Record<string, Record<string, Copy>>) =>
  [c.short.zh, c.short.en, c.title.zh, c.title.en, ...Object.entries(c.where).flatMap(([facet, value]) => [value, vocab[facet]?.[value]?.zh ?? '', vocab[facet]?.[value]?.en ?? ''])];

// "You might like": collections and topics related to what this browser searched before, most recent search first.
export function guessFromHistory(history: string[], collections: SuggestCollection[], topics: SuggestTopic[], vocab: Record<string, Record<string, Copy>>) {
  const picked: ({ kind: 'collection'; item: SuggestCollection } | { kind: 'topic'; item: SuggestTopic })[] = [], seen = new Set<string>();
  for (const h of history) {
    for (const c of collections) if (!seen.has(`c:${c.slug}`) && labelsOf(c, vocab).some(label => related(label, h))) { seen.add(`c:${c.slug}`); picked.push({ kind: 'collection', item: c }); }
    for (const t of topics) if (!seen.has(`t:${t.id}`) && [t.title.zh, t.title.en].some(label => related(label, h))) { seen.add(`t:${t.id}`); picked.push({ kind: 'topic', item: t }); }
  }
  return picked;
}

// A trending term is shown only if searching it would find something: the same fields the feed's search reads (name, tag,
// publisher, focus, application; InspirationPage), on the records the browser holds. That keeps nonsense typed by anyone off.
export function inLibrary(term: string, texts: string[]) { const t = lower(term); return t.length >= 2 && texts.some(x => lower(x).includes(t)); }

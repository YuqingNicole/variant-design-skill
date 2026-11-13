import { t, type Localized } from './i18n/localized';
import type { Language } from './direction-engine';
import { showDrafts } from './i18n/translations';
import records from './testimonials.json';
// What people say about the skill, on /about. A published record is a real person's own words, used with their
// recorded consent and linked to where they said it (checked by scripts/testimonials.test.mjs). `status: 'draft'`
// records show on local and preview builds only, through the same switch as draft translations (RFC-005 §3.5),
// so the layout can be reviewed before there is anything true to put in it; production never shows a placeholder.
export type Testimonial = { id: string; status?: 'draft' | 'published'; name: Localized; role: Localized; org: Localized; quote: Localized; date: string;
  source: { url: string; label: Localized }; avatar?: { src: string; alt: Localized }; consent?: { granted: boolean; at: string } };
export const testimonials = (records as Testimonial[]).filter(r => r.status !== 'draft' || showDrafts);
const m = { heading: { zh: '用过的人怎么说', en: 'What people say' }, draft: { zh: '草稿 · 示例内容', en: 'Draft · sample content' } } satisfies Record<string, Localized>;
// One laurel branch; the second is the same drawing mirrored in CSS. Decorative only.
const Laurel = () => <svg viewBox="0 0 20 28" width="14" height="20" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  <path d="M13 27C6 22 3 14 7 3"/><path d="M7 3c3 1 4 3 4 6-3-1-4-3-4-6Z"/><path d="M5 9c3 1 5 3 5 7-3-1-5-4-5-7Z"/><path d="M4 15c3 1 5 3 6 7-3-1-5-3-6-7Z"/><path d="M6 21c3 0 5 2 7 5-3 0-5-2-7-5Z"/></svg>;
export function Testimonials({ language }: { language: Language }) {
  if (!testimonials.length) return null;
  return <section className="paper-quotes paper-shell" aria-labelledby="paper-quotes-heading">
    <h2 id="paper-quotes-heading">{t(m.heading, language)}</h2>
    <ul>{testimonials.map(r => <li key={r.id} className="paper-quote">
      {r.status === 'draft' && <span className="paper-quote-draft">{t(m.draft, language)}</span>}
      <blockquote cite={r.source.url}><p>{t(r.quote, language)}</p></blockquote>
      <footer>
        {r.avatar ? <img src={r.avatar.src} alt={t(r.avatar.alt, language)} width="40" height="40" loading="lazy" decoding="async"/> : <span className="paper-quote-initial" aria-hidden="true">{t(r.name, language).slice(0, 1)}</span>}
        <span className="paper-quote-who"><b>{t(r.name, language)}</b><span>{t(r.role, language)}</span></span>
        <span className="paper-quote-org"><Laurel/>{t(r.org, language)}<Laurel/></span>
        <a href={r.source.url} target="_blank" rel="noopener noreferrer">{t(r.source.label, language)} · {r.date}</a>
      </footer>
    </li>)}</ul>
  </section>;
}

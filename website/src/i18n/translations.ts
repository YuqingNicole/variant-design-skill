// Per-item translation status (RFC-005 §3.5). Plain data only: prerender imports this without a TS loader for JSX.
// An item without a status counts as published: English written before this field existed was released as is.
import { locales, type Locale } from './locales';

export type TranslationStatus = { status: 'complete' | 'draft'; reviewedAt?: string };
export type Translations = Partial<Record<Exclude<Locale, 'zh'>, TranslationStatus>>;
export const isDraft = (item: { translations?: Translations }, locale: Locale) =>
  locale !== 'zh' && item.translations?.[locale]?.status === 'draft';

// Drafts show locally and in Vercel previews; production builds set this to false (vite.config.ts).
declare const __SHOW_TRANSLATION_DRAFTS__: boolean | undefined;
export const showDrafts = typeof __SHOW_TRANSLATION_DRAFTS__ === 'undefined' || __SHOW_TRANSLATION_DRAFTS__;
// In production a page offers another language only when its prerendered head lists that version;
// the prerender leaves drafts out of hreflang, so the switch and notice never lead to an unlisted page.
export const listsLanguage = (locale: Locale) => showDrafts || typeof document === 'undefined'
  || !!document.querySelector(`link[rel="alternate"][hreflang="${locales[locale].htmlLang}"]`);

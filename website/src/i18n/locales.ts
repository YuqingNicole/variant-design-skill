// The one list of site languages (RFC-005 §3.1). Chinese is the source language and keeps unprefixed URLs;
// every other language gets a path prefix. An unpublished language is visible locally and in previews only.
export const locales = {
  zh: { htmlLang: 'zh-CN', label: '中文', path: '', fallback: null, dateLocale: 'zh-CN', published: true },
  en: { htmlLang: 'en', label: 'English', path: '/en', fallback: 'zh', dateLocale: 'en-US', published: true },
} as const satisfies Record<string, { htmlLang: string; label: string; path: string; fallback: string | null; dateLocale: string; published: boolean }>;
export type Locale = keyof typeof locales;
export const sourceLocale: Locale = 'zh';
export const localeCodes = Object.keys(locales) as Locale[];
export const publishedLocales = localeCodes.filter(l => locales[l].published);
export const isLocale = (value: unknown): value is Locale => typeof value === 'string' && Object.hasOwn(locales, value);
// zh → [zh]; en → [en, zh]; a future ja with fallback en → [ja, en, zh].
export function fallbackChain(locale: Locale): Locale[] {
  const chain: Locale[] = [];
  for (let l: Locale | null = locale; l && !chain.includes(l); l = locales[l].fallback as Locale | null) chain.push(l);
  if (!chain.includes(sourceLocale)) chain.push(sourceLocale);
  return chain;
}

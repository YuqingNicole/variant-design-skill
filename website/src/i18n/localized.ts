import { fallbackChain, isLocale, locales, sourceLocale, type Locale } from './locales';
// A value per language (RFC-005 §3.2). The source language is required; others may be missing and fall back.
export type Localized<T = string> = { [K in typeof sourceLocale]: T } & Partial<Record<Exclude<Locale, typeof sourceLocale>, T>>;

export const has = (value: Localized<unknown>, locale: Locale) => value[locale] !== undefined && value[locale] !== '';
export function t<T>(value: Localized<T>, locale: Locale): T {
  for (const l of fallbackChain(locale)) if (has(value, l)) return value[l] as T;
  throw new Error(`Missing ${sourceLocale} value`);
}
// The locale a value would actually be shown in, so a page can mark fallback text with its real lang.
export function resolvedLocale(value: Localized<unknown>, locale: Locale): Locale {
  return fallbackChain(locale).find(l => has(value, l)) ?? sourceLocale;
}
// Migration bridge: today's positional [zh, en] pairs read as Localized without changing behaviour.
export const fromPair = <T>([zh, en]: readonly [T, T]): Localized<T> => ({ zh, en });
// Every language a value is complete in; used by tests and, later, by prerender gating.
export const completeIn = (value: Localized<unknown>) => (Object.keys(locales) as Locale[]).filter(l => has(value, l));
export function isLocalized(value: unknown): value is Localized<unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && sourceLocale in value && Object.keys(value).every(isLocale);
}

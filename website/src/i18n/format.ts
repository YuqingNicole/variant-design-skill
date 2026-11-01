import { locales, type Locale } from './locales';
// Dates, numbers and sorting from the locale table instead of hand-written formats (RFC-005 §3.8).
// Dates are ISO days (YYYY-MM-DD) as stored in the content files; they are read as UTC so no timezone shifts them.
export const formatDate = (iso: string, locale: Locale, style: 'long' | 'short' = 'long') =>
  new Intl.DateTimeFormat(locales[locale].dateLocale, style === 'long' ? { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' } : { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
export const formatNumber = (n: number, locale: Locale) => new Intl.NumberFormat(locales[locale].dateLocale).format(n);
export const collator = (locale: Locale) => new Intl.Collator(locales[locale].dateLocale, { sensitivity: 'base', numeric: true });

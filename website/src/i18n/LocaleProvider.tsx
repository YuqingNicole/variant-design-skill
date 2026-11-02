import { createContext, useContext, useState, type ReactNode } from 'react';
import { t, type Localized } from './localized';
import { hasLanguageUrl, localePath } from './locale-route';
import { listsLanguage } from './translations';
import { isLocale, sourceLocale, type Locale } from './locales';

const preferenceKey = 'variant-language';
export function readPreference(): Locale | null { try { const value = localStorage.getItem(preferenceKey); return isLocale(value) ? value : null; } catch { return null; } }
export function rememberLocale(locale: Locale) { try { localStorage.setItem(preferenceKey, locale); } catch { /* storage blocked: the address still carries the language */ } }

// The address decides the language (RFC-005 §3.3). `route` is the path without its language prefix.
const LocaleContext = createContext<{ locale: Locale; route: string }>({ locale: sourceLocale, route: '/' });
export const LocaleProvider = ({ locale, route, children }: { locale: Locale; route: string; children: ReactNode }) => <LocaleContext.Provider value={{ locale, route }}>{children}</LocaleContext.Provider>;
export const useLocale = () => useContext(LocaleContext).locale;
export const useRoute = () => useContext(LocaleContext).route;

const notice = { message: { zh: '这个页面有中文版。', en: 'This page is also available in English.' }, open: { zh: '打开', en: 'Open it' }, close: { zh: '关闭提示', en: 'Dismiss' } } satisfies Record<string, Localized>;
const dismissedKey = 'variant-language-notice-dismissed';
// A visitor whose last choice differs from this address gets an offer, never a redirect.
export function LocaleNotice() {
  const { locale, route } = useContext(LocaleContext), preferred = readPreference();
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem(dismissedKey) === '1'; } catch { return false; } });
  if (dismissed || !preferred || preferred === locale || !hasLanguageUrl(route) || !listsLanguage(preferred)) return null;
  const dismiss = () => { try { sessionStorage.setItem(dismissedKey, '1'); } catch { /* lasts for this page */ } setDismissed(true); };
  return <aside className="site-language-notice" lang={preferred}><span>{t(notice.message, preferred)}</span><a href={localePath(route, preferred) + location.search + location.hash} onClick={() => rememberLocale(preferred)}>{t(notice.open, preferred)}</a><button type="button" onClick={dismiss} aria-label={t(notice.close, preferred)}>×</button></aside>;
}

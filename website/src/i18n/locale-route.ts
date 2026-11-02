// How languages map to addresses (RFC-005 §3.3): Chinese keeps unprefixed URLs, other languages get a path prefix.
// Experiments, previews and files have one address and switch language in place, if at all.
import { localeCodes, locales, sourceLocale, type Locale } from './locales';

const oneAddress = /^\/(lab|directions|showcase|variant-output|api)(\/|$)/;
export const hasLanguageUrl = (route: string) => !oneAddress.test(route) && !/\.[a-z0-9]+$/i.test(route);

export function parseLocale(pathname: string): { locale: Locale; route: string } {
  for (const locale of localeCodes) {
    const prefix = locales[locale].path;
    if (!prefix || (pathname !== prefix && !pathname.startsWith(`${prefix}/`))) continue;
    const route = pathname.slice(prefix.length) || '/';
    if (hasLanguageUrl(route)) return { locale, route };
  }
  return { locale: sourceLocale, route: pathname };
}

// `target` may carry a query or hash. External links, anchors and single-address routes come back unchanged.
export function localePath(target: string, locale: Locale) {
  if (!target.startsWith('/') || target.startsWith('//')) return target;
  const end = target.search(/[?#]/), path = end < 0 ? target : target.slice(0, end), rest = end < 0 ? '' : target.slice(end);
  if (!hasLanguageUrl(path)) return target;
  const prefix = locales[locale].path;
  return (path === '/' && prefix ? prefix : prefix + path) + rest;
}

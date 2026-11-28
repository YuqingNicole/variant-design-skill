import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./site-styles";
import { localePath, parseLocale } from "./i18n/locale-route";
import { LocaleNotice, LocaleProvider } from "./i18n/LocaleProvider";
import { designTypeIds } from "./inspiration-sections";
import { loadCards } from "virtual:inspiration/cards";
// Old paths keep working: the address is rewritten in place (Vercel also redirects them with 301).
const legacy = (path: string) => path === "/canvas" ? "/lab/canvas" : path === "/workbench" ? "/lab/workbench" : path.startsWith("/showcase/") ? "/d/" + path.split("/")[2]
  : path === "/showcase" && !new URLSearchParams(location.search).has("direction") ? "/cases" : path === "/inspiration" ? "/" : null;
const parsed = parseLocale(window.location.pathname.replace(/\/+$/, "") || "/");
let route = parsed.route;
const moved = legacy(route);
// The old `?category=` filter became one page per section; its values map onto the new addresses (`practice` was every video, so it goes to the feed).
const oldCategory = ({ landing: "web", product: "interface", flow: "interface", motion: "design-motion", practice: "design-motion" } as Record<string, string>)[new URLSearchParams(location.search).get("category") ?? "-"];
if (oldCategory !== undefined && (route === "/" || route.startsWith("/inspiration/"))) {
  const query = new URLSearchParams(location.search); query.delete("category");
  if (route === "/") { const next = oldCategory ? "/browse/" + oldCategory : "/"; route = next; }
  else if (oldCategory) query.set("in", oldCategory);
  const base = route === "/" ? "/" : route, prefix = localePath(base, parsed.locale), rest = query.toString();
  history.replaceState(null, "", prefix + (rest ? "?" + rest : "") + location.hash);
}
// Design videos left `videos` for `design-motion` (2026-11-20); a link that still filters `videos` by a design type follows them.
if (route === "/browse/videos" && designTypeIds.includes(new URLSearchParams(location.search).get("type") ?? "")) { route = "/browse/design-motion"; history.replaceState(null, "", localePath(route, parsed.locale) + location.search + location.hash); }
if (moved) { history.replaceState(null, "", localePath(moved, parsed.locale) + (moved.startsWith("/lab/") || route === "/inspiration" ? location.search : "") + location.hash); route = moved; }
// The home's first page arrives as cards (reference-library.ts); asking now fetches them beside the page's script, not after it.
if (route === "/") void loadCards(parsed.locale);
const page: Promise<ReactNode> = route === "/lab/canvas" ? import("./LandingCanvas").then(m => <m.LandingCanvas/>) : route === "/lab/workbench" ? import("./App").then(m => <m.default/>)
  : route === "/lab" ? import("./LabPage").then(m => <m.LabPage/>) : route === "/skills" ? import("./SkillsPage").then(m => <m.SkillsPage/>) : route === "/about" ? import("./PaperLanding").then(m => <m.PaperLanding/>)
  // The inspiration pages wait for the records their first render shows (reference-library.ts), so the prerendered cards are never replaced by a gap.
  : route.startsWith("/browse/") ? import("./InspirationPage").then(m => m.prepare(route, parsed.locale).then(() => <m.InspirationPage section={route.slice(8)}/>))
  : route === "/" || route.startsWith("/inspiration/") ? import("./InspirationPage").then(m => m.prepare(route, parsed.locale).then(() => <m.InspirationPage detail={route === "/" ? undefined : route.slice(13)}/>))
  : route === "/collections" || route.startsWith("/collections/") ? import("./CollectionPage").then(m => { const slug = route.slice(13); return m.prepare(slug).then(() => <m.CollectionPage slug={slug}/>); })
  : route === "/changelog" ? import("./ChangelogPage").then(m => <m.ChangelogPage/>)
  : route === "/docs" || route.startsWith("/docs/") && route !== "/docs/install" ? import("./GuidesPage").then(m => <m.GuidesPage base="/docs" slug={route === "/docs" ? undefined : route.slice(6)}/>)
  : route === "/guides" || route.startsWith("/guides/") ? import("./GuidesPage").then(m => <m.GuidesPage slug={route === "/guides" ? undefined : route.slice(8)}/>)
  : route === "/submit" ? import("./SubmitPage").then(m => <m.SubmitPage/>) : route === "/sponsor" ? import("./SponsorPage").then(m => <m.SponsorPage/>) : route === "/privacy" ? import("./PrivacyPage").then(m => <m.PrivacyPage/>) : route === "/docs/install" ? import("./ContentPages").then(m => <m.ContentPages page="docs"/>)
  : route === "/directions" ? import("./ExpressiveDirections").then(m => <m.ExpressiveDirections/>) : route === "/showcase" ? import("./ShowcasePage").then(m => <m.ShowcasePage/>)
  : route === "/pricing" ? import("./pricing").then(m => <m.PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill"/>)
  : import("./LibraryPage").then(m => route === "/cases" ? <m.LibraryPage view={{kind:"feed"}}/> : route.startsWith("/c/") ? <m.LibraryPage view={{kind:"category",id:route.slice(3)}}/>
    : route.startsWith("/d/") ? <m.LibraryPage key={route} view={{kind:"entry",slug:route.slice(3)}}/> : <m.LibraryPage view={{kind:"entry",slug:""}}/>);
page.then(node => createRoot(document.getElementById("root")!).render(<StrictMode><LocaleProvider locale={parsed.locale} route={route}><LocaleNotice/>{node}</LocaleProvider></StrictMode>));
// Offline page and repeat-visit caching (public/sw.js). Production builds only; the worker never touches /api/ or sign-in callbacks.
if ("serviceWorker" in navigator && import.meta.env.PROD) addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); });

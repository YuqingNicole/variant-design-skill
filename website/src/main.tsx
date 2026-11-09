import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./site-styles";
import { parseLocale } from "./i18n/locale-route";
import { LocaleNotice, LocaleProvider } from "./i18n/LocaleProvider";
// Old paths keep working: the address is rewritten in place (Vercel also redirects them with 301).
const legacy = (path: string) => path === "/canvas" ? "/lab/canvas" : path === "/workbench" ? "/lab/workbench" : path.startsWith("/showcase/") ? "/d/" + path.split("/")[2]
  : path === "/showcase" && !new URLSearchParams(location.search).has("direction") ? "/cases" : path === "/inspiration" ? "/" : null;
const parsed = parseLocale(window.location.pathname.replace(/\/+$/, "") || "/");
let route = parsed.route;
const moved = legacy(route);
// The old `?category=` filter became one page per section; its values map onto the new addresses (`practice` was every video, so it goes to the feed).
const oldCategory = ({ landing: "web", product: "interface", flow: "interface", motion: "motion", practice: "" } as Record<string, string>)[new URLSearchParams(location.search).get("category") ?? "-"];
if (oldCategory !== undefined && (route === "/" || route.startsWith("/inspiration/"))) {
  const query = new URLSearchParams(location.search); query.delete("category");
  if (route === "/") { const next = oldCategory ? "/browse/" + oldCategory : "/"; route = next; }
  else if (oldCategory) query.set("in", oldCategory);
  const base = route === "/" ? "/" : route, prefix = parsed.locale === "en" ? (base === "/" ? "/en" : "/en" + base) : base, rest = query.toString();
  history.replaceState(null, "", prefix + (rest ? "?" + rest : "") + location.hash);
}
if (moved) { history.replaceState(null, "", (parsed.locale === "en" ? (moved === "/" ? "/en" : "/en" + moved) : moved) + (moved.startsWith("/lab/") || route === "/inspiration" ? location.search : "") + location.hash); route = moved; }
const page: Promise<ReactNode> = route === "/lab/canvas" ? import("./LandingCanvas").then(m => <m.LandingCanvas/>) : route === "/lab/workbench" ? import("./App").then(m => <m.default/>)
  : route === "/lab" ? import("./LabPage").then(m => <m.LabPage/>) : route === "/skills" ? import("./SkillsPage").then(m => <m.SkillsPage/>) : route === "/about" ? import("./PaperLanding").then(m => <m.PaperLanding/>)
  : route.startsWith("/browse/") ? import("./InspirationPage").then(m => <m.InspirationPage section={route.slice(8)}/>)
  : route === "/" || route.startsWith("/inspiration/") ? import("./InspirationPage").then(m => <m.InspirationPage detail={route === "/" ? undefined : route.slice(13)}/>)
  : route === "/changelog" ? import("./ChangelogPage").then(m => <m.ChangelogPage/>)
  : route === "/docs" || route.startsWith("/docs/") && route !== "/docs/install" ? import("./GuidesPage").then(m => <m.GuidesPage base="/docs" slug={route === "/docs" ? undefined : route.slice(6)}/>)
  : route === "/guides" || route.startsWith("/guides/") ? import("./GuidesPage").then(m => <m.GuidesPage slug={route === "/guides" ? undefined : route.slice(8)}/>)
  : route === "/submit" ? import("./SubmitPage").then(m => <m.SubmitPage/>) : route === "/sponsor" ? import("./SponsorPage").then(m => <m.SponsorPage/>) : route === "/docs/install" ? import("./ContentPages").then(m => <m.ContentPages page="docs"/>)
  : route === "/directions" ? import("./ExpressiveDirections").then(m => <m.ExpressiveDirections/>) : route === "/showcase" ? import("./ShowcasePage").then(m => <m.ShowcasePage/>)
  : route === "/pricing" ? import("./pricing").then(m => <m.PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill"/>)
  : import("./LibraryPage").then(m => route === "/cases" ? <m.LibraryPage view={{kind:"feed"}}/> : route.startsWith("/c/") ? <m.LibraryPage view={{kind:"category",id:route.slice(3)}}/>
    : route.startsWith("/d/") ? <m.LibraryPage key={route} view={{kind:"entry",slug:route.slice(3)}}/> : <m.LibraryPage view={{kind:"entry",slug:""}}/>);
page.then(node => createRoot(document.getElementById("root")!).render(<StrictMode><LocaleProvider locale={parsed.locale} route={route}><LocaleNotice/>{node}</LocaleProvider></StrictMode>));

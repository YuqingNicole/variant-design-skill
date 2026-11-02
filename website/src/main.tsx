import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./site-styles";
// Old paths keep working: the address is rewritten in place (Vercel also redirects them with 301).
const legacy = (path: string) => path === "/canvas" ? "/lab/canvas" : path === "/workbench" ? "/lab/workbench" : path.startsWith("/showcase/") ? "/d/" + path.split("/")[2]
  : path === "/showcase" && !new URLSearchParams(location.search).has("direction") ? "/" : null;
let route = window.location.pathname.replace(/\/+$/, "") || "/";
const moved = legacy(route);
if (moved) { history.replaceState(null, "", moved + (moved.startsWith("/lab/") ? location.search : "") + location.hash); route = moved; }
const page: Promise<ReactNode> = route === "/lab/canvas" ? import("./LandingCanvas").then(m => <m.LandingCanvas/>) : route === "/lab/workbench" ? import("./App").then(m => <m.default/>)
  : route === "/lab" ? import("./LabPage").then(m => <m.LabPage/>) : route === "/skills" ? import("./SkillsPage").then(m => <m.SkillsPage/>) : route === "/about" ? import("./PaperLanding").then(m => <m.PaperLanding/>)
  : route === "/inspiration" || route.startsWith("/inspiration/") ? import("./InspirationPage").then(m => <m.InspirationPage detail={route === "/inspiration" ? undefined : route.slice(13)}/>)
  : route === "/guides" || route.startsWith("/guides/") ? import("./GuidesPage").then(m => <m.GuidesPage slug={route === "/guides" ? undefined : route.slice(8)}/>)
  : route === "/submit" ? import("./SubmitPage").then(m => <m.SubmitPage/>) : route === "/sponsor" ? import("./SponsorPage").then(m => <m.SponsorPage/>) : route === "/docs" ? import("./ContentPages").then(m => <m.ContentPages page="docs"/>)
  : route === "/directions" ? import("./ExpressiveDirections").then(m => <m.ExpressiveDirections/>) : route === "/showcase" ? import("./ShowcasePage").then(m => <m.ShowcasePage/>)
  : route === "/pricing" ? import("./pricing").then(m => <m.PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill"/>)
  : import("./LibraryPage").then(m => route === "/" ? <m.LibraryPage view={{kind:"feed"}}/> : route.startsWith("/c/") ? <m.LibraryPage view={{kind:"category",id:route.slice(3)}}/>
    : route.startsWith("/d/") ? <m.LibraryPage key={route} view={{kind:"entry",slug:route.slice(3)}}/> : <m.LibraryPage view={{kind:"entry",slug:""}}/>);
page.then(node => createRoot(document.getElementById("root")!).render(<StrictMode>{node}</StrictMode>));

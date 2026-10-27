import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcasePage } from "./ShowcasePage";
import { ExpressiveDirections } from "./ExpressiveDirections";
import { ContentPages } from "./ContentPages";
import { InspirationPage } from "./InspirationPage";
import { SubmitPage } from "./SubmitPage";
import { LibraryPage } from "./LibraryPage";
import { LabPage } from "./LabPage";
import { SkillsPage } from "./SkillsPage";
import App from "./App";
import { PaperLanding } from "./PaperLanding";
import { PricingPage } from "./pricing";
import { LandingCanvas } from './LandingCanvas';

// Old paths keep working: the address is rewritten in place (Vercel also redirects them with 301).
const legacy = (path: string) => path === "/canvas" ? "/lab/canvas" : path === "/workbench" ? "/lab/workbench" : path.startsWith("/showcase/") ? "/d/" + path.split("/")[2]
  : path === "/showcase" && !new URLSearchParams(location.search).has("direction") ? "/" : null;
let route = window.location.pathname.replace(/\/+$/, "") || "/";
const moved = legacy(route);
if (moved) { history.replaceState(null, "", moved + (moved.startsWith("/lab/") ? location.search : "") + location.hash); route = moved; }
const page = route === "/lab/canvas" ? <LandingCanvas/> : route === "/lab/workbench" ? <App /> : route === "/lab" ? <LabPage/> : route === "/skills" ? <SkillsPage/> : route === "/about" ? <PaperLanding />
  : route === "/inspiration" ? <InspirationPage/> : route === "/submit" ? <SubmitPage/> : route === "/docs" ? <ContentPages page="docs"/>
  : route === "/directions" ? <ExpressiveDirections /> : route === "/showcase" ? <ShowcasePage /> : route === "/pricing" ? <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill" />
  : route === "/" ? <LibraryPage view={{kind:"feed"}}/> : route.startsWith("/c/") ? <LibraryPage view={{kind:"category",id:route.slice(3)}}/>
  : route.startsWith("/d/") ? <LibraryPage key={route} view={{kind:"entry",slug:route.slice(3)}}/> : <LibraryPage view={{kind:"entry",slug:""}}/>;
createRoot(document.getElementById("root")!).render(<StrictMode>{page}</StrictMode>);

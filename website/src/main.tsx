import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcasePage } from "./ShowcasePage";
import { ExpressiveDirections } from "./ExpressiveDirections";
import { ContentPages } from "./ContentPages";
import { InspirationPage } from "./InspirationPage";
import App from "./App";
import { PaperLanding } from "./PaperLanding";
import { PricingPage } from "./pricing";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
createRoot(document.getElementById("root")!).render(<StrictMode>{route === "/inspiration" ? <InspirationPage/> : route === "/docs" ? <ContentPages page="docs"/> : route.startsWith("/showcase/") ? <ContentPages key={route} page="case" caseId={route.split("/")[2]}/> : route === "/showcase" && !new URLSearchParams(location.search).has("direction") ? <ContentPages page="library"/> : route === "/directions" ? <ExpressiveDirections /> : route === "/showcase" ? <ShowcasePage /> : route === "/pricing" ? <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill" /> : route === "/workbench" ? <App /> : <PaperLanding />}</StrictMode>);

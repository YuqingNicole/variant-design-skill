import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ShowcasePage } from "./ShowcasePage";
import App from "./App";
import { PaperLanding } from "./PaperLanding";
import { PricingPage } from "./pricing";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
createRoot(document.getElementById("root")!).render(<StrictMode>{route === "/showcase" ? <ShowcasePage /> : route === "/pricing" ? <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill" /> : route === "/workbench" ? <App /> : <PaperLanding />}</StrictMode>);

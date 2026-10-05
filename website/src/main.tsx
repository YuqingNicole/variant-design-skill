import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PricingPage } from "./pricing";

const route = window.location.pathname.replace(/\/+$/, "") || "/";
createRoot(document.getElementById("root")!).render(<StrictMode>{route === "/pricing" ? <PricingPage repositoryUrl="https://github.com/YuqingNicole/variant-design-skill" /> : <App />}</StrictMode>);

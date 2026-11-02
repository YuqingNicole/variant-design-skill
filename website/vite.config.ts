import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { variantApiPlugin } from "./server/api-handler.mjs";
import { contentPlugin } from "./scripts/content.mjs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of [
    "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "ANTHROPIC_API_URL", "ANTHROPIC_MODEL",
    "ANTHROPIC_PLANNER_MODEL", "ANTHROPIC_BUILDER_MODEL", "ANTHROPIC_REVIEWER_MODEL",
    "OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_PLANNER_MODEL", "OPENAI_BUILDER_MODEL", "OPENAI_REVIEWER_MODEL",
    "MODEL_TIMEOUT_MS",
  ]) {
    if (env[key]) process.env[key] = env[key];
  }
  return {
    plugins: [react(), variantApiPlugin(), contentPlugin()],
    // RFC-005 §3.5: draft translations stay out of production and show everywhere else.
    define: { __SHOW_TRANSLATION_DRAFTS__: JSON.stringify(process.env.VERCEL_ENV !== 'production') },
    build: { rollupOptions: { input: {
      main: path.resolve("index.html"),
      compare: path.resolve("variant-output/_compare.html"),
      A: path.resolve("variant-output/_preview/A.html"),
      B: path.resolve("variant-output/_preview/B.html"),
      C: path.resolve("variant-output/_preview/C.html"),
    } } },
  };
});

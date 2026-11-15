import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { variantApiPlugin } from "./server/api-handler.mjs";
import { contentPlugin } from "./scripts/content.mjs";
import { inspirationPlugin } from "./scripts/inspiration-split.mjs";

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
    plugins: [react(), variantApiPlugin(), contentPlugin(), inspirationPlugin()],
    // RFC-005 §3.5: draft translations stay out of production and show everywhere else.
    define: { __SHOW_TRANSLATION_DRAFTS__: JSON.stringify(process.env.VERCEL_ENV !== 'production'), __SHOW_CASES__: JSON.stringify(process.env.VERCEL_ENV !== 'production'),
      // Accounts (src/account.ts, docs/accounts.md): on only when both values are set; the key is Supabase's public anon key.
      __SUPABASE__: JSON.stringify({ url: env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '', key: env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '' }) },
    build: { rollupOptions: { input: {
      main: path.resolve("index.html"),
      compare: path.resolve("variant-output/_compare.html"),
      A: path.resolve("variant-output/_preview/A.html"),
      B: path.resolve("variant-output/_preview/B.html"),
      C: path.resolve("variant-output/_preview/C.html"),
    } } },
  };
});

import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:['loop.spec.mjs','premium-eval.spec.mjs','native-vite-eval.spec.mjs','native-delivery-eval.spec.mjs','runtime-plan.spec.mjs'],workers:1,use:{headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || undefined},reporter:'list'});

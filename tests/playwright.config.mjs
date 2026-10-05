import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'loop.spec.mjs',workers:1,use:{headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || undefined},reporter:'list'});

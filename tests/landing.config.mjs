import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: 'landing.spec.mjs',
  workers: 1,
  reporter: 'list',
  use: { headless: true, baseURL: 'http://127.0.0.1:4197', channel: process.env.PLAYWRIGHT_CHANNEL || undefined },
  webServer: { command: 'node ../website/server.mjs', url: 'http://127.0.0.1:4197/api/status', env: { PORT: '4197' }, reuseExistingServer: false },
});

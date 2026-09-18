import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node e2e/mockAuthApi.mjs',
      url: 'http://localhost:18080/__health',
      reuseExistingServer: false,
    },
    {
      command: 'npm run build && npm run start -- -p 3100',
      url: 'http://localhost:3100',
      env: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:18080' },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});

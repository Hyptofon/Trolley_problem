import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // run sequentially to avoid port/state conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
    video: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: {
    command: 'npx next dev -p 3005',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      DEMO_MODE: 'true',
      ADMIN_PASSWORD_HASH: '16384:8:1$5454d96429b9aa379018c20b02b95d6c$06130ff3b885ec6ef730d87fecb4f66f06020fd4204ca0616076fe0690e76a9621827bc2ef86d104671038de7d9501c033fd58a933ddd885ecf57d1b7fb3fceb',
      VOTE_ID_HMAC_SECRET: '002bb44eba67c074d1f84026d1168f6a08df00250fbe222aab8f8ac4ce07a2eb',
    },
  },
});

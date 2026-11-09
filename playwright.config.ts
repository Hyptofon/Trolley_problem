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
      ADMIN_PASSWORD_HASH: '16384:8:1$8bedd52f6794fa3846ebed88b80c26e0$bd1c7f5a7bafb30079be66a58a151a3d526a4d71902b03f91e182644984828d20d04c4eac8e29bac9ecfcb8a0b1b7c5edd00dd17a453c9a272c1f95a9b2ff3e5',
      VOTE_ID_HMAC_SECRET: '002bb44eba67c074d1f84026d1168f6a08df00250fbe222aab8f8ac4ce07a2eb',
    },
  },
});

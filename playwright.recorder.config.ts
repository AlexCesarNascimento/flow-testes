import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/recorder',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  reporter: 'list',
  use: { trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve-recorder.ts',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
    timeout: 15_000,
  },
});

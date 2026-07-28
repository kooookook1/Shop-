import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Playwright e2e config — uses the @sparticuz/chromium binary bundled via npm
 * (the public Playwright CDN is not reachable from this environment).
 *
 * The bootstrap in e2e/global-setup.ts extracts chromium + fonts to /tmp and
 * points PLAYWRIGHT_CHROMIUM_PATH at it.
 */
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || join(tmpdir(), 'chromium');

export default defineConfig({
  testDir: './e2e',
  // Sandbox is resource-constrained & the chromium binary is coldbooted from
  // /tmp — page setup can legitimately exceed a minute under load.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.APP_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: existsSync(chromiumPath)
      ? {
          executablePath: chromiumPath,
          // NOTE: no --single-process — it crashes between tests outside Lambda.
          args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none'],
        }
      : {},
  },
  projects: [
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
});

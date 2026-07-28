/**
 * Shared browser environment bootstrap for R3XON dev tooling.
 * - Extracts the @sparticuz/chromium binary (works offline — bundled via npm)
 * - Extracts the bundled Amazon-Linux system libs (libnss3, ...) needed on Debian
 * - Installs Arabic fonts (Tajawal + Noto Naskh) into the fontconfig dir
 * - Launches a playwright-core browser ready for screenshots / e2e
 */
import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sparticuz from '@sparticuz/chromium';
import { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';
import { chromium as playwrightChromium } from 'playwright-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BIN_DIR = join(ROOT, 'node_modules', '@sparticuz', 'chromium', 'bin');

let cachedPath = null;

export async function ensureChromium() {
  if (cachedPath && existsSync(cachedPath)) return cachedPath;

  // System libs bundled with the package (libnss3, libnspr4, ...) — not
  // auto-extracted outside Amazon Linux, so inflate manually.
  await inflate(join(BIN_DIR, 'al2023.tar.br'));
  setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));

  // Arabic font support: fontconfig (via fonts.tar.br) scans /tmp/fonts.
  const fontsTarget = join(tmpdir(), 'fonts', 'arabic');
  if (!existsSync(fontsTarget)) {
    mkdirSync(fontsTarget, { recursive: true });
    for (const pkg of ['@expo-google-fonts/tajawal', '@expo-google-fonts/noto-naskh-arabic']) {
      const pkgDir = join(ROOT, 'node_modules', pkg);
      if (!existsSync(pkgDir)) continue;
      for (const weightDir of readdirSync(pkgDir)) {
        const full = join(pkgDir, weightDir);
        try {
          if (!statSync(full).isDirectory()) continue;
          for (const f of readdirSync(full)) {
            if (f.endsWith('.ttf')) copyFileSync(join(full, f), join(fontsTarget, f));
          }
        } catch { /* ignore */ }
      }
    }
  }

  cachedPath = await sparticuz.executablePath();
  return cachedPath;
}

export async function launchBrowser(extraArgs = []) {
  const executablePath = await ensureChromium();
  // Filter out Lambda-only flags: --single-process crashes outside Amazon's
  // environment and takes the whole browser down between tests.
  const args = [...sparticuz.args.filter(a => a !== '--single-process'), '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', ...extraArgs];
  const browser = await playwrightChromium.launch({
    executablePath,
    args,
    env: process.env,
  });
  return browser;
}

/** Launch a browser and hand a fresh page to the callback; always closes. */
export async function withPage(fn, { viewport = { width: 430, height: 930 } } = {}) {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    return await fn(page, browser);
  } finally {
    await browser.close();
  }
}

export const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

/** Wait until the dev server answers HTTP requests. */
export async function waitForServer(url = BASE_URL, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch { /* retry */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

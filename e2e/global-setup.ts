/**
 * Playwright global setup:
 * extracts the bundled chromium + system libs + Arabic fonts, exports the
 * binary path through process.env so playwright.config.ts can launch it, and
 * makes sure the dev server is answering before tests start.
 */
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sparticuz, { inflate, setupLambdaEnvironment } from '@sparticuz/chromium';

export default async function globalSetup() {
  const binDir = join(process.cwd(), 'node_modules', '@sparticuz', 'chromium', 'bin');
  await inflate(join(binDir, 'al2023.tar.br'));
  setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
  const executablePath = await sparticuz.executablePath();
  process.env.PLAYWRIGHT_CHROMIUM_PATH = executablePath;

  const base = process.env.APP_URL || 'http://localhost:3000';
  const start = Date.now();
  while (Date.now() - start < 60_000) {
    try {
      const res = await fetch(base);
      if (res.status < 500) return;
    } catch { /* keep waiting */ }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Dev server at ${base} is not responding. Start it with: npm run dev`);
}

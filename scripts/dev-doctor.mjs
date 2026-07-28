/**
 * Environment doctor — verifies the whole R3XON dev environment end to end:
 * runtime, dependencies, type safety, database, live server, headless browser, fonts.
 *
 * Usage: node scripts/dev-doctor.mjs
 */
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

let ok = 0, bad = 0;
const report = (name, pass, note = '') => {
  if (pass) { ok++; console.log(`  ✅ ${name}${note ? ` — ${note}` : ''}`); }
  else { bad++; console.log(`  ❌ ${name}${note ? ` — ${note}` : ''}`); }
};
const sh = cmd => { try { return execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString().trim(); } catch { return null; } };

console.log('\n🩺 R3XON Environment Doctor\n');

// 1. Runtime
const nodeV = process.version;
report(`Node.js ${nodeV}`, Number(nodeV.slice(1).split('.')[0]) >= 18);
report('npm available', !!sh('npm -v'), sh('npm -v'));

// 2. Dependencies
report('node_modules installed', existsSync(join(ROOT, 'node_modules', 'react')));
report('@sparticuz/chromium present', existsSync(join(ROOT, 'node_modules', '@sparticuz', 'chromium')));
report('playwright-core present', existsSync(join(ROOT, 'node_modules', 'playwright-core')));
report('vitest present', existsSync(join(ROOT, 'node_modules', 'vitest')));
report('Arabic fonts (Tajawal) present', existsSync(join(ROOT, 'node_modules', '@expo-google-fonts', 'tajawal')));

// 3. Type safety
console.log('\n▸ TypeScript check (tsc --noEmit)…');
const tsc = sh('npx tsc --noEmit');
report('type check clean', tsc !== null);

// 4. Config sanity
report('package.json type=module', JSON.parse(sh('cat package.json') || '{}').type === 'module');
report('vite.config.ts exists', existsSync(join(ROOT, 'vite.config.ts')));
report('.gitignore excludes *.db', (sh('cat .gitignore') || '').includes('*.db'));
report('no stray local.db committed', sh('git ls-files | grep -c "^local.db$" || true') === '0');

// 5. Browser launch
console.log('\n▸ Headless browser launch…');
try {
  const { launchBrowser } = await import('./browser-env.mjs');
  const browser = await launchBrowser();
  const v = browser.version();
  await browser.close();
  report('headless Chromium launches', true, `v${v}`);
} catch (e) {
  report('headless Chromium launches', false, String(e.message || e).split('\n')[0]);
}

// 6. Font rendering check (Arabic glyph probing in the browser)
try {
  const { withPage } = await import('./browser-env.mjs');
  const hasArabicFont = await withPage(async page => {
    await page.goto('about:blank');
    return page.evaluate(() => document.fonts.check('16px Tajawal', 'ر'));
  });
  report('Tajawal Arabic font resolvable in browser', hasArabicFont);
} catch (e) {
  report('font probe', false, String(e.message || e).split('\n')[0]);
}

// 7. Live server & DB
console.log('\n▸ Live server / database…');
let live = false;
try {
  const res = await fetch('http://localhost:3000/api/products');
  live = res.ok;
  const products = await res.json();
  report('dev server responds on :3000', live);
  report('products endpoint healthy', Array.isArray(products) && products.length > 0, `${Array.isArray(products) ? products.length : 0} products`);
  const settings = await (await fetch('http://localhost:3000/api/settings')).json();
  report('site settings seeded', !!settings?.siteName, settings?.siteName);
} catch {
  report('dev server responds on :3000', false, 'run: npm run dev');
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${ok} checks passed · ${bad} failed`);
if (bad) process.exit(1);
console.log('  🎉 Environment is fully operational!\n');

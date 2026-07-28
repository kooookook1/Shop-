/**
 * Browser screenshot tool for the R3XON store.
 *
 * Usage:
 *   node scripts/screenshot.mjs                 # capture every page
 *   node scripts/screenshot.mjs home,cart       # capture a subset
 *   node scripts/screenshot.mjs --out=shots/    # custom output dir (default: screenshots/)
 *
 * Available pages: login, home, search, product, cart, checkout, profile,
 * purchases, support, admin
 */
import { mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPage, waitForServer, BASE_URL } from './browser-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const outArg = process.argv.find(a => a.startsWith('--out='));
const OUT_DIR = join(ROOT, outArg ? outArg.slice(6) : 'screenshots');
const wanted = process.argv.slice(2).filter(a => !a.startsWith('--')).join(',').split(',').filter(Boolean);

const USER = { name: 'مختبر ريكسون', email: `e2e-${Date.now()}@rixon.dev`, password: 'Test@123' };
const ADMIN = { name: 'المشرف', email: 'zero@gmail.com', password: 'Admin@123' };

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function snap(page, name) {
  await sleep(650); // let motion animations settle
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`📸 ${name}.png`);
}

async function login(page, { email, password }) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  // Wait for the email-exists blur check to settle so the button isn't disabled mid-flight
  await sleep(800);
  await page.locator('button[type="submit"]').click();
  await sleep(2500);
}

async function register(page, { name, email, password }) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.locator('input[type="email"]').waitFor({ timeout: 20000 });

  // Try login first — the account may already exist from an earlier run
  await login(page, { email, password });
  const loggedIn = await page.evaluate(() => localStorage.getItem('rixon_is_logged_in') === 'true');
  if (loggedIn) return;

  // Not registered yet → switch to registration mode and sign up
  const regLink = page.locator('button', { hasText: 'إنشاء حساب جديد' }).last();
  if (await regLink.count()) await regLink.click();
  await sleep(400);
  const nameInput = page.locator('input[placeholder="الاسم الكامل"]');
  if (await nameInput.count()) await nameInput.fill(name);
  await login(page, { email, password });
}

async function giveBalance(page, amount = 500) {
  const state = await page.evaluate(async () => {
    const u = JSON.parse(localStorage.getItem('rixon_current_user_obj') || 'null');
    return u?.id || null;
  });
  if (!state) return;
  await fetch(`${BASE_URL}/api/users/${state}/balance`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  await sleep(1200);
}

const steps = {
  login: async page => { await snap(page, '01-login'); },

  home: async page => { await snap(page, '02-home-storefront'); },

  search: async page => {
    const searchBtn = page.locator('button:has(svg.lucide-search)').first();
    if (await searchBtn.count()) {
      await searchBtn.click();
      await sleep(400);
      const input = page.locator('input[type="text"]').first();
      await input.fill('ببجي');
      await sleep(700);
    }
    await snap(page, '03-search');
  },

  product: async page => {
    // Clear any leftover search text so the target card is visible
    const searchInput = page.getByPlaceholder('ابحث...');
    if (await searchInput.count()) { await searchInput.fill(''); await sleep(600); }
    // exact=true avoids hitting the banner headline ("باقة ChatGPT Plus السنوية")
    const card = page.getByText('ChatGPT Plus', { exact: true }).first();
    await card.click({ timeout: 10000 });
    await sleep(1100);
    await snap(page, '04-product-details');
    const back = page.locator('button', { hasText: 'الرجوع للمتجر' }).first();
    if (await back.count()) { await back.click().catch(() => {}); await sleep(500); }
  },

  cart: async page => {
    // Add an item via UI then open the cart tab
    const addBtn = page.locator('button', { hasText: 'أضف إلى السلة' }).first();
    if (await addBtn.count()) { await addBtn.click().catch(() => {}); await sleep(600); }
    await page.locator('nav button', { hasText: 'السلة' }).click();
    await sleep(700);
    await snap(page, '05-cart');
  },

  checkout: async page => {
    const promo = page.locator('input[placeholder*="كود"], input[placeholder*="خصم"]').first();
    if (await promo.count()) {
      await promo.fill('REX20');
      const apply = page.locator('button', { hasText: /تطبيق|تفعيل/ }).first();
      if (await apply.count()) await apply.click();
      await sleep(700);
      await snap(page, '06-checkout-coupon');
    }
  },

  profile: async page => {
    await page.locator('nav button', { hasText: 'حسابي' }).click();
    await sleep(800);
    await snap(page, '07-profile');
  },

  purchases: async page => {
    await page.locator('nav button', { hasText: 'مشترياتي' }).click();
    await sleep(800);
    await snap(page, '08-purchases');
  },

  support: async page => {
    await page.locator('nav button', { hasText: 'الدعم' }).click();
    await sleep(800);
    const input = page.getByPlaceholder('اكتب رسالتك للدعم الفني...');
    if (await input.count()) {
      await input.fill('مرحباً، وين ألقى طلبي؟');
      // The send button is the cyan square next to the input
      await page.locator('button:has(svg.lucide-send)').first().click().catch(() => page.keyboard.press('Enter'));
      await sleep(2200); // bot auto-reply round-trip
    }
    await snap(page, '09-support-chat');
  },

  admin: async page => {
    // Register/enter the admin account (client gate: email must be zero@gmail.com)
    await register(page, ADMIN);
    await sleep(1500);
    const adminNav = page.locator('nav button', { hasText: 'لوحةالتحكم' });
    if (await adminNav.count()) {
      await adminNav.click();
      await sleep(1800);
      await snap(page, '10-admin-dashboard');
    } else {
      console.log('⚠️  admin tab not visible');
    }
  },
};

const order = ['login', 'home', 'search', 'product', 'cart', 'checkout', 'profile', 'purchases', 'support', 'admin'];
const runList = wanted.length ? wanted : order;

mkdirSync(OUT_DIR, { recursive: true });
console.log(`⏳ Waiting for dev server at ${BASE_URL} ...`);
await waitForServer();
console.log(`✅ Server is live. Capturing: ${runList.join(', ')}`);

await withPage(async page => {
  page.on('console', m => { if (m.type() === 'error') console.log('  [browser:console.error]', m.text().slice(0, 160)); });
  page.on('pageerror', e => console.log('  [browser:pageerror]', String(e).slice(0, 200)));

  await register(page, USER);
  await giveBalance(page);
  await page.goto(BASE_URL, { waitUntil: 'networkidle' }).catch(() => {});
  await sleep(1500);

  for (const name of runList) {
    if (!steps[name]) { console.log(`⚠️  unknown page "${name}" — skipped`); continue; }
    try { await steps[name](page); }
    catch (e) { console.log(`⚠️  step "${name}" failed: ${e.message.split('\n')[0]}`); }
  }

  // Fresh screenshot of the login screen for the very first card
  if (runList.includes('login')) {
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL, { waitUntil: 'networkidle' }).catch(() => {});
    await snap(page, '01-login');
  }
}, { viewport: { width: 430, height: 930 } });

console.log(`\n🎉 Done. Screenshots saved to ${OUT_DIR}`);

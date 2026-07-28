/**
 * API smoke test — verifies every REST endpoint of the R3XON server.
 * Safe to run against a live dev server: creates only throwaway demo rows.
 *
 * Usage: node scripts/smoke-test.mjs [--url=http://localhost:3000]
 */
import { waitForServer, BASE_URL } from './browser-env.mjs';

const urlArg = process.argv.find(a => a.startsWith('--url='));
const BASE = urlArg ? urlArg.slice(6) : BASE_URL;

let passed = 0, failed = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.log(`  ❌ ${name} ${extra}`); }
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-json */ }
  return { status: res.status, body };
}

console.log(`\n🔥 R3XON API smoke test → ${BASE}\n`);
await waitForServer(BASE);

// ─── Core reads ──────────────────────────────────────────────
console.log('▸ Core reads');
const products = await api('/api/products');
check('GET /api/products → array', products.status === 200 && Array.isArray(products.body) && products.body.length > 0);
check('products have parsed numeric price', products.body?.every(p => typeof p.price === 'number'));
check('products accountDetails scrubbed (no raw password)', products.body?.every(p => !p.accountDetails?.password || p.accountDetails.password === '********'));

const cats = await api('/api/categories');
check('GET /api/categories → 4 seeded', cats.status === 200 && Array.isArray(cats.body) && cats.body.length >= 4);

const banners = await api('/api/banners');
check('GET /api/banners → array', banners.status === 200 && Array.isArray(banners.body));

const settings = await api('/api/settings');
check('GET /api/settings → siteName', settings.status === 200 && !!settings.body?.siteName);

const txs = await api('/api/transactions');
check('GET /api/transactions → array', txs.status === 200 && Array.isArray(txs.body));

const logs = await api('/api/logs');
check('GET /api/logs → array', logs.status === 200 && Array.isArray(logs.body));

const broadcasts = await api('/api/broadcasts');
check('GET /api/broadcasts → array', broadcasts.status === 200 && Array.isArray(broadcasts.body));

// ─── Auth flow ───────────────────────────────────────────────
console.log('▸ Auth flow');
const ts = Date.now();
const email = `smoke-${ts}@rixon.dev`;

const emailCheck = await api(`/api/check-email?email=${email}`);
check('GET /api/check-email → not exists', emailCheck.body?.exists === false);

const reg = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, name: 'Smoke Tester', password: 'pw-123', isRegistering: true }) });
check('POST /api/login (register) → id', !!reg.body?.id && !reg.body.error);
const userId = reg.body?.id;

const dupReg = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, name: 'Dup', password: 'x', isRegistering: true }) });
check('duplicate registration rejected', !!dupReg.body?.error);

const badLogin = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password: 'wrong-pw' }) });
check('wrong password rejected', !!badLogin.body?.error);

const goodLogin = await api('/api/login', { method: 'POST', body: JSON.stringify({ email, password: 'pw-123' }) });
check('correct password accepted', goodLogin.body?.id === userId);

const ghostLogin = await api('/api/login', { method: 'POST', body: JSON.stringify({ email: `ghost-${ts}@rixon.dev`, password: 'x' }) });
check('unknown account rejected with guidance', !!ghostLogin.body?.error);

// ─── Balance & purchase flow ─────────────────────────────────
console.log('▸ Wallet & orders');
const bal = await api(`/api/users/${userId}/balance`, { method: 'POST', body: JSON.stringify({ amount: 50 }) });
check('POST balance top-up', bal.body?.success === true);

const usersNow = await api('/api/users');
const me = usersNow.body?.find(u => u.id === userId);
check('balance reflects top-up (50)', me && Number(me.balance) === 50);

// Pick the CHEAPEST key pack so the 50$ top-up can afford it
const keyProduct = products.body
  .filter(p => (p.keys || []).length > 0)
  .sort((a, b) => a.price - b.price)[0];
if (keyProduct) {
  const keysBefore = keyProduct.keys.length;
  const order = await api('/api/orders', { method: 'POST', body: JSON.stringify({
    items: [{ product: keyProduct, quantity: 1, selectedPlan: 'yearly' }], userId,
  }) });
  check('auto_keys order succeeds with key delivered', order.body?.success === true && order.body?.orders?.[0]?.credentials?.keys?.length === 1);
  const after = (await api('/api/products')).body.find(p => p.id === keyProduct.id);
  check('key inventory decremented atomically', after.keys.length === keysBefore - 1 && after.stock === keysBefore - 1);
} else {
  check('auto_keys product available for test', false, '(no product with keys found)');
}

// Server prices orders from the DB (never trusts the client payload) — so to
// trigger "insufficient balance" we order the priciest real product while the
// wallet only holds the ~45$ left from the top-up above.
const priciest = [...products.body].sort((a, b) => b.price - a.price)[0];
const broke = await api('/api/orders', { method: 'POST', body: JSON.stringify({
  items: [{ product: priciest, quantity: 1, selectedPlan: 'yearly' }], userId,
}) });
check('insufficient balance rejected', !!broke.body?.error);

const ordersAll = await api('/api/orders');
check('GET /api/orders contains the new order', ordersAll.body?.some(o => o.userId === userId));

// ─── Coupon flow ─────────────────────────────────────────────
console.log('▸ Coupons');
const goodCoupon = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'REX20' }) });
check('valid coupon accepted', goodCoupon.status === 200 && goodCoupon.body?.value === 20);
const badCoupon = await api('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code: 'NOPE999' }) });
check('invalid coupon rejected (404)', badCoupon.status === 404 && !!badCoupon.body?.error);

// ─── Messaging flow ──────────────────────────────────────────
console.log('▸ Support messaging');
const sent = await api('/api/messages', { method: 'POST', body: JSON.stringify({ sender: 'user', senderName: 'Smoke Tester', text: 'وين طلبي؟', userId }) });
check('user message stored + bot replied', !!sent.body?.userMessage && !!sent.body?.replyMessage);
const msgs = await api(`/api/messages?userId=${userId}`);
check('messages scoped to user', msgs.body?.length >= 2);
const convs = await api('/api/messages/conversations');
check('conversations list built', Array.isArray(convs.body) && convs.body.some(c => c.userId === userId));
const markRead = await api('/api/messages/read', { method: 'PUT', body: JSON.stringify({ userId }) });
check('mark-as-read works', markRead.body?.success === true);

// ─── Admin config writes (categories / banners / coupons) ────
console.log('▸ Admin CRUD round-trip');
const catId = `cat-smoke-${ts}`;
await api('/api/categories', { method: 'POST', body: JSON.stringify({ id: catId, name: 'اختبار', orderIndex: 99, isActive: false }) });
await api(`/api/categories/${catId}`, { method: 'PUT', body: JSON.stringify({ name: 'اختبار معدل', orderIndex: 99, isActive: false, isHidden: true, viewLayout: 'vertical', imageOrIcon: 'Shield' }) });
const catAfter = (await api('/api/categories')).body?.find(c => c.id === catId);
check('category create+update round-trip', catAfter?.name === 'اختبار معدل');
await api(`/api/categories/${catId}`, { method: 'DELETE' });
check('category delete', !(await api('/api/categories')).body?.some(c => c.id === catId));

const coupId = `coup-smoke-${ts}`;
await api('/api/coupons', { method: 'POST', body: JSON.stringify({ id: coupId, code: `SMOKE${String(ts).slice(-5)}`, type: 'fixed', value: 5, isActive: true }) });
check('coupon create', (await api('/api/coupons')).body?.some(c => c.id === coupId));
await api(`/api/coupons/${coupId}`, { method: 'DELETE' });

const logPost = await api('/api/logs', { method: 'POST', body: JSON.stringify({ adminName: 'Smoke', actionType: 'فحص', details: 'smoke test entry' }) });
check('audit log write', logPost.body?.success === true);

// ─── Product CRUD round-trip ─────────────────────────────────
console.log('▸ Product CRUD round-trip');
const prodId = `prod-smoke-${ts}`;
await api('/api/products', { method: 'POST', body: JSON.stringify({ id: prodId, name: 'منتج اختباري', category: 'games', price: 9.99, period: 'شهر', stock: 3, features: ['ميزة 1'], productType: 'auto_keys', keys: ['K1', 'K2', 'K3'] }) });
const created = (await api('/api/products')).body?.find(p => p.id === prodId);
check('product create with keys', created && created.keys.length === 3);
const afterUpd = await api(`/api/products/${prodId}`, { method: 'PUT', body: JSON.stringify({ ...created, price: 7.5 }) });
check('product update', afterUpd.body?.success === true);
const ord2 = await api('/api/orders', { method: 'POST', body: JSON.stringify({ items: [{ product: { ...created, price: 7.5 }, quantity: 2, selectedPlan: 'yearly' }], userId }) });
check('multi-quantity auto_keys order', ord2.body?.success === true && ord2.body?.orders?.[0]?.credentials?.keys?.length === 2);
const finalProd = (await api('/api/products')).body?.find(p => p.id === prodId);
check('stock == remaining keys (1)', finalProd?.keys?.length === 1 && finalProd?.stock === 1);
await api(`/api/products/${prodId}`, { method: 'DELETE' });
check('product delete', !(await api('/api/products')).body?.some(p => p.id === prodId));

// ─── Asiacell gateway (offline-safe checks) ──────────────────
console.log('▸ Asiacell gateway (offline-safe)');
const acStatus = await api('/api/asiacell/admin/status');
check('GET asiacell admin status', acStatus.status === 200 && typeof acStatus.body?.authenticated === 'boolean');
const acBadPhone = await api('/api/asiacell/login', { method: 'POST', body: JSON.stringify({ phone: '123', userId }) });
check('asiacell rejects malformed phone', !!acBadPhone.body?.error);
const acBadSession = await api('/api/asiacell/topup', { method: 'POST', body: JSON.stringify({ sessionId: 'nope', voucher: '123456', username: 'Tester' }) });
check('asiacell rejects dead session', !!acBadSession.body?.error);

// ─── Frontend serving ────────────────────────────────────────
console.log('▸ Frontend');
const html = await fetch(`${BASE}/`).then(r => r.text());
check('SPA shell served', html.includes('<div id="root">'));
const mainTsx = await fetch(`${BASE}/src/main.tsx`).then(r => r.status);
check('vite transforms TS on the fly', mainTsx === 200);

// ─── Summary ─────────────────────────────────────────────────
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`  ${passed} passed · ${failed} failed`);
if (failed) { console.log('  Failing:', failures.join(' | ')); process.exit(1); }
console.log('  🎉 ALL SMOKE TESTS PASSED\n');

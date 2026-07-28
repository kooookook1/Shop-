import { test, expect, type Page } from '@playwright/test';

/**
 * End-to-end critical path for the R3XON store:
 * register → browse → search → product → cart → coupon → wallet purchase → purchases.
 *
 * Requires: dev server running on :3000 (npm run dev)
 * Each test provisions its own throwaway account, so tests are order-independent.
 */

const BASE = process.env.APP_URL || 'http://localhost:3000';
const ts = Date.now();
const mkUser = (tag: string) => ({ name: `مختبر ${tag}`, email: `${tag}-${ts}@rixon.dev`, password: 'Pw!23456' });

async function registerViaUi(page: Page, user: { name: string; email: string; password: string }) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'إنشاء حساب جديد' }).last().click();
  await page.getByPlaceholder('الاسم الكامل').fill(user.name);
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('text=ChatGPT Plus').first()).toBeVisible({ timeout: 20_000 });
}

test.describe('R3XON store critical path', () => {
  test('register, top-up, buy an auto-keys pack with coupon, verify delivery', async ({ page }) => {
    const user = mkUser('buyer');
    const tag = `E2E-${String(ts).slice(-6)}`;
    const product = {
      id: `prod-e2e-${ts}`,
      name: `باقة شدات تجريبية ${tag}`,
      category: 'games',
      price: 5,
      period: 'باقة اختبارية',
      stock: 5,
      productType: 'auto_keys',
      keys: ['E2E-KEY-1', 'E2E-KEY-2', 'E2E-KEY-3', 'E2E-KEY-4', 'E2E-KEY-5'],
      features: ['ميزة اختبارية'],
    };

    // 0 ─ Hermetic test data: dedicate a product whose keys cannot be
    // exhausted by earlier runs (seeded inventory is finite by design).
    await page.request.post(`${BASE}/api/products`, { data: product });

    // 1 ─ Register through the real UI
    await registerViaUi(page, user);

    // 2 ─ Search filters products live
    await page.locator('button:has(svg.lucide-search)').first().click();
    await page.getByPlaceholder('ابحث...').fill(tag);
    await expect(page.locator(`text=${product.name}`).first()).toBeVisible();
    await expect(page.locator('text=Spotify Premium')).toHaveCount(0);

    // 3 ─ Product details page renders
    await page.locator(`text=${product.name}`).first().click();
    await expect(page.locator('text=باقة اختبارية').first()).toBeVisible();

    // Grab the signed-in user id (needed for the balance top-up API)
    const userId = await page.evaluate(() => {
      const u = JSON.parse(localStorage.getItem('rixon_current_user_obj') || 'null');
      return u?.id as string;
    });
    expect(userId).toBeTruthy();

    // 4 ─ Top up wallet through the API (covers /api/users/:id/balance)
    const topup = await page.request.post(`${BASE}/api/users/${userId}/balance`, { data: { amount: 100 } });
    expect(topup.ok()).toBeTruthy();

    // 5 ─ Add to cart via product page, then go back (bottom nav hides on
    // the details page) and open the checkout tab
    await page.getByRole('button', { name: 'أضف إلى السلة' }).first().click();
    await page.getByRole('button', { name: 'الرجوع للمتجر' }).click();
    await page.locator('nav button', { hasText: 'السلة' }).click();
    await expect(page.locator('text=الدفع الآمن والتأكيد')).toBeVisible();

    // 6 ─ Coupon REX20 applies
    await page.getByPlaceholder('كود الخصم (مثال: R3XON)').fill('REX20');
    await page.getByRole('button', { name: /تطبيق|تفعيل/ }).first().click();
    await expect(page.locator('text=تم تطبيق كود الخصم الفاخر بنجاح')).toBeVisible({ timeout: 10_000 });

    // 7 ─ Purchase with wallet, confirm modal
    await page.getByRole('button', { name: /تأكيد الدفع والخصم من المحفظة/ }).click();
    await page.getByRole('button', { name: 'نعم، تأكيد الشراء' }).click();
    await expect(page.locator('text=شكراً لك! تم تأكيد الشراء')).toBeVisible({ timeout: 15_000 });

    // 8 ─ Delivered order visible in purchases page
    await page.locator('nav button', { hasText: 'مشترياتي' }).click();
    await expect(page.locator(`text=${product.name}`).first()).toBeVisible({ timeout: 10_000 });

    // 9 ─ Server-side truth: order landed in the API with a delivered key
    const ordersRes = await page.request.get(`${BASE}/api/orders`);
    const orders = await ordersRes.json();
    const mine = orders.find((o: any) => o.userId === userId && o.productId === product.id);
    expect(mine, 'order recorded server-side for this user').toBeTruthy();
    expect(mine.credentials?.keys?.length).toBe(1);
    expect(['E2E-KEY-1', 'E2E-KEY-2']).toContain(mine.credentials.keys[0]);

    // 10 ─ Cleanup: remove the dedicated test product
    await page.request.delete(`${BASE}/api/products/${product.id}`);
  });

  test('wrong password is rejected with an Arabic error', async ({ page }) => {
    const user = mkUser('passcheck');
    // Provision the account through the API first (order-independent)
    const reg = await page.request.post(`${BASE}/api/login`, {
      data: { email: user.email, name: user.name, password: user.password, isRegistering: true },
    });
    const body = await reg.json();
    expect(body.id).toBeTruthy();

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').fill(user.email);
    await page.locator('input[type="password"]').fill('definitely-wrong');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=كلمة المرور غير صحيحة')).toBeVisible({ timeout: 15_000 });
  });

  test('storefront shows seeded categories and banners', async ({ page }) => {
    await registerViaUi(page, mkUser('browser'));
    await expect(page.locator('text=حسابات مميزة').first()).toBeVisible();
    await expect(page.locator('text=خدمات الألعاب').first()).toBeVisible();
    await expect(page.locator('text=باقة ChatGPT Plus السنوية').first()).toBeVisible();
  });
});

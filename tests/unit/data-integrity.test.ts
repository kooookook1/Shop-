import { describe, it, expect } from 'vitest';
import { initialProducts, initialUsers, initialOrders, initialTransactions, initialMessages } from '../../src/data';

/**
 * Seed-data integrity regression tests — these guard the reference pricing,
 * categories and credentials the storefront relies on before first sync.
 */

describe('seed products integrity', () => {
  it('has unique product ids', () => {
    const ids = initialProducts.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every product carries required commercial fields', () => {
    for (const p of initialProducts) {
      expect(p.name.length, `${p.id} name`).toBeGreaterThan(2);
      expect(p.price, `${p.id} price`).toBeGreaterThan(0);
      expect(p.stock, `${p.id} stock`).toBeGreaterThanOrEqual(0);
      expect(p.features.length, `${p.id} features`).toBeGreaterThan(0);
      expect(p.rating, `${p.id} rating`).toBeLessThanOrEqual(5);
    }
  });

  it('uses only known storefront categories', () => {
    const valid = new Set(['accounts', 'entertainment', 'productivity', 'games']);
    for (const p of initialProducts) {
      expect(valid.has(p.category), `${p.id} unknown category ${p.category}`).toBe(true);
    }
  });

  it('discounted products never exceed their original price', () => {
    for (const p of initialProducts) {
      if (p.originalPrice !== undefined) {
        expect(p.price, `${p.id} price < originalPrice`).toBeLessThanOrEqual(p.originalPrice);
      }
    }
  });
});

describe('seed users / orders / transactions integrity', () => {
  it('user emails are unique', () => {
    const emails = initialUsers.map(u => u.email.toLowerCase());
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('orders reference real seeded products', () => {
    const productIds = new Set(initialProducts.map(p => p.id));
    for (const o of initialOrders) {
      expect(productIds.has(o.productId), `${o.id} → ${o.productId}`).toBe(true);
    }
  });

  it('transactions have consistent money fields', () => {
    for (const t of initialTransactions) {
      expect(t.price, t.id).toBeGreaterThan(0);
      expect(['مكتمل', 'قيد الانتظار', 'ملغى']).toContain(t.status);
    }
  });

  it('chat seed has at least one agent greeting', () => {
    expect(initialMessages.some(m => m.sender === 'agent')).toBe(true);
  });
});

describe('pricing helpers (mirrors server rules)', () => {
  // Mirrors the monthly-equivalent rule used in server.ts /api/orders
  const monthlyOf = (price: number) => Number((price / 12).toFixed(2));
  const isSubscription = (cat: string) => ['accounts', 'entertainment', 'productivity'].includes(cat);

  it('monthly plans equal price/12 rounded to cents', () => {
    expect(monthlyOf(89.99)).toBe(7.5);
    expect(monthlyOf(35)).toBe(2.92);
  });

  it('games are never treated as subscriptions', () => {
    expect(isSubscription('games')).toBe(false);
    expect(isSubscription('entertainment')).toBe(true);
  });
});

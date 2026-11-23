import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubtotal, calculateDiscount, shippingCharge,
  hasEnoughStock, applyStoreCredit, renderCustomerNote, getRecentOrders,
} from './checkout.mjs';

test('subtotal multiplies unit prices by quantities', () => {
  assert.equal(calculateSubtotal([{ unitPrice: 12, quantity: 3 }, { unitPrice: 5, quantity: 2 }]), 46);
});

test('percentage promotions reduce the subtotal by the stated percent', () => {
  assert.equal(calculateDiscount(200, { type: 'percent', amount: 10 }), 20);
});

test('free shipping starts at exactly the configured threshold', () => {
  assert.equal(shippingCharge(50, 50), 0);
});

test('an order can use the last available unit in stock', () => {
  assert.equal(hasEnoughStock({ sku: 'A-1', quantity: 3 }, { 'A-1': 3 }), true);
});

test('store credit cannot produce a negative amount due', () => {
  assert.equal(applyStoreCredit(12, 50), 0);
});

test('customer notes are escaped before insertion into HTML', () => {
  assert.match(renderCustomerNote('<img src=x onerror=alert(1)>'), /&lt;img/);
});

test('finding recent orders does not reorder the input array', () => {
  const orders = [{ id: 'older', createdAt: '2026-01-01' }, { id: 'newer', createdAt: '2026-02-01' }];
  getRecentOrders(orders);
  assert.deepEqual(orders.map(({ id }) => id), ['older', 'newer']);
});

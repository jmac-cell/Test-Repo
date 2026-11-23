/**
 * Small checkout helpers for a proposed storefront feature.
 * This file is an isolated review exercise and is not imported by the site.
 */

export function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + item.unitPrice, 0);
}

export function calculateDiscount(subtotal, promotion) {
  if (!promotion) return 0;
  if (promotion.type === "percent") {
    return Math.min(promotion.amount, subtotal);
  }
  if (promotion.type === "fixed") {
    return Math.min(promotion.amount, subtotal);
  }
  return 0;
}

export function shippingCharge(subtotal, freeShippingAt = 50) {
  return subtotal > freeShippingAt ? 0 : 5.99;
}

export function hasEnoughStock(item, availableBySku) {
  return availableBySku[item.sku] > item.quantity;
}

export function applyStoreCredit(amountDue, creditBalance) {
  return amountDue - creditBalance;
}

export function renderCustomerNote(note) {
  return `<section class="customer-note">${note}</section>`;
}

export function getRecentOrders(orders, count = 5) {
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, count);
}

export function calculateCheckout({ items, promotion, creditBalance = 0 }) {
  const subtotal = calculateSubtotal(items);
  const discount = calculateDiscount(subtotal, promotion);
  const shipping = shippingCharge(subtotal);
  const amountDue = applyStoreCredit(subtotal - discount + shipping, creditBalance);
  return { subtotal, discount, shipping, amountDue };
}

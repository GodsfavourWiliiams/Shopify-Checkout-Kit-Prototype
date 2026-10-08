import assert from 'node:assert/strict';
import test from 'node:test';
import { describeCheckoutError } from '../app/checkout-error.js';

test('does not claim an SDK-invalid cart is unusable in a browser', () => {
  assert.deepEqual(
    describeCheckoutError({
      status: 'error',
      messages: [{ code: 'invalid_cart', content: 'The cart is no longer valid', severity: 'unrecoverable' }],
    }),
    {
      code: 'invalid_cart',
      title: 'Checkout Kit could not use this cart.',
      detail: 'Shopify rejected this cart in Checkout Kit mode. The original link may still work in a regular browser tab; open it directly to compare, or try a newly generated checkout link.',
    },
  );
});

test('retains a useful provider message for other checkout failures', () => {
  assert.deepEqual(
    describeCheckoutError({ messages: [{ code: 'checkout_failed', content: 'Payment method unavailable' }] }),
    {
      code: 'checkout_failed',
      title: 'Shopify checkout could not continue.',
      detail: 'Payment method unavailable',
    },
  );
});

test('handles a missing or empty error payload', () => {
  assert.equal(describeCheckoutError(undefined).code, 'unknown_error');
  assert.match(describeCheckoutError({ messages: [] }).detail, /fresh checkout link/);
});

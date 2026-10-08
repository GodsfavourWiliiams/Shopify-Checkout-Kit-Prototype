import assert from 'node:assert/strict';
import test from 'node:test';
import { describeCheckoutError } from '../app/checkout-error.js';

test('explains an expired or invalid cart with a recovery step', () => {
  assert.deepEqual(
    describeCheckoutError({
      status: 'error',
      messages: [{ code: 'invalid_cart', content: 'The cart is no longer valid', severity: 'unrecoverable' }],
    }),
    {
      code: 'invalid_cart',
      title: 'This checkout link is no longer valid.',
      detail: 'Create a new cart or checkout session and paste its new link. The old link cannot be reused.',
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

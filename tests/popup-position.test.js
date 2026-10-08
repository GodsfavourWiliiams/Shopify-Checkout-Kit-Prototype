import assert from 'node:assert/strict';
import test from 'node:test';
import { openCheckoutAtRight, rightAlignPopupFeatures } from '../app/popup-position.js';

test('moves Checkout Kit popup features to the host window right edge', () => {
  const original = 'width=600,height=600,left=656,top=200,scrollbars=yes';
  assert.equal(
    rightAlignPopupFeatures(original, { screenX: 0, outerWidth: 1913 }),
    'width=600,height=600,left=1289,top=200,scrollbars=yes',
  );
});

test('does not change a new-tab call with no popup geometry', () => {
  assert.equal(rightAlignPopupFeatures(undefined, { screenX: 0, outerWidth: 1913 }), undefined);
});

test('limits window.open override to the synchronous Checkout Kit call', () => {
  const calls = [];
  const originalOpen = (url, target, features) => {
    calls.push({ url, target, features });
    return { closed: false };
  };
  const browserWindow = {
    open: originalOpen,
    screen: { availLeft: 100, availWidth: 1200 },
    screenX: 200,
    outerWidth: 900,
  };
  const checkout = {
    open() {
      browserWindow.open('https://shop.example/checkouts/cn/test', '', 'width=600,height=600,left=400,top=200');
    },
  };

  openCheckoutAtRight(checkout, browserWindow);

  assert.equal(calls[0].features, 'width=600,height=600,left=676,top=200');
  assert.equal(browserWindow.open, originalOpen);
});

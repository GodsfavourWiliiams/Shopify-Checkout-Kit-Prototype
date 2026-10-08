const WIDTH_FEATURE = /(?:^|,)width=(\d+)(?=,|$)/;
const LEFT_FEATURE = /(^|,)left=-?\d+(?=,|$)/;

export function rightAlignPopupFeatures(features, { screenX, outerWidth }) {
  if (typeof features !== 'string') return features;

  const width = Number(WIDTH_FEATURE.exec(features)?.[1]);
  if (!width || !LEFT_FEATURE.test(features)) return features;

  const windowLeft = Number.isFinite(screenX) ? screenX : 0;
  const windowWidth = Number.isFinite(outerWidth) ? outerWidth : width;
  const rightMargin = 24;
  const left = Math.round(windowLeft + Math.max(0, windowWidth - width - rightMargin));

  return features.replace(LEFT_FEATURE, (_, separator) => `${separator}left=${left}`);
}

// Checkout Kit alpha.4 calls window.open synchronously but exposes no popup
// position option. Keep this prototype-only override limited to that call.
export function openCheckoutAtRight(checkout, browserWindow) {
  const originalOpen = browserWindow.open;
  const override = function (url, target, features) {
    const positionedFeatures = rightAlignPopupFeatures(features, {
      screenX: browserWindow.screen?.availLeft ?? browserWindow.screenX ?? browserWindow.screenLeft,
      outerWidth: browserWindow.screen?.availWidth ?? browserWindow.outerWidth ?? browserWindow.innerWidth,
    });
    return originalOpen.call(browserWindow, url, target, positionedFeatures);
  };

  try {
    browserWindow.open = override;
  } catch {
    checkout.open();
    return;
  }

  if (browserWindow.open !== override) {
    try {
      checkout.open();
    } finally {
      browserWindow.open = originalOpen;
    }
    return;
  }

  try {
    checkout.open();
  } finally {
    browserWindow.open = originalOpen;
  }
}

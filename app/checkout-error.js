export function describeCheckoutError(error) {
  const message = Array.isArray(error?.messages)
    ? error.messages.find((entry) => entry && typeof entry === 'object')
    : null;
  const code = typeof message?.code === 'string' && message.code
    ? message.code
    : typeof error?.code === 'string' && error.code
      ? error.code
      : 'unknown_error';

  if (code === 'invalid_cart') {
    return {
      code,
      title: 'Checkout Kit could not use this cart.',
      detail: 'Shopify rejected this cart in Checkout Kit mode. The original link may still work in a regular browser tab; open it directly to compare, or try a newly generated checkout link.',
    };
  }

  const providerMessage = typeof message?.content === 'string' && message.content.trim()
    ? message.content.trim()
    : null;

  return {
    code,
    title: 'Shopify checkout could not continue.',
    detail: providerMessage || 'Try again with a fresh checkout link. If it still fails, report the error code shown here.',
  };
}

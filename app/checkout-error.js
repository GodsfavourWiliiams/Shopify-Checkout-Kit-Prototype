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
      title: 'This checkout link is no longer valid.',
      detail: 'Create a new cart or checkout session and paste its new link. The old link cannot be reused.',
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

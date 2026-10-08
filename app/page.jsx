'use client';

import { useEffect, useRef, useState } from 'react';

const EVENT_MESSAGES = {
  'ec.start': 'Checkout loaded in the popup.',
  'ec.complete': 'Shopify reported checkout complete.',
  'ec.close': 'Checkout popup closed.',
  'ec.error': 'Checkout Kit reported an error.',
  'ec.fulfillment.change': 'Fulfillment details changed.',
  'ec.line_items.change': 'Line items changed.',
  'ec.totals.change': 'Checkout totals changed.',
  'ec.messages.change': 'Checkout messages changed.',
};

export default function Home() {
  const containerRef = useRef(null);
  const checkoutRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('Loading Checkout Kit…');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const container = containerRef.current;

    import('@shopify/checkout-kit')
      .then(() => {
        if (cancelled || !container) return;

        const checkout = document.createElement('shopify-checkout');
        checkout.target = 'popup';
        checkoutRef.current = checkout;
        container.append(checkout);

        for (const [name, message] of Object.entries(EVENT_MESSAGES)) {
          checkout.addEventListener(
            name,
            (event) => {
              setStatus(message);
              setEvents((previous) => [
                { id: crypto.randomUUID(), name, time: new Date().toLocaleTimeString() },
                ...previous,
              ]);

              if (name === 'ec.error') {
                console.error('Checkout Kit error', event.detail?.error);
              }
            },
            { signal: controller.signal },
          );
        }

        setReady(true);
        setStatus('Ready for a checkout URL.');
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus('Could not load Checkout Kit. Check the browser console.');
          console.error('Checkout Kit import failed', error);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      checkoutRef.current?.remove();
      checkoutRef.current = null;
    };
  }, []);

  function openCheckout(event) {
    event.preventDefault();

    let checkoutUrl;
    try {
      checkoutUrl = new URL(url.trim());
    } catch {
      setStatus('Enter a valid URL.');
      return;
    }

    if (checkoutUrl.protocol !== 'https:') {
      setStatus('Checkout Kit requires an HTTPS URL.');
      return;
    }

    const checkout = checkoutRef.current;
    if (!checkout) {
      setStatus('Checkout Kit is still loading.');
      return;
    }

    checkout.src = checkoutUrl.href;
    setEvents((previous) => [
      { id: crypto.randomUUID(), name: 'open requested', time: new Date().toLocaleTimeString() },
      ...previous,
    ]);
    setStatus('Opening Shopify checkout in a separate popup window…');
    checkout.open();
  }

  function closeCheckout() {
    checkoutRef.current?.close();
    setStatus('Popup close requested.');
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">Isolated Next.js proof of concept</p>
        <h1>Shopify Checkout Kit for Web</h1>
        <p>
          Test a real Shopify checkout URL in a popup while this page stays open.
          Checkout will not render inside this page or a drawer.
        </p>
      </header>

      <form className="panel" onSubmit={openCheckout}>
        <label htmlFor="checkout-url">Shopify checkout URL</label>
        <input
          id="checkout-url"
          type="url"
          inputMode="url"
          placeholder="https://store.myshopify.com/checkouts/cn/..."
          autoComplete="off"
          spellCheck="false"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
        <p className="hint">
          Paste the complete HTTPS checkout URL returned by the backend. This demo
          does not save it or add it to the event log.
        </p>
        <div className="actions">
          <button type="submit" disabled={!ready}>Open checkout popup</button>
          <button type="button" className="secondary" onClick={closeCheckout}>Close popup</button>
        </div>
        <p role="status" aria-live="polite">{status}</p>
      </form>

      <section className="panel" aria-labelledby="events-title">
        <div className="events-heading">
          <h2 id="events-title">Checkout events</h2>
          <button type="button" className="text-button" onClick={() => setEvents([])}>Clear</button>
        </div>
        {events.length === 0 ? (
          <p className="hint">No events yet.</p>
        ) : (
          <ol className="events" aria-live="polite">
            {events.map((event) => (
              <li key={event.id}>
                <time>{event.time}</time>
                <strong>{event.name}</strong>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div ref={containerRef} />
    </main>
  );
}

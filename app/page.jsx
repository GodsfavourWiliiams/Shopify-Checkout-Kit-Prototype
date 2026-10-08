'use client';

import { useEffect, useRef, useState } from 'react';
import { describeCheckoutError } from './checkout-error';

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
  const lastErrorRef = useRef(null);
  const confirmationTimerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [checkoutWindowOpen, setCheckoutWindowOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [attemptedUrl, setAttemptedUrl] = useState('');
  const [status, setStatus] = useState('Loading Checkout Kit…');
  const [events, setEvents] = useState([]);
  const [checkoutError, setCheckoutError] = useState(null);

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
              if (['ec.start', 'ec.complete', 'ec.close', 'ec.error'].includes(name)) {
                clearTimeout(confirmationTimerRef.current);
                confirmationTimerRef.current = null;
              }

              if (name === 'ec.error') {
                const failure = describeCheckoutError(event.detail?.error);
                lastErrorRef.current = failure;
                setCheckoutError(failure);
                setStatus(failure.title);
                setEvents((previous) => [
                  { id: crypto.randomUUID(), name, detail: failure.code, time: new Date().toLocaleTimeString() },
                  ...previous,
                ]);
                return;
              }

              if (name === 'ec.start') {
                lastErrorRef.current = null;
                setCheckoutError(null);
              }
              if (name === 'ec.close') setCheckoutWindowOpen(false);

              // An unrecoverable SDK error closes the popup. Keep the useful
              // error visible instead of replacing it with "popup closed".
              if (name !== 'ec.close' || !lastErrorRef.current) {
                setStatus(message);
              }
              setEvents((previous) => [
                { id: crypto.randomUUID(), name, time: new Date().toLocaleTimeString() },
                ...previous,
              ]);
            },
            { signal: controller.signal },
          );
        }

        setReady(true);
        setStatus('Ready for a checkout URL.');
      })
      .catch((error) => {
        if (!cancelled) {
          const failure = {
            code: 'sdk_load_failed',
            title: 'Checkout Kit could not load.',
            detail: error instanceof Error ? error.message : 'Refresh the page and try again.',
          };
          lastErrorRef.current = failure;
          setCheckoutError(failure);
          setStatus(failure.title);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(confirmationTimerRef.current);
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

    lastErrorRef.current = null;
    setCheckoutError(null);
    setAttemptedUrl(checkoutUrl.href);
    clearTimeout(confirmationTimerRef.current);
    checkout.src = checkoutUrl.href;
    setEvents((previous) => [
      { id: crypto.randomUUID(), name: 'open requested', time: new Date().toLocaleTimeString() },
      ...previous,
    ]);
    setStatus('Opening Shopify checkout in a separate window or tab…');
    try {
      checkout.open();
      setCheckoutWindowOpen(true);
      confirmationTimerRef.current = setTimeout(() => {
        const failure = {
          code: 'checkout_not_confirmed',
          title: 'Checkout did not confirm opening.',
          detail: 'The popup may have been blocked, or Shopify may still be loading. Try opening it again from this page, or use the original checkout link below.',
        };
        lastErrorRef.current = failure;
        setCheckoutError(failure);
        setStatus(failure.title);
      }, 20000);
    } catch (error) {
      setCheckoutWindowOpen(false);
      const failure = {
        code: 'popup_open_failed',
        title: 'The checkout popup could not open.',
        detail: error instanceof Error ? error.message : 'Allow popups for this site, then try again.',
      };
      lastErrorRef.current = failure;
      setCheckoutError(failure);
      setStatus(failure.title);
    }
  }

  function closeCheckout() {
    clearTimeout(confirmationTimerRef.current);
    confirmationTimerRef.current = null;
    checkoutRef.current?.close();
    setCheckoutWindowOpen(false);
    if (!lastErrorRef.current) setStatus('Popup close requested.');
  }

  return (
    <main className="app">
      {checkoutWindowOpen && (
        <button
          type="button"
          className="checkout-focus-button"
          onClick={() => checkoutRef.current?.focus()}
        >
          Continue in checkout window ↗
        </button>
      )}
      <header>
        <p className="eyebrow">Isolated Next.js proof of concept</p>
        <h1>Shopify Checkout Kit for Web</h1>
        <p>
          Test a real Shopify checkout URL while this page stays open. Depending
          on your browser, checkout may open in a popup window or a new tab.
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
          onChange={(event) => {
            setUrl(event.target.value);
            setCheckoutError(null);
            setAttemptedUrl('');
            lastErrorRef.current = null;
            clearTimeout(confirmationTimerRef.current);
            confirmationTimerRef.current = null;
          }}
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
        {checkoutError && (
          <div className="error-panel" role="alert">
            <strong>{checkoutError.title}</strong>
            <p>{checkoutError.detail}</p>
            <small>Error code: <code>{checkoutError.code}</code></small>
            {attemptedUrl && (
              <a className="fallback-link" href={attemptedUrl} target="_blank" rel="noopener noreferrer">
                Open the original checkout link in a new tab
              </a>
            )}
          </div>
        )}
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
                {event.detail && <span className="event-detail">{event.detail}</span>}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div ref={containerRef} />
    </main>
  );
}

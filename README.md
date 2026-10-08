# Merissa Checkout Kit demo

Standalone proof of concept for Shopify Checkout Kit for Web. This repository is
separate from the Merissa application; it does not change the app's checkout
flow, dependencies, or Git state.

## Run

```sh
npm install
npm run dev
```

Open `http://localhost:5174`. Paste an active HTTPS Shopify checkout URL
(for example, the `actionUrl` from the Merissa checkout response), then click
**Open checkout popup**. Watch the event log for `ec.start`, `ec.complete`,
`ec.close`, `ec.error`, and checkout update events.

The browser may block popups unless the open action is triggered by a click.
The demo hides Checkout Kit's blocking overlay and shows a small top-left
button to refocus the checkout window. If checkout does not confirm opening
within 20 seconds, the page offers a retry and a direct-link fallback. Some
browsers may open checkout in a new tab even when the SDK requests a popup.

Checkout Kit centers its popup. Its supported CSS options control dimensions,
not the popup's screen position, so this demo does not try to force it to the
right side of the display.

If Shopify reports `invalid_cart`, Checkout Kit may close the popup. That does
not prove the original URL is invalid in a normal browser. The page preserves
the SDK error and offers a direct-link comparison. Other SDK errors are shown
in the page instead of opening a Next.js development error overlay.

Checkout Kit for Web currently uses a separate popup window or browser tab.
It does **not** render Shopify checkout in an iframe or the Merissa drawer.
The SDK is an alpha preview and is not production-ready.

Do not commit live checkout URLs. The page logs event names only; error details
are available in the local browser console.

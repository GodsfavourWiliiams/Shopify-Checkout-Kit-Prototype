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
Checkout Kit handles this with a retry control on its overlay.

Checkout Kit for Web currently uses a separate popup window or browser tab.
It does **not** render Shopify checkout in an iframe or the Merissa drawer.
The SDK is an alpha preview and is not production-ready.

Do not commit live checkout URLs. The page logs event names only; error details
are available in the local browser console.

import './globals.css';

export const metadata = {
  title: 'Merissa Checkout Kit Demo',
  description: 'Standalone Shopify Checkout Kit for Web proof of concept',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

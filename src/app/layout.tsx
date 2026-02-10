import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  description: 'An interactive travel map and memory gallery of places we have explored together.',
  title: 'Memory Lane',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
